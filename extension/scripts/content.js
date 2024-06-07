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

*/








/////// Declarations ///////

const browser = chrome || browser;

// Default settings
let defaultSettings = {
  saveLastTweet: true,
};

// Get initial page URL
let url = window.location.href;

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

  saveTweet() {
    // Check if the tweet is already saved
    if (savedTweets?.some(savedTweet => savedTweet.url === this.url)) {
      console.log('Tweet already saved');
    } else {
      savedTweets.push(this);
      savedUrls.push(this.url);

      //localStorage.setItem('tweet-saver--tweets', JSON.stringify(savedTweets));
      
      // Save to browser storage
      saveDataToStorage(savedUrls, savedTweets);
      
      console.log('Tweet saved:', this);
    }
  }
}

console.log('Tweet Saver is running');




//////// Main functions ///////

const getSavedData = async () => {
  // Directly get data from local storage
  chrome.storage.local.get(['tweetUrls', 'tweets'], (result) => {
    if (chrome.runtime.lastError) {
      console.error('Error:', chrome.runtime.lastError);
    } else {
      console.log('getSavedData - Storage data:', result);
      const { tweetUrls, tweets } = result;
      savedTweets = [...tweets];
      savedUrls = [...tweetUrls];
    }
  });
};

function saveDataToStorage(tweetUrls, tweets) {
  chrome.storage.local.set({ tweetUrls, tweets }, function() {
    if (chrome.runtime.lastError) {
      console.error('Error saving data:', chrome.runtime.lastError);
    } else {
      console.log('Data saved successfully:', { tweetUrls, tweets });
    }
  });
}

const saveUrl = (currentUrl) => {
  if (!isUrlSaved(currentUrl) && currentUrl.includes('status')) {
    // Save the URL
    savedUrls.push(currentUrl);

    // Save to local storage
    //localStorage.setItem('tweet-saver--urls', JSON.stringify(savedUrls));

    // Save to browser storage
    saveDataToStorage(savedUrls, savedTweets);

    console.log('URL saved', savedUrls);
  } else {
    console.log('URL already saved');
  }
};



const saveNewTweet = (tweetElement, currentUrl) => {
  if (tweetElement) {
    let tweetUsername = tweetElement.querySelector('[data-testid="User-Name"]').innerText.split('\n');
    let tweetText = tweetElement.querySelector('[data-testid="tweetText"]')?.innerText;
    let tweetTime = tweetElement.querySelector('time').innerText;
    let tweetInfo = tweetElement.querySelectorAll('[data-testid="app-text-transition-container"]');
    let tweetReplies = tweetElement.querySelector('[data-testid="reply"]').innerText;
    let tweetRetweets = tweetElement.querySelector('[data-testid="retweet"]').innerText;
    let tweetLikes = tweetElement.querySelector('[data-testid="like"]')?.innerText;
    let tweetBookmarkCount = tweetElement.querySelector('[data-testid="bookmark"]').innerText;
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

    tweetObj.saveTweet();
  }
};

const deleteAllSavedData = () => {
  // browser.runtime.sendMessage({ method: 'deleteAllTweets' }, (response) => {
  //   if (browser.runtime.lastError) {
  //     console.error('Error:', browser.runtime.lastError);
  //   } else {
  //     console.log('deleteAllSavedData - Storage data:', response);
  //     const { tweetUrls, tweets } = response;
  //     // Use tweetUrls and tweets as needed
  //   }
  // });

  browser.storage.local.clear();

  // Clear local storage
  localStorage.removeItem('tweet-saver--urls');
  localStorage.removeItem('tweet-saver--tweets');
}

// Function to handle the logic when the URL changes
function handleUrlChange() {
  const currentUrl = location.href;

  if (currentUrl !== url) {
    url = currentUrl;

    if (url.includes('status')) {
      // If url does not include quotes, reposts, or likes
      if (!url.includes('quote') && !url.includes('retweet') && !url.includes('like')) {
        let tweet = document.querySelector('article[role="article"]');
        if (tweet) {
          // Extract tweet data and save tweet
          saveNewTweet(tweet, currentUrl);
        }
        // Save the URL
        saveUrl(currentUrl);
    }
      }
      
  }
}

// Function to detect URL changes
function detectUrlChange() {
  const observer = new MutationObserver(() => {
    handleUrlChange();
  });

  observer.observe(document, { subtree: true, childList: true });

  window.addEventListener('popstate', handleUrlChange);
}




/////// Helper functions ///////

const isUrlSaved = (url) => {
  return savedUrls.includes(url);
};





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


// Add click event listener for saving tweets
document.addEventListener('click', function(event) {
  let tweet = event.target.closest('article');

  if (tweet) {
    saveNewTweet(tweet, location.href);
  }

  // if (event.target.getAttribute('data-testid') === 'caret') {
  //   console.log('caret clicked');
  // }

  // if (event.target.getAttribute('data-testid') === 'Dropdown') {
  //   console.log('dropdown clicked');
  // }
});

// browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.method === 'tweetUrls') {
//     console.log('tweetUrls', message.urls);
//   }
// });


// // Send a message to the background script to get data from storage
// chrome.runtime.sendMessage({ method: 'getStorageData' }, (response) => {
//   if (chrome.runtime.lastError) {
//     console.error('Error:', chrome.runtime.lastError);
//   } else {
//     console.log('Storage data:', response);
//     const { tweetUrls, tweets } = response;
//     // Use tweetUrls and tweets as needed
//   }
// });

// setInterval(() => {
//   deleteAllSavedData();
//   setInterval(() => {
//     getSavedData();
//   }, 2000);
// }, 4000);
