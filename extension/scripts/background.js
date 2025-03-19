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
  browserStorageType: 'sync', // local or sync
  debugMode: false,
  enablePhotoUrlSave: true,
  storageType: 'sync' // Add new storage type option
};

// Options stored in chrome.storage.sync
let options = {};

// Saved tweets
let tweetUrls = [];
let tweets = [];

// Initial setup
browser.runtime.onInstalled.addListener(() => {
  browser.storage.sync.get("options").then((result) => {
    let optionsList = [
      "enableExtension",
      "saveLastTweetEnabled",
      "browserStorageType",
      "debugMode",
      "enablePhotoUrlSave",
    ];

    function extractProperties(names, obj) {
      let extracted = {};
      names.forEach(name => {
        extracted[name] = obj[name] ?? defaultOptions[name];
      });
      return extracted;
    }

    if (result && result.options) {
      let newOptionObj = extractProperties(optionsList, result.options);
      initializeDebugMode(newOptionObj.debugMode);

      browser.storage.sync.set({ options: newOptionObj })
        .then(() => {
          debugLog("Installed - set options", newOptionObj);
        });
    } else {
      initializeDebugMode(defaultOptions.debugMode);
      browser.storage.sync.set({ options: defaultOptions })
        .then(() => {
          debugLog("Installed - default options", defaultOptions);
        });
    }
  });

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

// async function getTweetsFromStorage() {
//   try {
//     const resultUrls = await browser.storage.local.get('tweetUrls');
//     if (resultUrls.urls) {
//       console.log('Saved tweetUrls:', resultUrls);
//       tweetUrls = resultUrls.urls;
//       browser.storage.local.set({ urls });
//     }

//     const resultTweets = await browser.storage.local.get('tweets');
//     if (resultTweets.tweets) {
//       console.log('Saved tweets:', resultTweets);
//       tweets = resultTweets.tweets;
//       browser.storage.local.set({ tweets });
//     }
//   } catch (error) {
//     console.error('Error getting tweets from storage', error);
//   }
// }









// On extension installation or update
// browser.runtime.onInstalled.addListener(() => {
//   // Get options from storage
//   browser.storage.sync.get("options").then((result) => {
//     if (result && result.options) {
//       options = { ...defaultOptions, ...result.options };
//     } else {
//       options = defaultOptions;
//       browser.storage.sync.set({ options: defaultOptions });
//     }
//     console.log("Options initialized:", options);
//   }).catch(error => console.error('Error initializing options:', error));

//   // Get saved URLs and tweets from storage
//   getTweetsFromStorage();
//   updateIcon();
// });

// Handle messages from the content script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.method) {
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
      console.warn('Unknown message method:', message.method);
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
    // Get data from both storages
    const [localData, syncData] = await Promise.all([
      chrome.storage.local.get(['tweetUrls', 'tweets']),
      chrome.storage.sync.get(['tweetUrls', 'tweets'])
    ]);

    // Parse and combine data
    const localTweetUrls = JSON.parse(localData.tweetUrls || '[]');
    const syncTweetUrls = JSON.parse(syncData.tweetUrls || '[]');
    const localTweets = JSON.parse(localData.tweets || '[]');
    const syncTweets = JSON.parse(syncData.tweets || '[]');

    // Combine and deduplicate
    const allTweets = [...localTweets, ...syncTweets];
    const allUrls = [...localTweetUrls, ...syncTweetUrls];
    
    const uniqueTweets = Array.from(new Map(allTweets.map(tweet => [tweet.url, tweet])).values());
    const uniqueUrls = [...new Set(allUrls)];

    return {
      tweetUrls: uniqueUrls,
      tweets: uniqueTweets
    };
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