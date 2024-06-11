/*
Features for Tweet Saver
- Stay on page after switching accounts
  - Detect account change
- add right click support
- Make observer more efficient
  - Disconnect observer when not needed

- Determine if a tweet has media

- Use twitter's data-testid to get tweet elements

- add a web scraper
  - might be a cleaner way to get tweet data

- Make a place to save quick drafts

- make api 

- Make an animation for when a tweet is saved
  - splash animation at cursor

- if there's an image
  - save image
  - show image on front end
*/

console.log('Tweet Saver is running');





/////// Declarations ///////

const browser = chrome || browser;

// Options
let optionsState = {
  enableExtension: true,
  saveLastTweetEnabled: true,
  browserStorageType: 'local', // local or sync
  debugMode: true,
  enablePhotoUrlSave: true, 
};

const defaultOptions = {
  enableExtension: true,
  saveLastTweetEnabled: true,
  browserStorageType: 'local',
  debugMode: true,
  enablePhotoUrlSave: true,
};

const optionsList = [
  "enableExtension",
  "saveLastTweetEnabled",
  "browserStorageType",
  "debugMode",
  "enablePhotoUrlSave", 
];

let enableExtension = true;
let saveLastTweetEnabled = true;
let browserStorageType = 'local';
let debugMode = true;
let enablePhotoUrlSave = true;

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
    const { username, handle, time, text, content, likes, replies, retweets, views, fullTweet, url, other, loggedInAccount, links } = tweet;

    this.username = username;
    this.handle = handle;
    this.time = time;
    this.text = text;
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
  }

  async saveTweet() {
    if (!isUrlSaved(this.url)){
      savedUrls.push(this.url);
    }

    // Check if the tweet is already saved
    try {
      if (savedTweets?.some(savedTweet => savedTweet?.text === this.text)
        && savedTweets?.some(savedTweet => savedTweet?.time === this.time)
      ) {
        console.log('Tweet already saved');
      } else {
        savedTweets.push(this);
              
        // Save to browser storage
        await saveDataToStorage(savedUrls, savedTweets);
        
        // Save to local storage
        //localStorage.setItem('tweet-saver--tweets', JSON.stringify(savedTweets));

        console.log('Tweet saved:', this);
      }
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
          if (debugMode) console.log('getSavedData - Storage data:', result);
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
          if (debugMode) console.log('getSavedData - Storage data:', result);
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

      console.log('URL saved', savedUrls);
    } else if (!savedTweets?.some(savedTweet => savedTweet?.url === this.url)){
      // Save to browser storage
      await saveDataToStorage(savedUrls, savedTweets);
    } else {
      console.log('URL already saved');
    }
  } catch (error) {
    if (debugMode) console.error('saveUrl - Error saving URL:', error);
  }
};


const saveNewTweet = async (tweetElement, currentUrl) => {
  if (tweetElement) {
    let tweetUsername = tweetElement.querySelector('[data-testid="User-Name"]')?.innerText.split('\n');
    let tweetText = tweetElement.querySelector('[data-testid="tweetText"]')?.innerText;
    let tweetTime = tweetElement.querySelector('time')?.innerText;
    let tweetInfo = tweetElement.querySelectorAll('[data-testid="app-text-transition-container"]');
    let tweetReplies = tweetElement.querySelector('[data-testid="reply"]')?.innerText;
    let tweetRetweets = tweetElement.querySelector('[data-testid="retweet"]')?.innerText;
    let tweetLikes = tweetElement.querySelector('[data-testid="like"]')?.innerText;
    let tweetBookmarkCount = tweetElement.querySelector('[data-testid="bookmark"]')?.innerText;
    let username = tweetElement.querySelector('[data-testid="AppTabBar_Profile_Link"]')?.innerText || '';

    // check data-testid's that contain UserAvatar-Container-
    //let tweetAvatar = tweetElement.querySelectorAll('[data-testid^="UserAvatar-Container-"]');
    //console.log('tweetAvatar', tweetAvatar);

    const getUrl = () => {
      if (!currentUrl) {
        // Get the current URLfrom links
        let links = Array.from(tweetElement.querySelectorAll('a'));
        for (let link of links) {
          if (isTweetUrl(link.href, true)) {
            return link.href;
          }
        }
      }
    }

    const tweetObj = new Tweet({
      url: currentUrl || getUrl(),
      fullTweet: tweetElement?.innerText,
      username: tweetUsername[0],
      handle: tweetUsername[1],
      text: tweetText,
      time: tweetTime,
      views: tweetInfo[0]?.innerText || '',
      replies: tweetReplies,
      retweets: tweetRetweets,
      likes: tweetLikes,
      bookmarkCount: tweetBookmarkCount,
      links: Array.from(tweetElement.querySelectorAll('a')).map(link => link.href),
      loggedInAccount: username,
    });

    await tweetObj.saveTweet();
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

const addSaveButtonsToTweets = async () => {
  const tweets = document.querySelectorAll('article[data-testid="tweet"]');
  tweets.forEach(tweet => {
    if (!tweet.querySelector('.tweet-saver--save-tweet-button')) {
      const button = document.createElement('button');
      button.innerText = 'Save';
      button.classList.add('tweet-saver--save-tweet-button');
      
      // Add hover effect
      button.addEventListener('mouseover', () => {
        button.style.opacity = '1';
      });
      button.addEventListener('mouseout', () => {
        button.style.opacity = '0.4';
      });

      button.addEventListener('click', async (event) => {
        event.stopPropagation(); // Prevent the tweet click event from being triggered
        await saveNewTweet(tweet, null);

        showSplashEffect(button);
      });

      tweet.appendChild(button);
    }
  });
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
  const observer = new MutationObserver((node) => {
    handleUrlChange(node);
    addSaveButtonsToTweets();
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
        debugMode = newOptionObj.debugMode;
        
        Object.assign(optionsState, newOptionObj);
      } else {
        enableExtension = defaultOptions.enableExtension;
        saveLastTweetEnabled = defaultOptions.saveLastTweetEnabled;
        browserStorageType = defaultOptions.browserStorageType;
        debugMode = defaultOptions.debugMode;

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


