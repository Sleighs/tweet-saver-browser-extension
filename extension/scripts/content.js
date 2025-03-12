/*
Features for Tweet Saver
- Stay on page after switching accounts
  - Detect account change
- add right click support
- Make observer more efficient
  - Disconnect observer when not needed

- make api 

- Make an animation for when a tweet is saved
  - splash animation at cursor

- Icon ideas
  - disk
  - book
  - floppy disk
  - cloud
  - color gradient icon

- Add theme options

Front end features
- Highlight selected tweet if tweet is found on current page
- Make a place to save quick drafts (account switching benefit)
- Show images

Other
- Add a web scraper
  - Might be a cleaner way to get tweet data


Bugs
- 


*/

console.log('Tweet Saver is running...');

const getColorScheme = () => {
  const htmlElement = document.documentElement; //document.querySelector('html');
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
let styleTheme = getColorScheme();//getComputedStyle(document.documentElement).getPropertyValue('color-scheme') || 'dark';

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
        this.savedAt = originalSavedAt; // Keep original save time
        this.lastUpdated = new Date().toISOString(); // Update the last updated time
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
      let tweetTime = tweetElement.querySelector('time')?.innerText;
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
  await browser.storage.local.clear();

  // Clear local storage
  localStorage.removeItem('tweet-saver--urls');
  localStorage.removeItem('tweet-saver--tweets');

  // browser.runtime.sendMessage({ method: 'deleteAllTweets' }, (response) => {
  //   if (browser.runtime.lastError) {
  //     console.error('Error:', browser.runtime.lastError);
  //   } else {
  //     console.log('deleteAllSavedData - Storage data:', response);
  //     const { tweetUrls, tweets } = response;
  //     // Use tweetUrls and tweets as needed
  //   }
  // });
}

// Logic for handling URL changes
const handleUrlChange = async (node) => {
  const currentUrl = location.href;

  // console.log('handleUrlChange', currentUrl);
  // console.dir(ele)

  if (currentUrl !== url) {
    url = currentUrl;

    if (isTweetUrl(currentUrl)) {
      // Save the URL
      await saveUrl(currentUrl);  
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

// Save Button
const addSaveButtonsToTweets = async () => {
  try {
    // Check if extension context is still valid
    if (!chrome.runtime?.id) {
      console.log('Extension context invalidated - reloading page');
      window.location.reload();
      return;
    }

    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
    let iconThemeClassName = `tweet-saver--save-tweet-button-${styleTheme}`;

    tweets.forEach(tweet => {
      try {
        // Check if the tweet already has a save button
        if (!tweet.querySelector('.tweet-saver--save-tweet-button')) {
          // Create button
          const buttonElement = document.createElement('div');
          buttonElement.classList.add('tweet-saver--save-tweet-button', iconThemeClassName);
          
          // Add hover effect
          buttonElement.addEventListener('mouseover', () => {
            buttonElement.style.opacity = '1';
          });
          buttonElement.addEventListener('mouseout', () => {
            buttonElement.style.opacity = '0.4';
          });

          buttonElement.addEventListener('click', async (event) => {
            try {
              event.stopPropagation(); // Prevent the tweet click event from being triggered
              await saveNewTweet(tweet, null);
              showSplashEffect(buttonElement);
            } catch (err) {
              if (debugMode) console.error('Error in save button click handler:', err);
              // Check if extension context is still valid
              if (!chrome.runtime?.id) {
                window.location.reload();
                return;
              }
            }
          });
          
          let iconElement = plusIconDarkTheme;

          // Add cloud icon to button 
          if (styleTheme === 'dark') {
            iconElement = plusIconDarkTheme;
          } else if (styleTheme === 'light' || styleTheme === 'normal') {
            iconElement = plusIconLightTheme;  
          }

          // Check if extension context is valid before getting URL
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
          
          // Add the button to the tweet - next to the bookmark icon
          let bookmarkElement = tweet.querySelector('[data-testid="bookmark"]') || tweet.querySelector('[data-testid="removeBookmark"]');
          let parentElement = bookmarkElement?.parentNode || null;
          if (parentElement) {
            parentElement.insertBefore(buttonElement, bookmarkElement.nextSibling);
          }
        }
      } catch (err) {
        if (debugMode) console.error('Error processing tweet:', err);
      }
    });
  } catch (err) {
    if (debugMode) console.error('Error in addSaveButtonsToTweets:', err);
    // Check if extension context is still valid
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

  // Retrieve and set options
  await chrome.storage.sync.get("options")
    .then(function (result) {

      if (result && result.options){
        let newOptionObj = extractProperties(optionsList, result.options);

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

    })
    .catch(function (error) {
      if (debugMode) console.error('initializeOptions - Error retrieving options:', error);
    });
}

/////// Initialization ///////

(async function () {
  await initializeOptions(); 
  await getSavedData(); 
  await handleUrlChange();
  await addSaveButtonsToTweets();
  await detectUrlChange();
})();
