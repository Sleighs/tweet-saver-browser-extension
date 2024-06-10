import { useEffect, useState } from 'react'
import { getSavedTweets, getTweetUrls } from './extension';

import './App.css'


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

      if (isTweetUrl(this.url) && !isUrlSaved(this.url)){
        savedUrls.push(this.url);
      }
            
      // Save to browser storage
      // await saveDataToStorage(savedUrls, savedTweets);
      
      // Save to local storage
      // localStorage.setItem('tweet-saver--tweets', JSON.stringify(savedTweets));

      console.log('Tweet saved:', this);
    }
  }
}

function App() {
  const [savedUrls, setSavedUrls] = useState(null);
  const [savedTweets, setSavedTweets] = useState(null);
  const [savedDrafts, setSavedDrafts] = useState(null);

  const getData = async () => {
    const tweetData = await getSavedTweets();
    const urlData = await getTweetUrls();

    if (tweetData) {
      console.log('Tweet data:', tweetData);
      setSavedTweets(JSON.parse(tweetData.tweets).reverse());
    }

    if (urlData) {
      console.log('URL data:', urlData);
      setSavedUrls(JSON.parse(urlData.tweetUrls).reverse());
    }
  }

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    console.log('Saved URLs from App.jsx:', savedUrls);
  }, [savedUrls]);

  return (
    <div>
      <h1>Tweet Saver</h1>
      
      <div style={{
        //display: 'none',
      }}>
        <h2>Saved URLs</h2>
        {savedUrls === null && <p>No saved URLs</p>}
        <p>
          Last visited: {savedUrls &&               
          <a href={savedUrls[0]} target="_blank" rel="noreferrer">{savedUrls[0]}</a>
        }</p>
        <ul style={{
          listStyleType: 'none',
        }}>
          {savedUrls && (savedUrls.map((url, index) => (
            <li key={index} className="">
              <a href={url} target="_blank" rel="noreferrer">{url}</a>
            </li>
          )))}
        </ul>
      </div>

      <div>
        <h2>Saved Tweets</h2>
        {savedTweets === null && <p>No saved tweets</p>}
        {savedTweets !== null && <div style={{display: 'none'}}>
          <h3>Sort Options</h3>
          <button>Date</button>
          <button>Likes</button>
          <button>Replies</button>
          <button>Retweets</button>
          <button>Views</button>
        </div>}
        <ul 
          className="saved-tweets"
        >
          {savedTweets && (savedTweets.map((tweet, index) => (
            <li key={index} className="tweet"
              onClick={() => window.open(tweet?.url)}
            >
              {`${tweet?.handle}${tweet?.username ? '/' + tweet.username : ''} - ${tweet?.text}`}
            </li>)
          ))}
        </ul>
      </div>

      {/* text area for a quick draft */}
      <div>
        <textarea
          style={{
            width: '100%',
          }}
          placeholder="Enter tweet text here"
        />
      </div>
    </div>
  )
}

export default App
