class FeedArchive {
  constructor(settings) {
    this.settings = settings;
    this.isArchiving = false;
    this.archivedTweets = new Map();
    this.lastSaveTime = Date.now();
    this.observer = null;
    this.debugMode = settings?.debugMode ?? false;
  }

  async initialize() {
    try {
      // Load existing archived tweets
      const data = await chrome.storage.local.get('feedArchive');
      if (data.feedArchive) {
        const parsed = JSON.parse(data.feedArchive);
        parsed.tweets.forEach(tweet => {
          this.archivedTweets.set(tweet.url, tweet);
        });
      }

      if (this.settings.feedArchiveEnabled) {
        await this.start();
      }
    } catch (error) {
      this.logError('Initialization error:', error);
    }
  }

  async start() {
    if (this.isArchiving) return;
    this.isArchiving = true;
    
    try {
      await this.processCurrentTweets();
      this.setupObserver();
      this.log('Feed archiving started');
    } catch (error) {
      this.logError('Start error:', error);
      this.stop();
    }
  }

  stop() {
    this.isArchiving = false;
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.log('Feed archiving stopped');
  }

  setupObserver() {
    this.observer = new MutationObserver(async () => {
      if (!this.settings.feedArchiveEnabled || !this.isArchiving) {
        this.stop();
        return;
      }

      await this.processCurrentTweets();
    });

    const mainContent = document.querySelector('main');
    if (mainContent) {
      this.observer.observe(mainContent, {
        childList: true,
        subtree: true
      });
    }
  }

  async processCurrentTweets() {
    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
    
    for (const tweet of tweets) {
      try {
        const tweetData = await this.extractTweetData(tweet);
        if (tweetData) {
          await this.archiveTweet(tweetData);
        }
      } catch (error) {
        this.logError('Error processing tweet:', error);
      }
    }

    // Save periodically
    if (Date.now() - this.lastSaveTime > this.settings.archiveInterval) {
      await this.saveToStorage();
    }
  }

  async extractTweetData(tweetElement) {
    try {
      if (tweetElement.querySelector('[data-testid="tweet-promoted-indicator"]')) {
        return null;
      }

      const tweetUrl = this.getTweetUrl(tweetElement);
      if (!tweetUrl || this.archivedTweets.has(tweetUrl)) {
        return null;
      }

      // Extract tweet metadata
      const isReply = !!tweetElement.querySelector('[data-testid="reply"]');
      const isRepost = !!tweetElement.querySelector('[data-testid="socialContext"]');

      // Check settings
      if (isReply && !this.settings.archiveReplies) return null;
      if (isRepost && !this.settings.archiveReposts) return null;

      return {
        url: tweetUrl,
        username: tweetElement.querySelector('[data-testid="User-Name"]')?.innerText.split('\n')[0],
        handle: tweetElement.querySelector('[data-testid="User-Name"]')?.innerText.split('\n')[1],
        text: tweetElement.querySelector('[data-testid="tweetText"]')?.innerText,
        time: tweetElement.querySelector('time')?.getAttribute('datetime'),
        isReply,
        isRepost,
        parentTweetUrl: this.getParentTweetUrl(tweetElement),
        mediaItems: this.extractMediaItems(tweetElement),
        archivedAt: new Date().toISOString()
      };
    } catch (error) {
      this.logError('Error extracting tweet data:', error);
      return null;
    }
  }

  getTweetUrl(tweetElement) {
    const headerLink = tweetElement.querySelector('[data-testid="User-Name"] a[href*="/status/"]');
    return headerLink?.href || null;
  }

  getParentTweetUrl(tweetElement) {
    const replyTo = tweetElement.querySelector('[data-testid="socialContext"] a');
    return replyTo?.href || null;
  }

  extractMediaItems(tweetElement) {
    const mediaItems = [];
    
    // Extract images
    tweetElement.querySelectorAll('img[src*="/media/"]').forEach(img => {
      mediaItems.push({
        type: 'image',
        url: img.src,
        alt: img.alt || '',
        originalUrl: img.src.replace(/&name=.+$/, "&name=orig")
      });
    });

    // Extract videos
    tweetElement.querySelectorAll('video').forEach(video => {
      if (video.poster) {
        mediaItems.push({
          type: 'video',
          url: video.src || '',
          thumbnailUrl: video.poster,
          alt: video.title || ''
        });
      }
    });

    return mediaItems;
  }

  async archiveTweet(tweetData) {
    if (!tweetData || this.archivedTweets.has(tweetData.url)) return;

    this.archivedTweets.set(tweetData.url, tweetData);
    this.log(`Archived tweet: ${tweetData.url}`);

    if (this.archivedTweets.size >= this.settings.maxArchiveSize) {
      await this.pruneOldTweets();
    }
  }

  async pruneOldTweets() {
    const tweets = Array.from(this.archivedTweets.values())
      .sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt));
    
    while (tweets.length > this.settings.maxArchiveSize) {
      const oldestTweet = tweets.pop();
      this.archivedTweets.delete(oldestTweet.url);
    }

    await this.saveToStorage();
    this.log(`Pruned archive to ${this.archivedTweets.size} tweets`);
  }

  async saveToStorage() {
    try {
      const data = {
        tweets: Array.from(this.archivedTweets.values()),
        lastUpdated: new Date().toISOString()
      };

      await chrome.storage.local.set({
        feedArchive: JSON.stringify(data)
      });

      this.lastSaveTime = Date.now();
      this.log(`Saved ${this.archivedTweets.size} tweets to storage`);
    } catch (error) {
      this.logError('Error saving to storage:', error);
    }
  }

  log(message) {
    if (this.debugMode) {
      console.log(`[FeedArchive] ${message}`);
    }
  }

  logError(message, error) {
    if (this.debugMode) {
      console.error(`[FeedArchive] ${message}`, error);
    }
  }
}

export default FeedArchive;