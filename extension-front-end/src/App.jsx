import { useEffect, useState } from 'react'
import { getSavedTweets, getTweetUrls } from './extension';

import './App.css'

function App() {
  const [savedUrls, setSavedUrls] = useState(null);
  const [savedTweets, setSavedTweets] = useState(null);

  const getData = async () => {
    const tweetData = await getSavedTweets();
    const urlData = await getTweetUrls();

    if (tweetData) {
      console.log('Tweet data:', tweetData);
      setSavedTweets(tweetData.tweets);
    }
    if (urlData) {
      console.log('URL data:', urlData);
      setSavedUrls(urlData.tweetUrls);
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
      <div>
        <h2>Saved URLs</h2>
        {savedUrls === null && <p>No saved URLs</p>}
        <p>{savedUrls && String(savedUrls[0])}</p>
        <ul>
          {savedUrls && (savedUrls.map((url, index) => (
            <li key={index}>
              <a href={url} target="_blank" rel="noreferrer">{url}</a>
            </li>
          )))}
        </ul>
      </div>
      
      <div>
        <h2>Saved Tweets</h2>
        {savedTweets === null && <p>No saved tweets</p>}
        <ul>
          {savedTweets && (savedTweets.map((tweet, index) => (
            <li key={index}>
              {`${tweet?.handle}${tweet?.username ? '/' + tweet.username : ''} - ${tweet?.text}`}
            </li>)
          ))}
        </ul>
      </div>
    </div>
  )
}

export default App
