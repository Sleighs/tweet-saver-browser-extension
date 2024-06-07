import { useEffect, useState } from 'react'
import { getSavedTweets, getTweetUrls } from './extension';

import './App.css'

function App() {
  const [savedUrls, setSavedUrls] = useState(null);
  const [savedTweets, setSavedTweets] = useState(null);

  useEffect(() => {
    getSavedTweets().then((data) => {
      console.log('getSavedTweets data', data);
    });

    getTweetUrls().then((data) => {
      console.log('getTweetUrls data', data);
    });

  }, []);

  // useEffect(() => {
  //   let urlsFromLocalStorage = JSON.parse(localStorage.getItem('tweet-saver--urls')) || null;
  //   let tweetsFromLocalStorage = JSON.parse(localStorage.getItem('tweet-saver--tweets')) || null;

  //   console.log('urlsFromLocalStorage', urlsFromLocalStorage);
  //   console.log('tweetsFromLocalStorage', tweetsFromLocalStorage);

  //   setSavedUrls(urlsFromLocalStorage);
  //   setSavedTweets(tweetsFromLocalStorage);
  // }, []);


  return (
    <div>
      <div>
        <h2>Saved URLs</h2>
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
          <ul>
            {savedTweets && (savedTweets.map((tweet, index) => (
              <li key={index}>
                {String(tweet)}
              </li>)
            ))}
          </ul>
        </div>
    </div>
  )
}

export default App
