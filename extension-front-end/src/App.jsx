/* global chrome */
import { useState, useEffect } from 'react';
import './App.css';
import TweetList from './components/TweetList/TweetList';
import OptionsPanel from './components/OptionsPanel/OptionsPanel';
import Collections from './components/Collections/Collections';
import About from './components/About/About';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';

const TABS = [
  {
    id: 'tweets',
    label: 'Saved Posts',
    icon: '🐦',
    component: TweetList
  },
  // {
  //   id: 'collections',
  //   label: 'Collections',
  //   icon: '📑',
  //   component: Collections
  // },
  {
    id: 'settings',
    label: 'Settings',
    icon: '⚙️',
    component: OptionsPanel
  },
  {
    id: 'about',
    label: 'About',
    icon: 'ℹ️',
    component: About
  }
];

// Inner App component that uses the settings context
const AppContent = () => {
  const { settings, isLoading: isSettingsLoading, updateSetting } = useSettings();
  const [activeTab, setActiveTab] = useState('tweets');
  const [savedTweets, setSavedTweets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPopup, setIsPopup] = useState(false);

  const loadTweets = async () => {
    try {
      // Get tweets from both storage types
      const [localResult, syncResult] = await Promise.all([
        chrome.storage.local.get('tweets'),
        chrome.storage.sync.get('tweets')
      ]);

      // Parse tweets from both storages
      const localTweets = localResult.tweets ? JSON.parse(localResult.tweets) : [];
      const syncTweets = syncResult.tweets ? JSON.parse(syncResult.tweets) : [];

      // Combine and deduplicate tweets based on URL
      const allTweets = [...localTweets, ...syncTweets];
      const uniqueTweets = Array.from(
        new Map(allTweets.map(tweet => [tweet.url, tweet])).values()
      );

      setSavedTweets(uniqueTweets);
    } catch (err) {
      console.error('Error loading tweets:', err);
      setError('Failed to load tweets. Please try again.');
    }
  };

  useEffect(() => {
    // Check if we're in popup mode by checking window dimensions
    setIsPopup(window.innerWidth < 800);
    
    const loadData = async () => {
      try {
        setIsLoading(true);
        await loadTweets();
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleDeleteTweet = async (tweet) => {
    try {
      // Get current tweets and URLs from both storages
      const [localData, syncData] = await Promise.all([
        chrome.storage.local.get(['tweets', 'tweetUrls']),
        chrome.storage.sync.get(['tweets', 'tweetUrls'])
      ]);

      // Parse tweets and URLs from both storages
      const localTweets = localData.tweets ? JSON.parse(localData.tweets) : [];
      const syncTweets = syncData.tweets ? JSON.parse(syncData.tweets) : [];
      const localUrls = localData.tweetUrls ? JSON.parse(localData.tweetUrls) : [];
      const syncUrls = syncData.tweetUrls ? JSON.parse(syncData.tweetUrls) : [];

      // Remove tweet from both arrays
      const updatedLocalTweets = localTweets.filter(t => t.url !== tweet.url);
      const updatedSyncTweets = syncTweets.filter(t => t.url !== tweet.url);

      // Remove URL from both arrays
      const updatedLocalUrls = localUrls.filter(url => url !== tweet.url);
      const updatedSyncUrls = syncUrls.filter(url => url !== tweet.url);

      // Save back to both storages
      await Promise.all([
        chrome.storage.local.set({
          tweets: JSON.stringify(updatedLocalTweets),
          tweetUrls: JSON.stringify(updatedLocalUrls)
        }),
        chrome.storage.sync.set({
          tweets: JSON.stringify(updatedSyncTweets),
          tweetUrls: JSON.stringify(updatedSyncUrls)
        })
      ]);

      // Update the UI with combined remaining tweets
      const allTweets = [...updatedLocalTweets, ...updatedSyncTweets];
      const uniqueTweets = Array.from(
        new Map(allTweets.map(t => [t.url, t])).values()
      );
      setSavedTweets(uniqueTweets);
    } catch (err) {
      console.error('Error deleting tweet:', err);
      setError('Failed to delete tweet. Please try again.');
    }
  };

  const handleRefresh = async () => {
    await loadTweets();
  };

  const handleOpenInTab = () => {
    if (chrome.runtime?.id) {
      chrome.tabs.create({
        url: chrome.runtime.getURL('dist/index.html')
      });
      // If we're in the popup, close it
      if (isPopup) {
        window.close();
      }
    }
  };

  const handleToggleExtension = async () => {
    try {
      const newEnabledState = !settings.enableExtension;
      await updateSetting('enableExtension', newEnabledState);

      // Notify content script
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'SETTINGS_UPDATED'
        });
      }
    } catch (err) {
      console.error('Error toggling extension:', err);
      setError('Failed to update extension state. Please try again.');
    }
  };

  if (isLoading || isSettingsLoading) {
    return <div className="loading">Loading...</div>;
  }

  const ActiveComponent = TABS.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>X Post Saver</h1>
          <div className="header-controls">
            {isPopup && ( 
              <button className="open-in-tab-button" onClick={handleOpenInTab}>
                Open in Tab<span className="open-in-tab-icon">🔎</span> 
              </button>
            )}
            <div className="extension-toggle">
              <label className="toggle-label" htmlFor="extension-toggle">
                {settings.enableExtension ? 'On' : 'Off'}
              </label>
              <button
                id="extension-toggle"
                className={`toggle-switch ${settings.enableExtension ? 'enabled' : 'disabled'}`}
                onClick={handleToggleExtension}
                aria-label={`Extension is ${settings.enableExtension ? 'enabled' : 'disabled'}`}
                role="switch"
                aria-checked={settings.enableExtension}
              >
                <span className="toggle-track"></span>
                <span className="toggle-thumb"></span>
              </button>
            </div>
           
          </div>
        </div>
        <nav className="app-tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`app-header-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <main className="app-main">
        {ActiveComponent && (
          activeTab === 'tweets' ? (
            <ActiveComponent
              tweets={savedTweets}
              onDeleteTweet={handleDeleteTweet}
              onRefresh={handleRefresh}
              settings={settings}
            />
          ) : activeTab === 'collections' ? (
            <ActiveComponent
              tweets={savedTweets}
              onUpdateTweet={handleRefresh}
            />
          ) : activeTab === 'about' ? (
            <ActiveComponent />
          ) : (
            <ActiveComponent
              settings={settings}
              onSettingChange={updateSetting}
            />
          )
        )}
      </main>
    </div>
  );
};

// Wrap the app with the settings provider
const App = () => (
  <SettingsProvider>
    <AppContent />
  </SettingsProvider>
);

export default App;
