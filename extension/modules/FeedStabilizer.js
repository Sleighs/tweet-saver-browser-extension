class FeedStabilizer {
  constructor(settings) {
    this.settings = settings;
    this.enabled = false;
    this.originalFetch = null;
    this.observers = new Set();
    this.debugMode = settings?.debugMode ?? false;
  }

  enable() {
    if (this.enabled) return;
    this.enabled = true;

    // Store original fetch
    this.originalFetch = window.fetch;
    
    // Override fetch to block refresh requests
    window.fetch = async (...args) => {
      const [url, options] = args;
      
      if (this.shouldBlockRequest(url, options)) {
        if (this.debugMode) {
          console.log('[FeedStabilizer] Blocked refresh request:', url);
        }
        return new Response('{}', { status: 200 });
      }
      
      return this.originalFetch(...args);
    };

    this.setupPreventions();
    if (this.debugMode) {
      console.log('[FeedStabilizer] Enabled feed stabilization');
    }
  }

  disable() {
    if (!this.enabled) return;
    
    // Restore original fetch
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
    }

    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    this.enabled = false;
    if (this.debugMode) {
      console.log('[FeedStabilizer] Disabled feed stabilization');
    }
  }

  shouldBlockRequest(url, options) {
    if (typeof url !== 'string') return false;

    return (
      url.includes('/HomeLatestTimeline') || 
      url.includes('/HomeTimeline') ||
      (url.includes('/graphql/') && options?.body?.includes('HomeTimeline'))
    );
  }

  setupPreventions() {
    // Prevent pull-to-refresh
    this.preventPullToRefresh();
    
    // Remove "Show new Tweets" bar
    this.removeNewTweetsBar();
    
    // Block automatic timeline updates
    this.blockTimelineUpdates();
  }

  preventPullToRefresh() {
    const feedElement = document.querySelector('[data-testid="primaryColumn"]');
    if (feedElement) {
      const preventHandler = (e) => e.preventDefault();
      feedElement.addEventListener('touchstart', preventHandler, { passive: false });
      feedElement.addEventListener('touchmove', preventHandler, { passive: false });
      
      if (this.debugMode) {
        console.log('[FeedStabilizer] Pull-to-refresh prevention enabled');
      }
    }
  }

  removeNewTweetsBar() {
    const observer = new MutationObserver((mutations) => {
      const newTweetsBar = document.querySelector('[data-testid="cellInnerDiv"] [role="button"]');
      if (newTweetsBar) {
        newTweetsBar.remove();
        if (this.debugMode) {
          console.log('[FeedStabilizer] Removed new tweets bar');
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.observers.add(observer);
  }

  blockTimelineUpdates() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.target.getAttribute('aria-label')?.includes('Timeline')) {
          const refreshElements = mutation.target.querySelectorAll('[data-testid="cellInnerDiv"] [role="button"]');
          refreshElements.forEach(element => {
            element.remove();
            if (this.debugMode) {
              console.log('[FeedStabilizer] Blocked timeline update');
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.observers.add(observer);
  }
}

export default FeedStabilizer;