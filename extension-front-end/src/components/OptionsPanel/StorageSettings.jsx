/* global chrome */
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './OptionsPanel.css';

const StorageSettings = ({ settings, onSettingChange }) => {
  const [maxTweets, setMaxTweets] = useState(settings.maxTweets ?? 1000);
  const [autoCleanup, setAutoCleanup] = useState(settings.autoCleanup ?? false);
  const [cleanupThreshold, setCleanupThreshold] = useState(settings.cleanupThreshold ?? 900);
  const [backupEnabled, setBackupEnabled] = useState(settings.backupEnabled ?? false);
  const [backupFrequency, setBackupFrequency] = useState(settings.backupFrequency ?? 'weekly');

  useEffect(() => {
    setMaxTweets(settings.maxTweets ?? 1000);
    setAutoCleanup(settings.autoCleanup ?? false);
    setCleanupThreshold(settings.cleanupThreshold ?? 900);
    setBackupEnabled(settings.backupEnabled ?? false);
    setBackupFrequency(settings.backupFrequency ?? 'weekly');
  }, [settings]);

  const handleMaxTweetsChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setMaxTweets(value);
      onSettingChange('maxTweets', value);
    }
  };

  const handleAutoCleanupChange = (e) => {
    const value = e.target.checked;
    setAutoCleanup(value);
    onSettingChange('autoCleanup', value);
  };

  const handleCleanupThresholdChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setCleanupThreshold(value);
      onSettingChange('cleanupThreshold', value);
    }
  };

  const handleBackupEnabledChange = (e) => {
    const value = e.target.checked;
    setBackupEnabled(value);
    onSettingChange('backupEnabled', value);
  };

  const handleBackupFrequencyChange = (e) => {
    const value = e.target.value;
    setBackupFrequency(value);
    onSettingChange('backupFrequency', value);
  };

  const handleExportData = async () => {
    try {
      // Get data from both storage types to not lose any tweets
      const [localData, syncData] = await Promise.all([
        chrome.storage.local.get('tweets'),
        chrome.storage.sync.get('tweets')
      ]);

      // Parse and combine the data
      const localTweets = localData.tweets ? JSON.parse(localData.tweets) : [];
      const syncTweets = syncData.tweets ? JSON.parse(syncData.tweets) : [];
      const allTweets = [...localTweets, ...syncTweets];

      // Remove duplicates based on URL
      const uniqueTweets = Array.from(
        new Map(allTweets.map(tweet => [tweet.url, tweet])).values()
      );

      const dataStr = JSON.stringify({ tweets: uniqueTweets });
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `tweet-saver-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      // Get data from both storage types
      const [localData, syncData] = await Promise.all([
        chrome.storage.local.get('tweets'),
        chrome.storage.sync.get('tweets')
      ]);

      // Parse and combine the data
      const localTweets = localData.tweets ? JSON.parse(localData.tweets) : [];
      const syncTweets = syncData.tweets ? JSON.parse(syncData.tweets) : [];
      const allTweets = [...localTweets, ...syncTweets];

      // Remove duplicates based on URL
      const uniqueTweets = Array.from(
        new Map(allTweets.map(tweet => [tweet.url, tweet])).values()
      );

      // Format tweets for clipboard
      const formattedTweets = uniqueTweets.map(tweet => {
        return `Tweet by ${tweet.username} (${tweet.handle})
Text: ${tweet.text || 'No text'}
URL: ${tweet.url}
Time: ${new Date(tweet.time).toLocaleString()}
Saved: ${new Date(tweet.savedAt).toLocaleString()}
Stats: ${tweet.likes} likes, ${tweet.retweets} retweets, ${tweet.replies} replies
${tweet.mediaItems?.length ? `Media: ${tweet.mediaItems.length} items\n` : ''}
----------------------------------------`;
      }).join('\n');

      await navigator.clipboard.writeText(formattedTweets);
      // Show success message using the existing notification system if available
      if (window.showNotification) {
        window.showNotification('Tweets copied to clipboard', 'success');
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      if (window.showNotification) {
        window.showNotification('Error copying tweets to clipboard', 'error');
      }
    }
  };

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

StorageSettings.propTypes = {
  settings: PropTypes.shape({
    maxTweets: PropTypes.number,
    autoCleanup: PropTypes.bool,
    cleanupThreshold: PropTypes.number,
    backupEnabled: PropTypes.bool,
    backupFrequency: PropTypes.string
  }).isRequired,
  onSettingChange: PropTypes.func.isRequired
};

export default StorageSettings; 