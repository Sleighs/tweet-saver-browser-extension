// Debug logging system
const debug = {
  enabled: false,
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

const initializeDebugMode = (enabled) => {
  debug.enabled = enabled;
};

const browser = chrome || browser;

const defaultOptions = {
  // General Settings
  enableExtension: true,
  saveLastTweetEnabled: true,
  browserStorageType: 'local',
  debugMode: true,
  notificationsEnabled: true,
  autoSave: false,
  saveDelay: 500,
  saveOnlyMedia: false,
  saveTweetMetadata: true,
  saveIconStyle: 'cloud',
  saveIconPosition: 'bottom',
  showStorageIndicator: true,

  // Storage Settings
  maxTweets: 1000,
  autoCleanup: false,
  cleanupThreshold: 900,
  backupEnabled: false,
  backupFrequency: 'weekly',

  // Advanced Settings
  customCSS: '',
  retryAttempts: 3,
  retryDelay: 1000,
  customEndpoint: '',
  storageType: 'local',

  // Add timestamp
  lastSaved: Date.now()
};

const STORAGE_KEYS = {
  SETTINGS: 'settings',
  SAVED_POSTS: 'tweets',
  SAVED_URLS: 'tweetUrls'
};

// Options stored in chrome.storage.sync
let options = {};

// Saved tweets
let tweetUrls = [];
let tweets = [];

// Initial setup
browser.runtime.onInstalled.addListener(() => {
  // Get settings from both storages
  Promise.all([
    browser.storage.local.get('settings'),
    browser.storage.sync.get('settings')
  ]).then(([localSettings, syncSettings]) => {
    try {
      // Parse settings from storage
      const local = localSettings.settings ? JSON.parse(localSettings.settings) : { lastSaved: 0 };
      const sync = syncSettings.settings ? JSON.parse(syncSettings.settings) : { lastSaved: 0 };

      // Use the most recently saved settings
      const mostRecent = (local.lastSaved || 0) > (sync.lastSaved || 0) ? local : sync;

      // Initialize with the most recent settings or defaults
      options = {
        ...defaultOptions,
        ...(mostRecent || {}),
        lastSaved: Date.now()
      };

      // Initialize debug mode
      initializeDebugMode(options.debugMode);

      // Save initial settings to both storages
      const settingsString = JSON.stringify(options);

      Promise.all([
        browser.storage.local.set({ settings: settingsString }),
        browser.storage.sync.set({ settings: settingsString })
      ]).then(() => {
        debug.log("Installed - set initial settings", options);
      });

      // Update icon and get tweets
      updateIcon();
      getTweetsFromStorage();
    } catch (error) {
      debug.error('Error initializing settings:', error);
      options = defaultOptions;
      initializeDebugMode(defaultOptions.debugMode);
    }
  });
});

// Listen for storage changes
browser.storage.onChanged.addListener((changes, areaName) => {
  if (changes.settings) {
    const newSettings = changes.settings.newValue;
    const oldSettings = changes.settings.oldValue;
    
    // Only update if the new settings are more recent
    if (!oldSettings || (newSettings.lastSaved > oldSettings.lastSaved)) {
      options = {
        ...options,
        ...newSettings
      };
      initializeDebugMode(options.debugMode);
      debug.log("Settings updated from storage", options);
    }
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.method === 'getStorageData') {
    getDataFromStorage().then(data => sendResponse(data));
    return true;  // Keep the message channel open for async response
  }
});

async function updateIcon() {
  try {
    // Get settings from both storages
    const [localSettings, syncSettings] = await Promise.all([
      browser.storage.local.get('settings'),
      browser.storage.sync.get('settings')
    ]);

    // Get the settings with the most recent lastSaved timestamp
    const local = localSettings.settings || { lastSaved: 0 };
    const sync = syncSettings.settings || { lastSaved: 0 };

    // Use the most recently saved settings
    const mostRecent = (local.lastSaved || 0) > (sync.lastSaved || 0) ? local : sync;
    const settings = mostRecent || defaultOptions;

    const iconPath = settings.enableExtension
      ? {
          "16": "../images/icon-16.png",
          "32": "../images/icon-32.png"
        }
      : {
          "16": "../images/icon-16-gray.png",
          "32": "../images/icon-32-gray.png"
        };
    await browser.action.setIcon({ path: iconPath });
    debug.log('Icon updated:', settings.enableExtension ? 'enabled' : 'disabled');
  } catch (err) {
    debug.error('Error updating Icon', err);
  }
}

// Handle messages from the content script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.method) {
    case 'enableExtension':
      updateIcon();
      break;

    case 'saveTweetUrl':
      debug.log('saveTweetUrl:', message.url);
      tweetUrls.push(message.url);
      saveToStorage();
      break;

    case 'deleteAllTweetUrls':
      debug.log('deleteAllTweetUrls');
      tweetUrls = [];
      saveToStorage();
      break;

    case 'saveTweet':
      debug.log('saveTweet:', message.tweet);
      tweets.push(message.tweet);
      saveToStorage();
      break;
    
    case 'deleteAllTweets':
      debug.log('deleteAllTweets');
      tweets = [];
      tweetUrls = [];
      saveToStorage();
      // Notify all tabs that tweets have been deleted
      browser.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          browser.tabs.sendMessage(tab.id, { method: 'tweetsDeleted' }).catch(() => {
            // Ignore errors for inactive tabs
          });
        });
      });
      break;

    case 'getTweetUrls':
      debug.log('getTweetUrls:', tweetUrls);
      sendResponse({ tweetUrls });
      break;

    default:
      debug.warn('Unknown message method:', message.method);
  }

  // Required to return true to use sendResponse asynchronously
  return true;
});

