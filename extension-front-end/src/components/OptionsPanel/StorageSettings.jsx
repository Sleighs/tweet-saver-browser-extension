/* global chrome */
import { useState, useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import './OptionsPanel.css';

const StorageSettings = () => {
  const { settings, updateSetting } = useSettings();
  const [maxTweets, setMaxTweets] = useState(settings?.maxTweets ?? 1000);
  const [autoCleanup, setAutoCleanup] = useState(settings?.autoCleanup ?? false);
  const [cleanupThreshold, setCleanupThreshold] = useState(settings?.cleanupThreshold ?? 900);
  const [backupEnabled, setBackupEnabled] = useState(settings?.backupEnabled ?? false);
  const [backupFrequency, setBackupFrequency] = useState(settings?.backupFrequency ?? 'weekly');

  useEffect(() => {
    if (settings) {
      setMaxTweets(settings.maxTweets ?? 1000);
      setAutoCleanup(settings.autoCleanup ?? false);
      setCleanupThreshold(settings.cleanupThreshold ?? 900);
      setBackupEnabled(settings.backupEnabled ?? false);
      setBackupFrequency(settings.backupFrequency ?? 'weekly');
    }
  }, [settings]);

  const handleSettingChange = async (key, value) => {
    try {
      await updateSetting(key, value);
      if (window.showNotification) {
        window.showNotification('Settings updated successfully', 'success');
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      if (window.showNotification) {
        window.showNotification('Error updating settings', 'error');
      }
    }
  };

  const handleMaxTweetsChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setMaxTweets(value);
      handleSettingChange('maxTweets', value);
    }
  };

  const handleAutoCleanupChange = (e) => {
    const value = e.target.checked;
    setAutoCleanup(value);
    handleSettingChange('autoCleanup', value);
  };

  const handleCleanupThresholdChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setCleanupThreshold(value);
      handleSettingChange('cleanupThreshold', value);
    }
  };

  const handleBackupEnabledChange = (e) => {
    const value = e.target.checked;
    setBackupEnabled(value);
    handleSettingChange('backupEnabled', value);
  };

  const handleBackupFrequencyChange = (e) => {
    const value = e.target.value;
    setBackupFrequency(value);
    handleSettingChange('backupFrequency', value);
  };

  const handleExportData = async () => {
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

      // Create a JSON file
      const blob = new Blob([JSON.stringify(uniqueTweets, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tweet-saver-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (window.showNotification) {
        window.showNotification('Tweets exported successfully', 'success');
      }
    } catch (error) {
      console.error('Error exporting tweets:', error);
      if (window.showNotification) {
        window.showNotification('Error exporting tweets', 'error');
      }
    }
  };

  const handleCopyToClipboard = async () => {
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

      // Format tweets for clipboard
      const formattedText = uniqueTweets.map(tweet => {
        const tweetDate = new Date(tweet.timestamp).toLocaleString();
        const saveDate = new Date(tweet.savedAt).toLocaleString();
        
        return `Tweet by @${tweet.username}
${tweet.text}
URL: ${tweet.url}
Posted: ${tweetDate}
Saved: ${saveDate}
Storage: ${tweet.storageType}
Stats: ${tweet.stats ? `❤️ ${tweet.stats.likes} 🔁 ${tweet.stats.retweets} 💬 ${tweet.stats.replies}` : 'N/A'}
Media: ${tweet.media ? tweet.media.length : 0} items
${'-'.repeat(50)}`;
      }).join('\n\n');

      await navigator.clipboard.writeText(formattedText);
      
      if (window.showNotification) {
        window.showNotification('Tweets copied to clipboard', 'success');
      }
    } catch (error) {
      console.error('Error copying tweets:', error);
      if (window.showNotification) {
        window.showNotification('Error copying tweets to clipboard', 'error');
      }
    }
  };

  if (!settings) {
    return <div className="loading">Loading settings...</div>;
  }

  return (
    <div className="settings-section">
      <h2>Storage Settings</h2>
      
      {/* <div className="setting-group">
        <label className="setting-label">
          <span>Maximum Saved Tweets</span>
          <input
            type="number"
            min="1"
            max="10000"
            value={maxTweets}
            onChange={handleMaxTweetsChange}
          />
        </label>
        <p className="setting-description">
          Maximum number of tweets to store (1-10000)
        </p>
      </div> */}

      <div className="setting-group">
        <label className="setting-label">
          <span>Auto Cleanup</span>
          <input
            type="checkbox"
            checked={autoCleanup}
            onChange={handleAutoCleanupChange}
            disabled={true}
          />
        </label>
        <p className="setting-description">
          Automatically remove oldest tweets when storage limit is reached
        </p>
      </div>

      {autoCleanup && (
        <div className="setting-group">
          <label className="setting-label">
            <span>Cleanup Threshold</span>
            <input
              type="number"
              min="1"
              max={maxTweets}
              value={cleanupThreshold}
              onChange={handleCleanupThresholdChange}
            />
          </label>
          <p className="setting-description">
            Number of tweets to keep after cleanup
          </p>
        </div>
      )}

      <div className="setting-group">
        <h3>Export Options</h3>
        <div className="export-buttons">
          <button onClick={handleExportData} className="export-button">
            <span className="button-icon">📥</span>
            Export to File
          </button>
          <button onClick={handleCopyToClipboard} className="export-button">
            <span className="button-icon">📋</span>
            Copy to Clipboard
          </button>
        </div>
        <p className="setting-description">
          Export your saved tweets as a file or copy them to clipboard
        </p>
      </div>
    </div>
  );
};

export default StorageSettings; 