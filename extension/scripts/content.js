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
};

const getColorScheme = () => {
  const htmlElement = document.documentElement;
  const colorScheme = getComputedStyle(htmlElement).getPropertyValue('color-scheme').trim();

  console.log('Color scheme:', colorScheme);
  console.log('HTML Element:', htmlElement);

  return colorScheme || 'dark';
};

//console.log(getColorScheme());



/////// Declarations ///////

const browser = chrome || browser;

// Options
let enableExtension = true;
let saveLastTweetEnabled = true;
let browserStorageType = 'local';
let debugMode = true;
let enablePhotoUrlSave = true;
let styleTheme = getColorScheme();

// Global settings object that will contain all settings
let settings = {
  enableExtension: true,
  saveLastTweetEnabled: true,
  browserStorageType: 'local',
  debugMode: true,
  enablePhotoUrlSave: true,
  styleTheme: styleTheme,
  notificationsEnabled: true, // Default value for notifications
  autoSave: false,  // Auto-save setting (OFF by default)
  saveDelay: 500,
  saveOnlyMedia: false,
  saveTweetMetadata: true
};

let optionsState = {
  enableExtension: true,
  saveLastTweetEnabled: true,
  browserStorageType: 'local', // local or sync
  debugMode: true,
  enablePhotoUrlSave: true, 
  styleTheme: styleTheme
};

const defaultOptions = {
  enableExtension: true,
  saveLastTweetEnabled: true,
  browserStorageType: 'local',
  debugMode: true,
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


// Button icon
let btnIconUrl = '../images/cloud-icon-gray-128-2.png';
let btnIconUrl2 = '../images/cloud-fill-64-2.png';
let bookmarkIcon = '../images/bookmark-icon.svg';
let plusIconDarkTheme = '../images/plus-icon-dark.svg';
let plusIconLightTheme = '../images/plus-icon-light.svg';


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
      // First check if URL is already saved
      if (!isUrlSaved(this.url)) {
        savedUrls.push(this.url);
        showNotification('Tweet saved successfully', 'success');
      } else {
        // Update existing tweet
        showNotification('Tweet updated successfully', 'info');
      }

      // Find existing tweet index
      const existingTweetIndex = savedTweets.findIndex(savedTweet => {
        // Check URL first as it's the most reliable identifier
        if (savedTweet.url === this.url) {
          return true;
        }

        // For tweets without URLs, use a combination of factors
        const sameText = savedTweet.text === this.text;
        const sameTime = savedTweet.time === this.time;
        const sameAuthor = savedTweet.username === this.username && savedTweet.handle === this.handle;

        // Consider it a match if it matches text (if exists) and author
        return (this.text ? sameText : true) && sameAuthor && sameTime;
      });

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
    }
  }
}








//////// Main functions ///////

const getSavedData = async () => {
  // Directly get data from local storage
  try {
    if (browserStorageType === 'sync') {
      await chrome.storage.sync.get([
        'tweetUrls', 
        'tweets'
      ], (result) => {
        // if (chrome.runtime.lastError) {
        //   console.error('Error:', chrome.runtime.lastError);
        // } else {
          if (debugMode) console.log('getSavedData - Storage data:', {
            tweetUrls: JSON.parse(result.tweetUrls), tweets: JSON.parse(result.tweets)
          });
          const { tweetUrls, tweets } = result;
          let tweetUrlData = JSON.parse(tweetUrls);
          let tweetData = JSON.parse(tweets);
          savedTweets = [...tweetData];
          savedUrls = [...tweetUrlData];
        // }
      });
    } else if (browserStorageType === 'local') {
      await chrome.storage.local.get([
        'tweetUrls', 
        'tweets'
      ], (result) => {
        // if (chrome.runtime.lastError) {
        //   console.error('Error:', chrome.runtime.lastError);
        // } else {
          if (debugMode) {
            // console.log('getSavedData - Storage data:', { tweetUrls: JSON.parse(result.tweetUrls), tweets: JSON.parse(result.tweets)});
          }
          const { tweetUrls, tweets } = result;
          let tweetUrlData = JSON.parse(tweetUrls);
          let tweetData = JSON.parse(tweets);
          savedTweets = [...tweetData];
          savedUrls = [...tweetUrlData];
        // }
      });
    }
  } catch (error) {
    if (debugMode) console.error('getSavedData - Error getting saved data:', error);
  }
};

