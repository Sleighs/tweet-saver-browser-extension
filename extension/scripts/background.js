/* global chrome */
import StorageManager from '../services/StorageManager';

// Fallback debug logging system
const fallbackDebug = {
  enabled: false,
  log: (message, ...args) => {
    if (fallbackDebug.enabled) {
      console.log(`[Tweet Saver] ${message}`, ...args);
    }
  },
  error: (message, error, ...args) => {
    if (fallbackDebug.enabled) {
      console.error(`[Tweet Saver] ${message}:`, error, ...args);
    }
  },
  warn: (message, ...args) => {
    if (fallbackDebug.enabled) {
      console.warn(`[Tweet Saver] ${message}`, ...args);
    }
  }
};

// Initialize debug logging system
let debugLog, debugError, debugWarn, initializeDebugMode;
(async () => {
  try {
    const debugModule = await import('../utils/debug.js');
    debugLog = debugModule.debugLog;
    debugError = debugModule.debugError;
    debugWarn = debugModule.debugWarn;
    initializeDebugMode = debugModule.initializeDebugMode;
  } catch (error) {
    console.warn('Failed to import debug module, using fallback:', error);
    debugLog = fallbackDebug.log;
    debugError = fallbackDebug.error;
    debugWarn = fallbackDebug.warn;
    initializeDebugMode = (enabled) => {
      fallbackDebug.enabled = enabled;
    };
  }
})();

const browser = chrome || browser;

const defaultOptions = {
  enableExtension: true,
  saveLastTweetEnabled: true,
  browserStorageType: 'sync',
  debugMode: false,
  enablePhotoUrlSave: true,
  storageType: 'sync'
};

// Options stored in chrome.storage.sync
let options = {};

// Saved tweets
let tweetUrls = [];
let tweets = [];

// Initialize extension
browser.runtime.onInstalled.addListener(async () => {
  try {
    // Initialize settings
    const result = await browser.storage.sync.get('options');
    if (!result.options) {
      await browser.storage.sync.set({ options: defaultOptions });
    }

    // Initialize storage type
    const storageType = await StorageManager.getCurrentStorageType();
    if (!storageType) {
      await StorageManager.setStorageType('sync');
    }
  } catch (error) {
    console.error('Error initializing extension:', error);
  }

  updateIcon();
  getTweetsFromStorage();
});

async function updateIcon() {
  try {
    const data = await browser.storage.sync.get('options');
    const iconPath = data.options.enableExtension
      ? {
          "16": "../images/icon-16.png",
          "32": "../images/icon-32.png",
          "128": "../images/icon-128.png"
        }
      : {
          "16": "../images/icon-gray-32.png",
          "32": "../images/icon-gray-32.png",
          "128": "../images/icon-gray-128.png"
        };
    await browser.action.setIcon({ path: iconPath });
  } catch (err) {
    console.log('Error updating Icon', err);
  }
}

// Handle messages from content script and popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'SAVE_TWEET':
      handleSaveTweet(message.tweet)
        .then(response => sendResponse(response))
        .catch(error => sendResponse({ error: error.message }));
      break;

    case 'DELETE_TWEET':
      handleDeleteTweet(message.tweetUrl)
        .then(response => sendResponse(response))
        .catch(error => sendResponse({ error: error.message }));
      break;

    case 'GET_ALL_TWEETS':
      StorageManager.getAllTweets()
        .then(tweets => sendResponse({ tweets }))
        .catch(error => sendResponse({ error: error.message }));
      break;

    case 'CHANGE_STORAGE_TYPE':
      handleStorageTypeChange(message.newType)
        .then(response => sendResponse(response))
        .catch(error => sendResponse({ error: error.message }));
      break;

    case 'enableExtension':
      updateIcon();
      break;

    case 'saveTweetUrl':
      console.log('saveTweetUrl:', message.url);
      tweetUrls.push(message.url);
      saveToStorage();
      break;

    case 'deleteAllTweetUrls':
      console.log('deleteAllTweetUrls');
      tweetUrls = [];
      saveToStorage();
      break;

    case 'saveTweet':
      console.log('saveTweet:', message.tweet);
      tweets.push(message.tweet);
      saveToStorage();
      break;
    
    case 'deleteAllTweets':
      console.log('deleteAllTweets');
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
      console.log('getTweetUrls:', tweetUrls);
      sendResponse({ tweetUrls });
      break;

    default:
      console.warn('Unknown message method:', message.type);
  }

  // Required for async response
  return true;
});

// Fetch tweets and URLs from local storage
async function getTweetsFromStorage() {
  try {
    // Get current storage type setting
    const { options } = await browser.storage.sync.get('options');
    const storageArea = options?.storageType === 'sync' ? browser.storage.sync : browser.storage.local;
    
    const result = await storageArea.get(['tweetUrls', 'tweets']);
    tweetUrls = result.tweetUrls || [];
    tweets = result.tweets || [];
    debugLog('Retrieved from ' + (options?.storageType || 'local') + ' storage:', { tweetUrls, tweets });
  } catch (error) {
    debugError('Error getting tweets from storage:', error);
  }
}

// Save tweets and URLs to local storage
async function saveToStorage() {
  try {
    // Get current storage type setting
    const { options } = await browser.storage.sync.get('options');
    const storageArea = options?.storageType === 'sync' ? browser.storage.sync : browser.storage.local;
    
    await storageArea.set({ tweetUrls, tweets });
    debugLog('Saved to ' + (options?.storageType || 'local') + ' storage:', { tweetUrls, tweets });
  } catch (error) {
    debugError('Error saving to storage:', error);
  }
}

// Function to get data from storage
async function getDataFromStorage() {
  try {
    // Get current storage type setting
    const { options } = await chrome.storage.sync.get('options');
    const storageArea = options?.storageType === 'sync' ? chrome.storage.sync : chrome.storage.local;
    
    const data = await storageArea.get(['tweetUrls', 'tweets']);
    return data;
  } catch (error) {
    debugError('Error getting data from storage:', error);
    return { tweetUrls: [], tweets: [] };
  }
}

// Listener for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.method === 'getStorageData') {
    getDataFromStorage().then(data => sendResponse(data));
    return true;  // Keep the message channel open for async response
  }
});

// Add listener for storage type changes
browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.options?.newValue?.storageType !== changes.options?.oldValue?.storageType) {
    // Storage type has changed, refresh data from new storage
    getTweetsFromStorage();
  }
});

async function handleSaveTweet(tweet) {
  try {
    await StorageManager.saveTweet(tweet);
    return { success: true };
  } catch (error) {
    console.error('Error saving tweet:', error);
    throw new Error('Failed to save tweet');
  }
}

async function handleDeleteTweet(tweetUrl) {
  try {
    await StorageManager.deleteTweet(tweetUrl);
    return { success: true };
  } catch (error) {
    console.error('Error deleting tweet:', error);
    throw new Error('Failed to delete tweet');
  }
}

async function handleStorageTypeChange(newType) {
  try {
    await StorageManager.setStorageType(newType);
    return { success: true };
  } catch (error) {
    console.error('Error changing storage type:', error);
    throw new Error('Failed to change storage type');
  }
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  // If storage type changed, notify content scripts
  if (changes.storageType) {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'STORAGE_TYPE_CHANGED',
          newType: changes.storageType.newValue
        }).catch(() => {
          // Ignore errors for inactive tabs
        });
      });
    });
  }
});