///* Welcome to Tweet Saver *///

// Simple debug logging system
const debug = {
  enabled: true, // Default to true since debug mode is working
  log: (message, ...args) => {
    if (debug.enabled) {
      console.log(`[Tweet Saver] ${message}`, ...args);
    }
  },
  error: (message, error, ...args) => {
    if (debug.enabled) {
      console.error(`[Tweet Saver] ${message}:`, error, ...args);
    }
  },
  warn: (message, ...args) => {
    if (debug.enabled) {
      console.warn(`[Tweet Saver] ${message}`, ...args);
    }
  }
};

// Export debug functions for use throughout the code
const debugLog = debug.log;
const debugError = debug.error;
const debugWarn = debug.warn;
const initializeDebugMode = (enabled) => {
  debug.enabled = enabled;
  if (enabled) {
    console.log('Debug mode initialized:', enabled);
  }
};

const getColorScheme = () => {
  const htmlElement = document.documentElement;
  const colorScheme = getComputedStyle(htmlElement).getPropertyValue('color-scheme').trim();

  if (debugMode) {
    console.log('Color scheme:', colorScheme);
    console.log('HTML Element:', htmlElement);
  }

  return colorScheme || 'dark';
};

//console.log(getColorScheme());



/////// Declarations ///////

const browser = chrome || browser;

// Options
let enableExtension = true;
let saveLastTweetEnabled = true;
let browserStorageType = 'sync';
let debugMode = false;
let enablePhotoUrlSave = true;
let styleTheme = getColorScheme();

// Button icon paths
const iconPaths = {
  plus: {
    light: '../images/save-icons/plus-light.svg',
    dark: '../images/save-icons/plus-dark.svg',
    lightFilled: '../images/save-icons/plus-light-filled.svg',
    darkFilled: '../images/save-icons/plus-dark-filled.svg'
  },
  heart: {
    light: '../images/save-icons/heart-light.svg',
    dark: '../images/save-icons/heart-dark.svg',
    lightFilled: '../images/save-icons/heart-light-filled.svg',
    darkFilled: '../images/save-icons/heart-dark-filled.svg'
  },
  star: {
    light: '../images/save-icons/star-light.svg',
    dark: '../images/save-icons/star-dark.svg',
    lightFilled: '../images/save-icons/star-light-filled.svg',
    darkFilled: '../images/save-icons/star-dark-filled.svg'
  },
  cloud: {
    light: '../images/save-icons/cloud-light.svg',
    dark: '../images/save-icons/cloud-dark.svg',
    lightFilled: '../images/save-icons/cloud-light-filled.svg',
    darkFilled: '../images/save-icons/cloud-dark-filled.svg'
  }
};

// Add this after the iconPaths declaration
let cachedIconUrls = {};

// Add this function after the iconPaths declaration
const initializeIconUrls = () => {
  for (const style in iconPaths) {
    cachedIconUrls[style] = {
      light: chrome.runtime.getURL(iconPaths[style].light),
      dark: chrome.runtime.getURL(iconPaths[style].dark),
      lightFilled: chrome.runtime.getURL(iconPaths[style].lightFilled),
      darkFilled: chrome.runtime.getURL(iconPaths[style].darkFilled)
    };
  }
};

// Global settings object that will contain all settings
let settings = {
  enableExtension: true,
  saveLastTweetEnabled: true,
  browserStorageType: 'sync',
  debugMode: false,
  enablePhotoUrlSave: true,
  styleTheme: styleTheme,
  notificationsEnabled: true,
  autoSave: false,
  saveDelay: 500,
  saveOnlyMedia: false,
  saveTweetMetadata: true,
  saveIconStyle: 'cloud',
  saveIconPosition: 'bottom',
  storageType: 'sync'
};

let optionsState = {
  enableExtension: true,
  saveLastTweetEnabled: true,
  browserStorageType: 'sync', // local or sync
  debugMode: false,
  enablePhotoUrlSave: true, 
  styleTheme: styleTheme
};

const defaultOptions = {
  enableExtension: true,
  saveLastTweetEnabled: true,
  browserStorageType: 'sync',
  debugMode: false,
  enablePhotoUrlSave: true,
  styleTheme: styleTheme
};

const optionsList = [
  "enableExtension",
  "saveLastTweetEnabled",
  "browserStorageType",
  "debugMode",
  "enablePhotoUrlSave", 
  "styleTheme",
];


// Get initial page URL
let url = window.location.href;
const homepageUrl = "https://x.com/home";

// browser.storage variables
let urlsFromStorage = 'tweetUrls';
let tweetsFromStorage = 'tweets';

