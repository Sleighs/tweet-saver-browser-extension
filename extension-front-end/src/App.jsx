/* global chrome */
import { useState, useEffect } from 'react';
import './App.css';
import TweetList from './components/TweetList/TweetList';
import OptionsPanel from './components/OptionsPanel/OptionsPanel';
import Collections from './components/Collections/Collections';
import SettingsService from './services/SettingsService';

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
  }
];

const App = () => {
  const [activeTab, setActiveTab] = useState('tweets');
  const [savedTweets, setSavedTweets] = useState([]);
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPopup, setIsPopup] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);

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
        // Load settings
        const currentSettings = await SettingsService.getSettings();
        setSettings(currentSettings);
        setIsEnabled(currentSettings.enableExtension);

        // Load tweets
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
      const newEnabledState = !isEnabled;
      setIsEnabled(newEnabledState);
      
      // Update settings in storage
      const updatedSettings = {
        ...settings,
        enableExtension: newEnabledState
      };
      
      await SettingsService.updateSettings(updatedSettings);
      setSettings(updatedSettings);

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

  if (isLoading) {
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
                {isEnabled ? 'On' : 'Off'}
              </label>
              <button
                id="extension-toggle"
                className={`toggle-switch ${isEnabled ? 'enabled' : 'disabled'}`}
                onClick={handleToggleExtension}
                aria-label={`Extension is ${isEnabled ? 'enabled' : 'disabled'}`}
                role="switch"
                aria-checked={isEnabled}
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
        {console.log('Debug - activeTab:', activeTab, 'settings:', settings)}
        {ActiveComponent && (
          activeTab === 'tweets' ? (
            <ActiveComponent
              tweets={savedTweets}
              onDeleteTweet={handleDeleteTweet}
              onRefresh={handleRefresh}
            />
          ) : activeTab === 'collections' ? (
            <ActiveComponent
              tweets={savedTweets}
              onUpdateTweet={handleRefresh}
            />
          ) : (
            <ActiveComponent
              settings={settings}
              onSettingChange={(key, value) => setSettings({ ...settings, [key]: value })}
            />
          )
        )}
      </main>
    </div>
  );
};

export default App;
