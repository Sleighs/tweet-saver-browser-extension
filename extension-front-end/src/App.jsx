import { useEffect, useState } from 'react'
import { getSavedTweets, getTweetUrls, saveQuickDraft, loadQuickDraft, saveDataToStorage } from './extension';

import sampleData from './scripts/sampleData';

import './App.css'


const devMode = true;

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
  const [savedDraft, setSavedDraft] = useState('');
  const [saveDraftLabelEnabled, setSaveDraftLabelEnabled] = useState(false);

  const getData = async () => {
    if (devMode) {

      return;
    }
    const tweetData = await getSavedTweets();
    const urlData = await getTweetUrls();
    const savedDraft = await loadQuickDraft();

    if (tweetData) {
      console.log('Tweet data:', tweetData);
      setSavedTweets(JSON.parse(tweetData.tweets).reverse());
    }

    if (urlData) {
      console.log('URL data:', urlData);
      setSavedUrls(JSON.parse(urlData.tweetUrls).reverse());
    }

    if (savedDraft) {
      setSavedDraft(savedDraft);
    }
  }

  const handleDraftChange = (event) => {
    const saveDraftInterval = setTimeout(() => {
      // Save the draft to state
      saveQuickDraft(savedDraft); 
  
      // Show the saved label
      document.getElementById('quick-draft-label').innerHTML = 'Draft saved';
        
      // Clear the saved label
      setTimeout(() => {
        document.getElementById('quick-draft-label').innerHTML = '';
      }, 2750);
    }, 2500);

    
    clearInterval(saveDraftInterval);
    
    // Save if draft is new
    if (event.target.value !== savedDraft) {
      console.log('Saving draft:', event.target.value);
      saveDraftInterval();
      setSavedDraft(event.target.value);
    }
  }

  

  // const savedLabel = () => {
  //   document.getElementById('quick-draft-label').innerHTML = 'Draft saved';
      
  //   // Clear the saved label
  //   setTimeout(() => {
  //     document.getElementById('quick-draft-label').innerHTML = '';
  //   }, 2750);
  // }

  const saveTweets = async () => {
    await saveDataToStorage(savedUrls, savedTweets, 'local');
  }

  const deleteTweet = async (tweet) => {
    savedTweets.splice(savedTweets.indexOf(tweet), 1);
    await saveTweets();
    await getData();
  }


  useEffect(() => {
    getData();
  }, []);

  // useEffect(() => {
  //   console.log('Saved URLs from App.jsx:', savedUrls);
  // }, [savedUrls]);

  return (
    <div>
      <div style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
      }}>Tweet Saver</div>

       {/* text area for a quick draft */}
       <div className='quick-draft-container'>
        <div id="quick-draft-label" 
          style={{
            fontSize: '1.5rem',
            color: 'rgb(178, 255, 126)',
            position: 'fixed',
            top: '0',
            left: '50%',
            opacity: '0.75',
            maxHeight: '60px',
        }}
        ></div>
        <textarea
          style={{
            width: '100%',
            height: '100%',
          }}
          placeholder="Enter tweet text here"
          onChange={(e) => handleDraftChange(e)}
          value={savedDraft ? savedDraft : ''}
        />
      </div>
      
      {/* List of saved Tweets */}
      <div className='saved-tweets-container'>
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
              
              <div>
                {`${tweet?.handle}${tweet?.username ? '/' + tweet.username : ''} - ${tweet?.text}`}
              </div>
              <div style={{display: 'none'}}>
                <div>
                  {`Likes: ${tweet?.likes}`}
                </div>
                <div>
                  {`Replies: ${tweet?.replies}`}
                </div>
                <div>
                  {`Retweets: ${tweet?.retweets}`}
                </div>
                <div>
                  {`Views: ${tweet?.views}`}
                </div>
                <div>
                  {tweet?.time}
              </div>
              </div>
              <div
              style={{
                display: 'flex',
                border: '1px solid white',
                borderRadius: '5px',
                fontSize: '.9rem',
              }}
                className="delete-tweet"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTweet(tweet);
                }}
              >Delete</div>
            </li>)
          ))}
        </ul>
      </div>

      {/* List of saved URLs */}
      <div style={{
        display: 'none',
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

     
    </div>
  )
}

export default App
