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
};

let enableExtension = true;
let saveLastTweetEnabled = true;
let browserStorageType = 'local';
let debugMode = true;

// Get initial page URL
let url = window.location.href;

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
    const { username, handle, time, text, content, likes, replies, retweets, views, fullTweet, url, other, loggedInAccount } = tweet;

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
  }

  async saveTweet() {
    // Check if the tweet is already saved
    if (savedTweets?.some(savedTweet => savedTweet.url === this.url)) {
      console.log('Tweet already saved');
    } else {
      savedTweets.push(this);

      if (!isUrlSaved(this.url)){
        savedUrls.push(this.url);
      }
            
      // Save to browser storage
      await saveDataToStorage(savedUrls, savedTweets);
      
      // Save to local storage
      //localStorage.setItem('tweet-saver--tweets', JSON.stringify(savedTweets));

      console.log('Tweet saved:', this);
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

    const tweetObj = new Tweet({
      url: currentUrl,
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
const handleUrlChange = async (ele) => {
  const currentUrl = location.href;

  // console.log('handleUrlChange', currentUrl);
  // console.dir(ele)

  if (currentUrl !== url) {
    url = currentUrl;

    //if (url.includes('status')) {
      // If url does not include quotes, reposts, or likes
      if (isTweetUrl(currentUrl)) {
        let tweet = document.querySelector('article');
        let tweetElement  = tweet?.querySelector('[data-testid="tweet"]');
        //console.log(ele)
        // console.log('tweet', tweet);
        // console.log('tweetElement', tweetElement);

        if (tweet) { 
          // Extract tweet data and save tweet
          await saveNewTweet(tweetElement, currentUrl);
        }

        // Save the URL
        await saveUrl(currentUrl);   
      }
    //}
  }
}

// Observer to detect URL changes
const detectUrlChange = async () => {
  const observer = new MutationObserver((node) => {
    handleUrlChange(node);
  });

  observer.observe(document, { subtree: true, childList: true });

  window.addEventListener('popstate', handleUrlChange);
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




/////// Helper functions ///////

const isUrlSaved = (urlToCheck) => {
  return savedUrls.includes(urlToCheck);
};

const isTweetUrl = (urlToCheck) => {
  if (urlToCheck.includes('status') && !urlToCheck.includes('photo') && !urlToCheck.includes('quote') && !urlToCheck.includes('retweet') && !urlToCheck.includes('like')) {
    return true;
  }
  return false;
};





/////// Event listeners ///////

// Add click event listener for saving tweets
document.addEventListener('click', async function(event) {
  let tweet = event.target.closest('article');
  // get element type of target


  if (
    event.target.getAttribute('data-testid') === 'tweet'
    || 
    event.target === document.querySelector('article')
  ){
    console.log('tweet clicked data-testid');
    await saveNewTweet(event.target, location.href);
  }

  if (tweet) {
    console.log('tweet clicked');
    await saveNewTweet(tweet, location.href);
  }
});

// browser.runtime.onMessage.addListener((message, sender, sendResponse) => { });






/////// Initialization ///////

try {
  // Initialize URL change detection
   detectUrlChange();

  // Check initial URL
   handleUrlChange();

  // Get the saved tweets from browser storage
   getSavedData();

} catch (error) {
  console.error('Error in Tweet Saver', error);
}

const initializeOptions = async () => {
  // Retrieve and set options
  await chrome.storage.sync.get("options")
    .then(function (result) {

      const defaultOptions = {
        enableExtension: true,
        saveLastTweetEnabled: true,
        browserStorageType: 'local',
        debugMode: true,
      };

      const optionsList = [
        "enableExtension",
        "saveLastTweetEnabled",
        "browserStorageType",
        "debugMode",
      ];

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
      if (debugMode) console.error('initializeOptions - Error retrieving options:', error, optionsState);
    });
}

// (async () => {
//   try {

//     await initializeOptions();

//     // await detectUrlChange();

//     // // Check initial URL
//     // await handleUrlChange();
  
//     // // Get the saved tweets from browser storage
//     // await getSavedData();
//   } catch (error) {
//     console.error('Error in Tweet Saver', error);
//   }
// })();