// Fetch tweets and URLs from local storage
async function getTweetsFromStorage() {
  try {
    // Get current storage type setting
    const { options } = await browser.storage.sync.get('options');
    const storageArea = options?.storageType === 'sync' ? browser.storage.sync : browser.storage.local;
    
    const result = await storageArea.get([STORAGE_KEYS.SAVED_URLS, STORAGE_KEYS.SAVED_POSTS]);
    
    // Parse data carefully
    const parseStorageData = (data) => {
      try {
        return typeof data === 'string' ? JSON.parse(data) : (Array.isArray(data) ? data : []);
      } catch (e) {
        debug.error('Error parsing storage data:', e);
        return [];
      }
    };

    tweetUrls = parseStorageData(result[STORAGE_KEYS.SAVED_URLS]);
    tweets = parseStorageData(result[STORAGE_KEYS.SAVED_POSTS]);
    
    debug.log('Retrieved from ' + (options?.storageType || 'local') + ' storage:', { tweetUrls, tweets });
  } catch (error) {
    debug.error('Error getting tweets from storage:', error);
  }
}

// Save tweets and URLs to local storage
async function saveToStorage() {
  try {
    // Get current storage type setting
    const { options } = await browser.storage.sync.get('options');
    const storageArea = options?.storageType === 'sync' ? browser.storage.sync : browser.storage.local;
    
    const data = {
      [STORAGE_KEYS.SAVED_URLS]: JSON.stringify(tweetUrls),
      [STORAGE_KEYS.SAVED_POSTS]: JSON.stringify(tweets)
    };
    
    await storageArea.set(data);
    debug.log('Saved to ' + (options?.storageType || 'local') + ' storage:', { tweetUrls, tweets });
  } catch (error) {
    debug.error('Error saving to storage:', error);
  }
}

// Function to get data from storage
async function getDataFromStorage() {
  try {
    // Get data from both storages
    const [localData, syncData] = await Promise.all([
      chrome.storage.local.get([STORAGE_KEYS.SAVED_URLS, STORAGE_KEYS.SAVED_POSTS]),
      chrome.storage.sync.get([STORAGE_KEYS.SAVED_URLS, STORAGE_KEYS.SAVED_POSTS])
    ]);

    // Parse data carefully
    const parseStorageData = (data, key) => {
      try {
        const value = data[key];
        return typeof value === 'string' ? JSON.parse(value) : (Array.isArray(value) ? value : []);
      } catch (e) {
        debug.error('Error parsing storage data:', e);
        return [];
      }
    };

    // Parse and combine data
    const localTweetUrls = parseStorageData(localData, STORAGE_KEYS.SAVED_URLS);
    const syncTweetUrls = parseStorageData(syncData, STORAGE_KEYS.SAVED_URLS);
    const localTweets = parseStorageData(localData, STORAGE_KEYS.SAVED_POSTS);
    const syncTweets = parseStorageData(syncData, STORAGE_KEYS.SAVED_POSTS);

    // Combine and deduplicate
    const uniqueTweets = Array.from(new Map([...localTweets, ...syncTweets].map(tweet => [tweet.url, tweet])).values());
    const uniqueUrls = [...new Set([...localTweetUrls, ...syncTweetUrls])];

    return {
      tweetUrls: uniqueUrls,
      tweets: uniqueTweets
    };
  } catch (error) {
    debug.error('Error getting data from storage:', error);
    return { tweetUrls: [], tweets: [] };
  }
}