// Arrays to hold URLs and tweets
let recentUrls = [];
// let savedUrls = JSON.parse(localStorage.getItem('tweet-saver--urls')) || [];
// let savedTweets = JSON.parse(localStorage.getItem('tweet-saver--tweets')) || [];
let savedUrls = [];
let savedTweets = [];


class Tweet {
  constructor(tweet) {
    const { 
      username, 
      handle, 
      time, 
      text, 
      content, 
      likes, 
      replies, 
      retweets, 
      views, 
      fullTweet, 
      url, 
      other, 
      loggedInAccount, 
      links,
      mediaItems,
      profileImageUrl
    } = tweet;

    this.username = username;
    this.handle = handle;
    this.time = time;
    this.text = text || '';  // Ensure text is never undefined
    this.content = content;
    this.likes = likes;
    this.replies = replies;
    this.retweets = retweets;
    this.views = views;
    this.fullTweet = fullTweet;
    this.url = url;
    this.other = other;
    this.loggedInAccount = loggedInAccount;
    this.links = links;
    this.mediaItems = mediaItems || [];
    this.profileImageUrl = profileImageUrl;
    this.savedAt = new Date().toISOString();
    this.lastUpdated = new Date().toISOString();
  }

  async saveTweet() {
    try {
      // Check extension context before proceeding
      if (!isExtensionContextValid()) {
        if (debugMode) console.log('Extension context invalid, reloading page...');
        //window.location.reload();
        return;
      }

      // First check if URL is already saved
      if (!isUrlSaved(this.url)) {
        savedUrls.push(this.url);
        showNotification('Tweet saved successfully', 'success');
      } else {
        // Update existing tweet
        showNotification('Tweet updated successfully', 'info');
      }

      // Find existing tweet index
      const existingTweetIndex = savedTweets.findIndex(savedTweet => savedTweet.url === this.url);

      if (existingTweetIndex !== -1) {
        // Update existing tweet while preserving original savedAt time
        const originalSavedAt = savedTweets[existingTweetIndex].savedAt;
        this.savedAt = originalSavedAt;
        this.lastUpdated = new Date().toISOString();
        savedTweets[existingTweetIndex] = this;
        if (debugMode) console.log('Tweet updated:', this.url);
      } else {
        // Save the new tweet
        savedTweets.push(this);
        if (debugMode) console.log('New tweet saved:', this.url);
      }
      
      // Save to browser storage
      await saveDataToStorage(savedUrls, savedTweets);

    } catch (error) {
      if (debugMode) console.error('Tweet.saveTweet - Error saving Tweet:', error);
      showNotification('Error saving tweet', 'error');
      
      // If extension context is invalid, reload the page
      if (!isExtensionContextValid()) {
        if (debugMode) console.log('Extension context invalid after save attempt, reloading page...');
        window.location.reload();
      }
    }
  }
}








//////// Main functions ///////

const getSavedData = async () => {
  try {
    // Get data from both storages to not lose any tweets
    const [localData, syncData] = await Promise.all([
      chrome.storage.local.get(['tweetUrls', 'tweets']),
      chrome.storage.sync.get(['tweetUrls', 'tweets'])
    ]);
    
    if (debugMode) {
      console.log('getSavedData - Storage data:', { localData, syncData });
    }

    // Parse and combine data from both storages
    const localTweetUrls = JSON.parse(localData.tweetUrls || '[]');
    const syncTweetUrls = JSON.parse(syncData.tweetUrls || '[]');
    const localTweets = JSON.parse(localData.tweets || '[]');
    const syncTweets = JSON.parse(syncData.tweets || '[]');

    // Combine and deduplicate
    const allTweets = [...localTweets, ...syncTweets];
    const allUrls = [...localTweetUrls, ...syncTweetUrls];
    
    savedTweets = Array.from(new Map(allTweets.map(tweet => [tweet.url, tweet])).values());
    savedUrls = [...new Set(allUrls)];

    if (debugMode) {
      console.log('getSavedData - Combined data:', { savedTweets, savedUrls });
    }
  } catch (error) {
    if (debugMode) console.error('getSavedData - Error getting saved data:', error);
  }
};

