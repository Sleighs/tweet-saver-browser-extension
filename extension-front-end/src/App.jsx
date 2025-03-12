/* global chrome */
import { useState, useEffect } from 'react';
import './App.css';
import TweetList from './components/TweetList/TweetList';
import OptionsPanel from './components/OptionsPanel/OptionsPanel';
import SettingsService from './services/SettingsService';

const TABS = [
  {
    id: 'tweets',
    label: 'Saved Tweets',
    icon: '🐦',
    component: TweetList
  },
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

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Load settings
        const currentSettings = await SettingsService.getSettings();
        setSettings(currentSettings);

        // Load tweets (we'll implement this in TweetService)
        const tweets = await chrome.storage.local.get('tweets');
        setSavedTweets(JSON.parse(tweets.tweets || '[]'));
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
      const updatedTweets = savedTweets.filter(t => t.url !== tweet.url);
      setSavedTweets(updatedTweets);
      await chrome.storage.local.set({
        tweets: JSON.stringify(updatedTweets)
      });
    } catch (err) {
      console.error('Error deleting tweet:', err);
      setError('Failed to delete tweet. Please try again.');
    }
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  const ActiveComponent = TABS.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Tweet Saver</h1>
        <nav className="app-tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
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
