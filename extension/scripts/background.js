
const browser = chrome || browser;

const defaultOptions = {
  enableExtension: true,
  saveLastTweetEnabled: true,
  browserStorageType: 'local', // local or sync
  debugMode: false,
  enablePhotoUrlSave: true, 
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

      browser.storage.sync.set({ options: newOptionObj })
        .then(() => {
          console.log("Installed - set options", newOptionObj);
        });
    } else {
      browser.storage.sync.set({ options: defaultOptions })
        .then(() => {
          console.log("Installed - default options", defaultOptions);
        });
    }
  });

  updateIcon();
  getTweetsFromStorage();
});

// browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.method === 'enableExtension') {  
//     updateIcon();
//   }

//   if (message.method === 'saveTweetUrl') {
//     console.log('saveTweetUrl', message);
//     tweetUrls.push(message.url);
//     //browser.storage.local.set({ tweetUrls });
//   }

//   if (message.method === 'deleteAllTweetUrls') {
//     console.log('deleteAllTweetUrls', message);
//     tweetUrls = [];
//     //browser.storage.local.remove('tweetUrls');
//   }

//   if (message.method === 'saveTweet') {
//     console.log('saveTweet', message);
//     tweets.push(message.tweet);
//     //browser.storage.local.set({ tweets });
//   }

//   if (message.method === 'getTweetUrls') {
//     console.log('getTweetUrls', tweetUrls);
//     sendResponse({ method: 'tweetUrls', tweetUrls });
//   }

//   // Required to return true to use sendResponse asynchronously
//   return true;
// });

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
      saveToStorage();
      break

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
    const result = await browser.storage.local.get(['tweetUrls', 'tweets']);
    tweetUrls = result.tweetUrls || [];
    tweets = result.tweets || [];
    console.log('Retrieved from storage:', { tweetUrls, tweets });
  } catch (error) {
    console.error('Error getting tweets from storage:', error);
  }
}

// Save tweets and URLs to local storage
async function saveToStorage() {
  try {
    await browser.storage.local.set({ tweetUrls, tweets });
    console.log('Saved to storage:', { tweetUrls, tweets });
  } catch (error) {
    console.error('Error saving to storage:', error);
  }
}

// Function to get data from storage
async function getDataFromStorage() {
  try {
    const data = await chrome.storage.local.get(['tweetUrls', 'tweets']);
    return data;
  } catch (error) {
    console.error('Error getting data from storage:', error);
  }
}

// Listener for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.method === 'getStorageData') {
    getDataFromStorage().then(data => sendResponse(data));
    return true;  // Keep the message channel open for async response
  }
});