const saveDataToStorage = async (tweetUrls, tweets) => {
  try {
    // Check if extension context is still valid
    if (!chrome.runtime?.id) {
      if (debugMode) console.log('Extension context invalid, reloading page...');
      //window.location.reload();
      return;
    }

    // Add retry logic
    let retryCount = 0;
    const maxRetries = 3;

    const attemptSave = async () => {
      try {
        await chrome.storage.local.set({ 
          tweetUrls: JSON.stringify(tweetUrls),
          tweets: JSON.stringify(tweets),
        });
        if (debugMode) console.log('Data saved successfully to local storage:', { tweetUrls, tweets });
      } catch (error) {
        if (debugMode) console.error('Save attempt failed:', error);
        
        // Check if extension context is still valid
        if (!chrome.runtime?.id) {
          if (debugMode) console.log('Extension context invalid during retry, reloading page...');
          //window.location.reload();
          return;
        }

        // Retry if we haven't exceeded max retries
        if (retryCount < maxRetries) {
          retryCount++;
          if (debugMode) console.log(`Retrying save (attempt ${retryCount} of ${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between retries
          return attemptSave();
        }
        
        // If we've exhausted retries, throw the error
        throw error;
      }
    };

    await attemptSave();
  } catch (error) {
    if (debugMode) console.error('saveDataToStorage - Error saving data:', error, { tweetUrls, tweets });
    showNotification('Error saving tweet. Please try again.', 'error');
  }
};

const saveUrl = async (currentUrl) => {
  try {
    if (!isUrlSaved(currentUrl)) {
      // Save the URL
      savedUrls.push(currentUrl);

      // Save to local storage
      //localStorage.setItem('tweet-saver--urls', JSON.stringify(savedUrls));

      // Save to browser storage
      await saveDataToStorage(savedUrls, savedTweets);

      if (debugMode) console.log('URL saved', savedUrls);
    } else if (!savedTweets?.some(savedTweet => savedTweet?.url === this.url)){
      // Save to browser storage
      await saveDataToStorage(savedUrls, savedTweets);
    } else {
      if (debugMode) console.log('URL already saved');
    }
  } catch (error) {
    if (debugMode) console.error('saveUrl - Error saving URL:', error);
  }
};

const parseNumericValue = (value) => {
  // Return 0 for null, undefined, or non-string/non-number values
  if (value === null || value === undefined) return 0;
  
  // If it's already a number, return it
  if (typeof value === 'number') return value;
  
  // Convert to string if it isn't already
  value = String(value).trim();
  
  // Return 0 for empty strings
  if (!value) return 0;
  
  // Remove any commas and convert to lowercase
  value = value.toLowerCase().replace(/,/g, '');
  
  try {
    // Handle 'k' (thousands)
    if (value.includes('k')) {
      return Math.round(parseFloat(value.replace('k', '')) * 1000);
    }
    
    // Handle 'M' (millions)
    if (value.includes('m')) {
      return Math.round(parseFloat(value.replace('m', '')) * 1000000);
    }
    
    // Handle 'B' (billions)
    if (value.includes('b')) {
      return Math.round(parseFloat(value.replace('b', '')) * 1000000000);
    }

    // If it's just a number, parse it
    const num = parseInt(value, 10);
    return isNaN(num) ? 0 : num;
  } catch (error) {
    if (debugMode) console.error('Error parsing numeric value:', error, 'Value:', value);
    return 0;
  }
};

const saveNewTweet = async (tweetElement, currentUrl) => {
  if (tweetElement) {
    try {
      let tweetUsername = tweetElement.querySelector('[data-testid="User-Name"]')?.innerText.split('\n');
      let tweetText = tweetElement.querySelector('[data-testid="tweetText"]')?.innerText;
      let timeElement = tweetElement.querySelector('time');
      let tweetTime = timeElement?.getAttribute('datetime') || timeElement?.innerText;
      let tweetInfo = tweetElement.querySelectorAll('[data-testid="app-text-transition-container"]');
      
      // Get the numeric values and parse them properly, handling both liked and unliked states
      const getLikeCount = (element) => {
        // First try the normal like button
        let count = element.querySelector('[data-testid="like"]')?.innerText;
        if (!count) {
          // If not found, try the liked state button
          count = element.querySelector('[data-testid="unlike"]')?.innerText;
        }
        return parseNumericValue(count || '0');
      };

      let tweetReplies = parseNumericValue(tweetElement.querySelector('[data-testid="reply"]')?.innerText || '0');
      let tweetRetweets = parseNumericValue(tweetElement.querySelector('[data-testid="retweet"]')?.innerText || '0');
      let tweetLikes = getLikeCount(tweetElement);
      let tweetBookmarkCount = parseNumericValue(tweetElement.querySelector('[data-testid="bookmark"]')?.innerText || '0');
      let username = tweetElement.querySelector('[data-testid="AppTabBar_Profile_Link"]')?.innerText || '';

      // Get profile image
      const profileImageUrl = tweetElement.querySelector('img[src*="profile_images"]')?.src;

      // Get media items (images and videos)
      const mediaItems = [];
      
      // Get images
      const images = Array.from(tweetElement.querySelectorAll('img[src*="/media/"]'));
      images.forEach(img => {
        if (img.src && !mediaItems.some(item => item.url === img.src)) {
          mediaItems.push({
            type: 'image',
            url: img.src,
            alt: img.alt || '',
            originalUrl: img.src.replace(/&name=.+$/, "&name=orig") // Get original size image
          });
        }
      });

      // Get videos
      const videos = Array.from(tweetElement.querySelectorAll('video'));
      videos.forEach(video => {
        const poster = video.poster;
        if (poster) {
          mediaItems.push({
            type: 'video',
            url: video.src || '',
            thumbnailUrl: poster,
            alt: video.title || ''
          });
        }
      });

      // Get tweet URL
      const tweetUrl = currentUrl || getTweetUrl(tweetElement);
      if (!tweetUrl) {
        if (debugMode) console.log('Could not find tweet URL');
        return;
      }

      const tweetObj = new Tweet({
        url: tweetUrl,
        fullTweet: tweetElement?.innerText,
        username: tweetUsername?.[0],
        handle: tweetUsername?.[1],
        text: tweetText,
        time: tweetTime,
        views: parseNumericValue(tweetInfo[0]?.innerText || '0'),
        replies: tweetReplies,
        retweets: tweetRetweets,
        likes: tweetLikes,
        bookmarkCount: tweetBookmarkCount,
        links: Array.from(tweetElement.querySelectorAll('a')).map(link => link.href),
        loggedInAccount: username,
        mediaItems,
        profileImageUrl
      });

      await tweetObj.saveTweet();
    } catch (error) {
      if (debugMode) console.error('saveNewTweet - Error:', error);
    }
  }
};

const deleteAllSavedData = async () => {
  try {
    // Clear browser storage
    await browser.storage.local.clear();
    
    // Clear local arrays
    savedUrls = [];
    savedTweets = [];
    
    // Clear localStorage
    localStorage.removeItem('tweet-saver--urls');
    localStorage.removeItem('tweet-saver--tweets');
    
    // Notify background script
    await browser.runtime.sendMessage({ 
      method: 'deleteAllTweets'
    });
    
    showNotification('All saved tweets have been deleted', 'info');
    
    if (debugMode) console.log('All saved data deleted');
  } catch (error) {
    if (debugMode) console.error('Error deleting all saved data:', error);
    showNotification('Error deleting saved tweets', 'error');
  }
}

// Logic for handling URL changes
const handleUrlChange = async (node) => {
  const currentUrl = location.href;

  if (currentUrl !== url) {
    url = currentUrl;

    if (isTweetUrl(currentUrl)) {
      // Check if extension is enabled and auto-save is enabled
      if (enableExtension && settings.autoSave) {
        // Auto-save the tweet if the setting is enabled
        if (debugMode) console.log('Auto-save is ON, saving tweet at:', currentUrl);
        
        // Find the tweet element
        const tweetElement = document.querySelector('article[data-testid="tweet"]');
        if (tweetElement) {
          // Save the new tweet
          await saveNewTweet(tweetElement, currentUrl);
        } else {
          // If we can't find the tweet element, just save the URL
          await saveUrl(currentUrl);
        }
      } else {
        if (debugMode) console.log('Extension disabled or auto-save is OFF, not saving tweet at:', currentUrl);
      }
    }
  }
}


function extractProperties(names, obj) {
  let extracted = {};
  names.forEach(name => {
    if (name in obj) {
      extracted[name] = obj[name];
    } else {
      extracted[name] = defaultOptions[name];
    }
  });
  return extracted;
};

// Add this new function for unsaving tweets
const unsaveTweet = async (tweetUrl) => {
  try {
    // Remove URL from savedUrls
    const urlIndex = savedUrls.indexOf(tweetUrl);
    if (urlIndex > -1) {
      savedUrls.splice(urlIndex, 1);
    }

    // Remove tweet from savedTweets
    const tweetIndex = savedTweets.findIndex(tweet => tweet.url === tweetUrl);
    if (tweetIndex > -1) {
      savedTweets.splice(tweetIndex, 1);
    }

    // Save updated arrays to storage
    await saveDataToStorage(savedUrls, savedTweets);
    showNotification('Tweet removed from saved', 'info');
    
    if (debugMode) console.log('Tweet unsaved:', tweetUrl);
  } catch (error) {
    if (debugMode) console.error('unsaveTweet - Error:', error);
    showNotification('Error removing tweet', 'error');
  }
};

// Add this function before addSaveButtonsToTweets
const getTweetUrl = (tweetElement) => {
  try {
    // First try to find the link in the tweet's header
    const headerLink = tweetElement.querySelector('[data-testid="User-Name"] a[href*="/status/"]');
    if (headerLink) {
      return headerLink.href;
    }

    // Then try to find any link with a status ID
    const statusLink = tweetElement.querySelector('a[href*="/status/"]');
    if (statusLink) {
      return statusLink.href;
    }

    // Finally, try to get the URL from the current page if we're on a tweet page
    if (isTweetUrl(window.location.href)) {
      return window.location.href;
    }

    return null;
  } catch (err) {
    if (debugMode) console.error('Error getting tweet URL:', err);
    return null;
  }
};

// Update the icon source based on saved state
const updateIconSource = (buttonElement, iconStyle, theme, isSaved) => {
  const iconElement = buttonElement.querySelector('img');
  if (iconElement) {
    iconElement.src = isSaved 
      ? cachedIconUrls[iconStyle][theme === 'light' ? 'lightFilled' : 'darkFilled']
      : cachedIconUrls[iconStyle][theme];
  }
};

// Simplify the button addition function
const addSaveButtonsToTweets = () => {
  // Check if extension is enabled
  if (!settings.enableExtension) {
    // Remove all existing buttons if extension is disabled
    document.querySelectorAll('.tweet-saver--button-container').forEach(container => {
      container.remove();
    });
    return;
  }

  try {
    // Find all tweets
    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
    if (!tweets.length) return;

    const theme = detectTheme();
    tweets.forEach(tweet => {
      try {
        // Skip if already has our button
        if (tweet.querySelector('.tweet-saver--button-container')) return;
        
        // Skip promoted tweets
        if (tweet.querySelector('[data-testid="tweet-promoted-indicator"]')) return;

        // Find the bookmark button
        const bookmarkButton = tweet.querySelector('[data-testid="bookmark"]') || tweet.querySelector('[data-testid="removeBookmark"]');
        if (!bookmarkButton?.parentNode) return;

        // Get tweet URL
        const tweetUrl = getTweetUrl(tweet);
        if (!tweetUrl) return;

        // Double check no existing button before proceeding
        const existingButton = bookmarkButton.parentNode.querySelector('.tweet-saver--button-container');
        if (existingButton) {
          if (debugMode) console.log('Skipping tweet - already has button');
          return;
        }

        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('tweet-saver--button-container');
        buttonContainer.setAttribute('data-tweet-url', tweetUrl);

        // Create button
        const buttonElement = document.createElement('div');
        buttonElement.classList.add('tweet-saver--save-tweet-button');
        buttonElement.title = 'Save Tweet';
        
        // Set saved state if applicable
        if (savedUrls.includes(tweetUrl)) {
          buttonElement.classList.add('saved');
        }

        // Add click handler
        buttonElement.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Prevent multiple clicks while processing
          if (buttonElement.classList.contains('tweet-saver--loading')) return;
          
          try {
            buttonElement.classList.add('tweet-saver--loading');
            
            // Get the tweet element
            const tweetElement = buttonElement.closest('article[data-testid="tweet"]');
            if (!tweetElement) return;
            
            if (savedUrls.includes(tweetUrl)) {
              // Unsave the tweet
              await unsaveTweet(tweetUrl);
              buttonElement.classList.remove('saved');
              updateIconSource(buttonElement, settings.saveIconStyle, theme, false);
              showNotification('Tweet removed from saved', 'info');
            } else {
              // Save the tweet
              await saveNewTweet(tweetElement, tweetUrl);
              buttonElement.classList.add('saved');
              updateIconSource(buttonElement, settings.saveIconStyle, theme, true);
              showNotification('Tweet saved successfully', 'success');
            }
            
            // Show splash effect
            showSplashEffect(buttonElement);
          } catch (error) {
            if (debugMode) console.error('Error handling button click:', error);
            showNotification('Error saving tweet', 'error');
          } finally {
            buttonElement.classList.remove('tweet-saver--loading');
          }
        });

        // Add icon with initial state
        const iconElement = document.createElement('img');
        iconElement.src = savedUrls.includes(tweetUrl)
          ? cachedIconUrls[settings.saveIconStyle][theme === 'light' ? 'lightFilled' : 'darkFilled']
          : cachedIconUrls[settings.saveIconStyle][theme];
        iconElement.alt = 'Save';
        buttonElement.appendChild(iconElement);
        buttonContainer.appendChild(buttonElement);

        // Final check before insertion
        if (!bookmarkButton.parentNode.querySelector('.tweet-saver--button-container')) {
          // Insert button next to bookmark
          bookmarkButton.parentNode.insertBefore(buttonContainer, bookmarkButton.nextSibling);
        }
      } catch (err) {
        if (debugMode) console.error('Error adding button to tweet:', err);
      }
    });
  } catch (err) {
    if (debugMode) console.error('Error in addSaveButtonsToTweets:', err);
  }
};


const showSplashEffect = (button) => {
  button.classList.add('tweet-saver--splash-effect');
  setTimeout(() => {
      button.classList.remove('tweet-saver--splash-effect');
  }, 500); // Duration should match the animation duration
};




/////// Helper functions ///////

const isUrlSaved = (urlToCheck) => {
  return savedUrls.includes(urlToCheck);
};

const isTweetUrl = (urlToCheck, ignorePhotoUrl) => {
  const homepageUrl = "https://x.com/home";

  if (urlToCheck.includes('status') 
    && !urlToCheck.includes('compose')
    && !urlToCheck.includes('quote') 
    && !urlToCheck.includes('retweet') 
    && !urlToCheck.includes('like')
  ) {
    if (!enablePhotoUrlSave && urlToCheck.includes('photo')) {
      return false;
    } if (ignorePhotoUrl && urlToCheck.includes('photo')) {
      return false;
    }
    return true
  }

  return false;
};






/////// Event listeners ///////

// Modify the detectUrlChange function to be more focused
const detectUrlChangeNewVersion = () => {
  if (!enableExtension) {
    if (debugMode) console.log('Extension disabled, URL change detection disabled');
    return;
  }

  const observer = new MutationObserver((mutations) => {
    try {
      handleUrlChange(mutations);
      addSaveButtonsToTweets();
    } catch (err) {
      if (debugMode) console.error('Error in mutation observer:', err);
    }
  });

  // Only observe the main content area where tweets appear
  const mainContent = document.querySelector('main');
  if (mainContent) {
    observer.observe(mainContent, { 
      childList: true, 
      subtree: true,
      characterData: true
    });
  }
  
  window.addEventListener('popstate', handleUrlChange);
}


// Observer to detect URL changes
const detectUrlChange = async () => {
  if (!enableExtension) {
    if (debugMode) console.log('Extension disabled, URL change detection disabled');
    return;
  }

  const observer = new MutationObserver((mutations) => {
    try {
    // Check if extension context is still valid
      if (!chrome.runtime?.id) {
        observer.disconnect();
        window.location.reload();
        return;
      }

      handleUrlChange(mutations);
      addSaveButtonsToTweets();
    } catch (err) {
    if (debugMode) console.error('Error in mutation observer:', err);
      if (!chrome.runtime?.id) {
        observer.disconnect();
        window.location.reload();
      }
    }
  });
  
  observer.observe(document, { subtree: true, childList: true });
  
  window.addEventListener('popstate', handleUrlChange);
}




/////// Initialization Functions ///////

// Retrieve and set options
const initializeOptions = async () => {
  try {
    // Get settings from both storages
    const [localSettings, syncSettings] = await Promise.all([
      chrome.storage.local.get('settings'),
      chrome.storage.sync.get('settings')
    ]);

    // Get the settings with the most recent lastSaved timestamp
    const local = localSettings.settings || { lastSaved: 0 };
    const sync = syncSettings.settings || { lastSaved: 0 };

    // Use the most recently saved settings
    const mostRecent = (local.lastSaved || 0) > (sync.lastSaved || 0) ? local : sync;

    // Update the settings object with values from storage
    if (mostRecent) {
      // Update individual settings
      for (const key in mostRecent) {
        if (key !== 'lastSaved') {
          settings[key] = mostRecent[key];
        }
      }

      // Update debug mode
      debugMode = mostRecent.debugMode ?? false;
      initializeDebugMode(debugMode);
    }

    if (debugMode) console.log('Settings loaded:', settings);
  } catch (error) {
    if (debugMode) console.error('initializeOptions - Error retrieving options:', error);
    // Use default settings if there's an error
    settings = {
      ...defaultOptions,
      ...settings
    };
  }
};




/////// Initialization ///////

(async function () {
  try {
    // Basic setup
    initializeDebugMode(false);
    initializeIconUrls();
    
    // Load settings and data
    await Promise.all([
      initializeOptions(),
      getSavedData()
    ]);

    // Add initial buttons
    addSaveButtonsToTweets();

    // Set up main observer
    const observer = new MutationObserver(() => {
      addSaveButtonsToTweets();
    });

    // Start observing with a delay to ensure Twitter's UI is loaded
    setTimeout(() => {
      const mainContent = document.querySelector('main');
      if (mainContent) {
        observer.observe(mainContent, {
          childList: true,
          subtree: true
        });
      }
    }, 1000);

    // Handle navigation events
    window.addEventListener('popstate', addSaveButtonsToTweets);
    window.addEventListener('pushstate', addSaveButtonsToTweets);
    window.addEventListener('replacestate', addSaveButtonsToTweets);

    // Add buttons when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', addSaveButtonsToTweets);
    } else {
      addSaveButtonsToTweets();
    }

    if (debugMode) console.log('Tweet Saver initialized');
  } catch (error) {
    if (debugMode) console.error('Error initializing Tweet Saver:', error);
  }
})();

function detectTheme() {
  // Get the background color of the main Twitter container
  const mainElement = document.querySelector('main');
  if (!mainElement) return 'light'; // Default to light if main not found

  const bgColor = window.getComputedStyle(mainElement).backgroundColor;
  
  // Convert rgb/rgba to brightness value
  const rgb = bgColor.match(/\d+/g);
  if (!rgb) return 'light';
  
  // Calculate perceived brightness using the formula: (R * 299 + G * 587 + B * 114) / 1000
  const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
  
  return brightness > 128 ? 'light' : 'dark';
}

function updateButtonStyle() {
  const saveButton = document.querySelector('.tweet-saver-button');
  if (!saveButton) return;

  const theme = detectTheme();
  
  if (theme === 'dark') {
    saveButton.style.backgroundColor = '#1d9bf0';
    saveButton.style.color = '#ffffff';
    saveButton.style.border = '1px solid #1d9bf0';
  } else {
    saveButton.style.backgroundColor = '#ffffff';
    saveButton.style.color = '#0f1419';
    saveButton.style.border = '1px solid #cfd9de';
  }
}

// Notification System
const showNotification = (message, type = 'info', duration = 3000) => {
  try {
    // Check if notifications are enabled (using the settings object)
    if (settings && settings.notificationsEnabled === false) {
      if (debugMode) console.log('Notifications disabled, not showing:', message);
      return;
    }

    // Remove any existing notifications
    const existingNotification = document.querySelector('.tweet-saver--notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `tweet-saver--notification ${type}`;
    notification.textContent = message;

    // Add to DOM
    document.body.appendChild(notification);

    // Trigger animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // Remove after duration
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, duration);
  } catch (error) {
    if (debugMode) console.error('Error showing notification:', error);
  }
};

// Listen for messages from options panel and frontend
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // if (message.type === 'SETTINGS_UPDATED') {
  //   // Update settings with the new values
  //   if (message.payload) {
  //     const newSettings = message.payload;
  //     const oldSettings = settings;
      
  //     // Only update if the new settings are more recent
  //     if (!oldSettings || (newSettings.lastSaved > oldSettings.lastSaved)) {
  //       // Update individual settings
  //       for (const key in newSettings) {
  //         if (key !== 'lastSaved') {
  //           settings[key] = newSettings[key];
  //         }
  //       }
        
  //       // Update debug mode
  //       debugMode = newSettings.debugMode ?? false;
  //       initializeDebugMode(debugMode);

  //       // If icon style changed, update all buttons immediately
  //       if (oldSettings?.saveIconStyle !== newSettings.saveIconStyle) {
  //         const theme = detectTheme();
  //         document.querySelectorAll('.tweet-saver--save-tweet-button').forEach(button => {
  //           const isSaved = button.classList.contains('saved');
  //           updateIconSource(button, newSettings.saveIconStyle, theme, isSaved);
  //         });
  //       }

  //       // If notifications setting changed, update immediately
  //       if (oldSettings?.notificationsEnabled !== newSettings.notificationsEnabled) {
  //         // The showNotification function already checks this setting
  //         if (debugMode) {
  //           console.log('Notifications setting updated:', newSettings.notificationsEnabled);
  //         }
  //       }

  //       // Show a notification that settings were updated
  //       if (newSettings.notificationsEnabled) {
  //         showNotification('Settings updated successfully', 'success', 2000);
  //       }
  //     }
  //   }
    
  //   // Remove existing save buttons and re-add them with new settings
  //   document.querySelectorAll('.tweet-saver--button-container').forEach(container => {
  //     container.remove();
  //   });
    
  //   // Re-add save buttons with new settings
  //   addSaveButtonsToTweets();
  // } else 
  
  if (message.type === 'SETTING_UPDATED') {
    const { key, value, notify } = message.payload;
    
    // Update the specific setting
    settings[key] = value;

    // Handle all setting changes
    switch (key) {
      case 'notificationsEnabled':
        if (notify) {
          showNotification('Notification settings updated', 'info');
        }
        break;
        
      case 'autoSave':
        if (notify) {
          showNotification(`Auto-save ${value ? 'enabled' : 'disabled'}`, 'info');
        }
        break;
        
      case 'saveOnlyMedia':
        // Re-scan current tweets with new media filter
        document.querySelectorAll('.tweet-saver--button-container').forEach(container => {
          container.remove();
        });
        addSaveButtonsToTweets();
        if (notify) {
          showNotification(`Media-only mode ${value ? 'enabled' : 'disabled'}`, 'info');
        }
        break;

      case 'saveIconStyle':
        // Update all existing save button icons
        const theme = detectTheme();
        document.querySelectorAll('.tweet-saver--save-tweet-button').forEach(button => {
          const isSaved = button.classList.contains('saved');
          updateIconSource(button, value, theme, isSaved);
        });
        if (notify) {
          showNotification('Save icon style updated', 'info');
        }
        break;

      case 'saveIconPosition':
        // Remove and re-add all save buttons to update position
        document.querySelectorAll('.tweet-saver--button-container').forEach(container => {
          container.remove();
        });
        addSaveButtonsToTweets();
        if (notify) {
          showNotification('Save icon position updated', 'info');
        }
        break;

      case 'showStorageIndicator':
        if (notify) {
          showNotification(`Storage indicator ${value ? 'shown' : 'hidden'}`, 'info');
        }
        break;
        
      // ... other cases ...
    }

    // Save updated settings
    chrome.storage.local.set({ 
      settings: {
        ...settings,
        lastSaved: Date.now()
      }
    });
  } else if (message.type === 'TWEET_DELETED') {
    // Update save button state for the deleted tweet
    const tweetUrl = message.url;
    const buttonContainer = document.querySelector(`.tweet-saver--button-container[data-tweet-url="${tweetUrl}"]`);
    if (buttonContainer) {
      const buttonElement = buttonContainer.querySelector('.tweet-saver--save-tweet-button');
      if (buttonElement) {
        buttonElement.classList.remove('saved');
        const theme = detectTheme();
        updateIconSource(buttonElement, settings.saveIconStyle, theme, false);
      }
    }

    // Update local arrays
    const urlIndex = savedUrls.indexOf(tweetUrl);
    if (urlIndex > -1) {
      savedUrls.splice(urlIndex, 1);
    }

    const tweetIndex = savedTweets.findIndex(tweet => tweet.url === tweetUrl);
    if (tweetIndex > -1) {
      savedTweets.splice(tweetIndex, 1);
    }

    // Save updated arrays to storage
    saveDataToStorage(savedUrls, savedTweets);
  }
  
  sendResponse({ success: true });
  return true;
});

// Listen for messages from the background script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.method === 'tweetsDeleted') {
    // Clear local data
    savedUrls = [];
    savedTweets = [];
    localStorage.removeItem('tweet-saver--urls');
    localStorage.removeItem('tweet-saver--tweets');
    
    if (debugMode) console.log('Local data cleared after tweetsDeleted message');
  }
});

// Add click outside handler to close menus
document.addEventListener('click', (event) => {
  if (!event.target.closest('.tweet-saver--button-container')) {
    const allMenus = document.querySelectorAll('.tweet-saver--hover-menu');
    allMenus.forEach(menu => menu.classList.remove('show'));
  }
});

// Add function to transfer data between storage types
const transferStorageData = async (fromType, toType) => {
  try {
    const fromStorage = fromType === 'sync' ? chrome.storage.sync : chrome.storage.local;
    const toStorage = toType === 'sync' ? chrome.storage.sync : chrome.storage.local;

    // Get data from old storage
    fromStorage.get(['tweetUrls', 'tweets'], async (result) => {
      if (result.tweetUrls || result.tweets) {
        // Save to new storage
        await toStorage.set({
          tweetUrls: result.tweetUrls || '[]',
          tweets: result.tweets || '[]'
        });

        // Clear old storage
        await fromStorage.remove(['tweetUrls', 'tweets']);

        if (debugMode) console.log(`Data transferred from ${fromType} to ${toType} storage`);
        showNotification(`Tweets transferred to ${toType} storage successfully`, 'success');
      }
    });
  } catch (error) {
    if (debugMode) console.error('Error transferring data between storage types:', error);
    showNotification('Error transferring tweets between storage types', 'error');
  }
};

// Add a helper function to check extension context
const isExtensionContextValid = () => {
  return !!chrome.runtime?.id;
};

const saveToLocalStorageWithExpiration = (key, data, expirationInMinutes) => {
  const now = new Date();
  const expirationTime = now.getTime() + expirationInMinutes * 60 * 1000;
  const item = {
    data: data,
    expiration: expirationTime
  };
  localStorage.setItem(key, JSON.stringify(item));
};

const getFromLocalStorageWithExpiration = (key) => {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) {
    return null;
  }

  const item = JSON.parse(itemStr);
  const now = new Date();

  if (now.getTime() > item.expiration) {
    // Data has expired
    localStorage.removeItem(key);
    return null;
  }

  return item.data;
};