const saveDataToStorage = async (tweetUrls, tweets) => {
  try {
    if (browserStorageType === 'sync') {
      await chrome.storage.sync.set({
        tweetUrls: JSON.stringify(tweetUrls),
        tweets: JSON.stringify(tweets),
      }, function() {
        if (debugMode) console.log('Data saved successfully:', { tweetUrls, tweets });
      });
    } else if (browserStorageType === 'local') {
      await chrome.storage.local.set({ 
        tweetUrls: JSON.stringify(tweetUrls),
        tweets: JSON.stringify(tweets),
      }, function() {
        // if (chrome.runtime.lastError) {
        //   console.error('Error saving data:', chrome.runtime.lastError);
        // } else {
          if (debugMode) console.log('Data saved successfully:', { tweetUrls, tweets });
        // }
      });
    }
  } catch (error) {
    if (debugMode) console.error('saveDataToStorage - Error saving data:', error, { tweetUrls, tweets });
  }
}

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

      // Log the values for debugging
      if (debugMode) {
        console.log('Tweet engagement stats:', {
          replies: tweetReplies,
          retweets: tweetRetweets,
          likes: tweetLikes,
          bookmarks: tweetBookmarkCount
        });
      }

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

      // Get tweet URL more reliably
      const getUrl = () => {
        if (!currentUrl) {
          const links = Array.from(tweetElement.querySelectorAll('a'));
          const statusLink = links.find(link => isTweetUrl(link.href, true));
          return statusLink?.href;
        }
        return currentUrl;
      };

      // Get tweet URL
      const tweetUrl = getUrl();
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
      // Check if auto-save is enabled
      if (settings.autoSave) {
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
        if (debugMode) console.log('Auto-save is OFF, not saving tweet at:', currentUrl);
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

// Update the click handler in addSaveButtonsToTweets
const addSaveButtonsToTweets = async () => {
  try {
    if (!chrome.runtime?.id) {
      console.log('Extension context invalidated - reloading page');
      window.location.reload();
      return;
    }

    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
    const theme = detectTheme();
    let iconThemeClassName = `tweet-saver--save-tweet-button-${theme}`;

    tweets.forEach(tweet => {
      try {
        if (!tweet.querySelector('.tweet-saver--save-tweet-button')) {
          // Get tweet URL to check if it's saved
          const links = Array.from(tweet.querySelectorAll('a'));
          const statusLink = links.find(link => isTweetUrl(link.href, true));
          const tweetUrl = statusLink?.href;
          const isSaved = tweetUrl ? isUrlSaved(tweetUrl) : false;

          const buttonContainer = document.createElement('div');
          buttonContainer.classList.add('tweet-saver--button-container');
          
          const buttonElement = document.createElement('div');
          buttonElement.classList.add('tweet-saver--save-tweet-button', iconThemeClassName);
          if (isSaved) {
            buttonElement.classList.add('saved');
          }

          buttonElement.addEventListener('click', async (event) => {
            try {
              event.stopPropagation();
              buttonElement.classList.add('tweet-saver--loading');
              
              if (!buttonElement.classList.contains('saved')) {
                // Save tweet
                await saveNewTweet(tweet, null);
                buttonElement.classList.add('saved');
                showNotification('Tweet saved successfully', 'success');
              } else {
                // Unsave tweet
                await unsaveTweet(tweetUrl);
                buttonElement.classList.remove('saved');
                showNotification('Tweet removed from saved', 'info');
              }
              
              showSplashEffect(buttonElement);
              buttonElement.classList.remove('tweet-saver--loading');
            } catch (err) {
              if (debugMode) console.error('Error in save button click handler:', err);
              buttonElement.classList.remove('tweet-saver--loading');
              showNotification('Failed to update tweet', 'error');
              if (!chrome.runtime?.id) {
                window.location.reload();
                return;
              }
            }
          });
          
          let iconElement = theme === 'dark' ? plusIconDarkTheme : plusIconLightTheme;
          const iconUrl = chrome.runtime?.id ? chrome.runtime.getURL(iconElement) : null;
          if (!iconUrl) {
            if (debugMode) console.log('Extension context invalid while getting icon URL');
            return;
          }

          const cloudIconElement = document.createElement('img');
          cloudIconElement.src = iconUrl;
          cloudIconElement.alt = 'Save';
          cloudIconElement.classList.add('tweet-saver--icon');
          buttonElement.appendChild(cloudIconElement);
          
          buttonContainer.appendChild(buttonElement);
          
          let bookmarkElement = tweet.querySelector('[data-testid="bookmark"]') || tweet.querySelector('[data-testid="removeBookmark"]');
          let parentElement = bookmarkElement?.parentNode || null;
          if (parentElement) {
            parentElement.insertBefore(buttonContainer, bookmarkElement.nextSibling);
          }
        }
      } catch (err) {
        if (debugMode) console.error('Error processing tweet:', err);
      }
    });
  } catch (err) {
    if (debugMode) console.error('Error in addSaveButtonsToTweets:', err);
    if (!chrome.runtime?.id) {
      window.location.reload();
      return;
    }
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

// Add click event listener for saving tweets
// document.addEventListener('click', async function(event) {
//   let tweet = event.target.closest('article');
//   // let tweetEle = event.target.closest('article[data-testid="tweet"]');
  
//   // console.log('page clicked', location.href, tweet, tweetEle);

//   if (tweet) {
//     let tweetUrl = tweet.querySelector('a[href*="status"]')?.href || location.href;
//     console.log(
//       'Tweet clicked', 
//       tweetUrl
//     );

//     if (isTweetUrl(tweetUrl)) {
//       // Save the tweet URL
//       await saveUrl(tweetUrl);
//     }
    
//     // Save the tweet content
//     await saveNewTweet(tweet, tweetUrl);
//   }
// });



// Observer to detect URL changes
const detectUrlChange = async () => {
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

// Override pushState and replaceState to detect URL changes
// (function(history) {
//   const pushState = history.pushState;
//   const replaceState = history.replaceState;

//   history.pushState = function(state, title, url) {
//     if (typeof history.onpushstate === "function") {
//       history.onpushstate({ state, title, url });
//     }
//     setTimeout(handleUrlChange, 0);
//     return pushState.apply(history, arguments);
//   };

//   history.replaceState = function(state, title, url) {
//     if (typeof history.onreplacestate === "function") {
//       history.onreplacestate({ state, title, url });
//     }
//     setTimeout(handleUrlChange, 0);
//     return replaceState.apply(history, arguments);
//   };

//   console.log('Override pushState and replaceState', history);

//   window.addEventListener('popstate', handleUrlChange);
// })(window.history);


// setInterval(handleUrlChange, 1000);

// browser.runtime.onMessage.addListener((message, sender, sendResponse) => { });






/////// Initialization Functions ///////

// Retrieve and set options
const initializeOptions = async () => {
  try {
    // Get options
    const optionsResult = await new Promise((resolve) => {
      chrome.storage.sync.get("options", resolve);
    });

    if (optionsResult && optionsResult.options) {
      let newOptionObj = extractProperties(optionsList, optionsResult.options);
      
      enableExtension = newOptionObj.enableExtension;
      saveLastTweetEnabled = newOptionObj.saveLastTweetEnabled;
      browserStorageType = newOptionObj.browserStorageType;
      debugMode = true; //newOptionObj.debugMode;
      
      Object.assign(optionsState, newOptionObj);
    } else {
      enableExtension = defaultOptions.enableExtension;
      saveLastTweetEnabled = defaultOptions.saveLastTweetEnabled;
      browserStorageType = defaultOptions.browserStorageType;
      debugMode = true;//defaultOptions.debugMode;

      Object.assign(optionsState, defaultOptions);
    }

    // Get all settings from chrome.storage
    const allSettings = await new Promise((resolve) => {
      chrome.storage.sync.get(null, resolve);
    });

    // Update the settings object with values from storage
    if (allSettings) {
      // Update individual settings
      for (const key in allSettings) {
        if (key !== 'options' && key !== 'tweetUrls' && key !== 'tweets') {
          settings[key] = allSettings[key];
        }
      }

      // If specific settings exist in storage, update them
      if (allSettings.notificationsEnabled !== undefined) {
        settings.notificationsEnabled = allSettings.notificationsEnabled;
      }
      if (allSettings.autoSave !== undefined) {
        settings.autoSave = allSettings.autoSave;
      }
      if (allSettings.saveDelay !== undefined) {
        settings.saveDelay = allSettings.saveDelay;
      }
      if (allSettings.saveOnlyMedia !== undefined) {
        settings.saveOnlyMedia = allSettings.saveOnlyMedia;
      }
      if (allSettings.saveTweetMetadata !== undefined) {
        settings.saveTweetMetadata = allSettings.saveTweetMetadata;
      }
    }

    if (debugMode) console.log('Settings loaded:', settings);
  } catch (error) {
    if (debugMode) console.error('initializeOptions - Error retrieving options:', error);
  }
}

/////// Initialization ///////

(async function () {
  await initializeOptions(); 
  await getSavedData(); 
  await handleUrlChange();
  await addSaveButtonsToTweets();
  await detectUrlChange();
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

// Update the observer to call addSaveButtonsToTweets directly
const observer = new MutationObserver(() => {
  addSaveButtonsToTweets();
});

// Start observing theme changes when the page loads
document.addEventListener('DOMContentLoaded', () => {
  const mainElement = document.querySelector('main');
  if (mainElement) {
    observer.observe(mainElement, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true
    });
  }
  
  // Initial button addition
  addSaveButtonsToTweets();
});

// Initial setup when script loads
addSaveButtonsToTweets();

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

// Listen for messages from options panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Basic message handler for other potential needs
  if (message && message.type === 'SETTINGS_UPDATED') {
    // Refresh settings if they've been updated
    initializeOptions();
    sendResponse({ success: true });
    return true;
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
