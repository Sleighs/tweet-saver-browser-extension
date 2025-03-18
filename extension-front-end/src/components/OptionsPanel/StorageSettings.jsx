/* global chrome */
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './OptionsPanel.css';
import StorageManager from '../../services/StorageManager';

const StorageSettings = ({ settings, onSettingChange }) => {
  const [maxTweets, setMaxTweets] = useState(settings.maxTweets ?? 1000);
  const [autoCleanup, setAutoCleanup] = useState(settings.autoCleanup ?? false);
  const [cleanupThreshold, setCleanupThreshold] = useState(settings.cleanupThreshold ?? 900);
  const [backupEnabled, setBackupEnabled] = useState(settings.backupEnabled ?? false);
  const [backupFrequency, setBackupFrequency] = useState(settings.backupFrequency ?? 'weekly');
  const [syncStorage, setSyncStorage] = useState(settings.storageType === 'sync');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadStorageType = async () => {
      const currentType = await StorageManager.getCurrentStorageType();
      setSyncStorage(currentType === 'sync');
    };
    loadStorageType();
  }, []);

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

  const handleSyncStorageChange = async (e) => {
    try {
      setIsProcessing(true);
      const value = e.target.checked;
      const newStorageType = value ? 'sync' : 'local';
      
      // Update storage type and migrate data
      await StorageManager.setStorageType(newStorageType);
      
      setSyncStorage(value);
      onSettingChange('storageType', newStorageType);
      
      // Show success notification
      if (window.showNotification) {
        window.showNotification(`Successfully switched to ${newStorageType} storage`, 'success');
      }
    } catch (error) {
      console.error('Error changing storage type:', error);
      if (window.showNotification) {
        window.showNotification('Failed to change storage type', 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportData = async () => {
    try {
      setIsProcessing(true);
      const allTweets = await StorageManager.getAllTweets();
      
      const dataStr = JSON.stringify({ tweets: allTweets }, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `tweet-saver-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (window.showNotification) {
        window.showNotification('Tweets exported successfully', 'success');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      if (window.showNotification) {
        window.showNotification('Error exporting tweets', 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      setIsProcessing(true);
      const allTweets = await StorageManager.getAllTweets();

      // Format tweets for clipboard
      const formattedTweets = allTweets.map(tweet => {
        return `Tweet by ${tweet.username} (${tweet.handle})
Text: ${tweet.text || 'No text'}
URL: ${tweet.url}
Time: ${new Date(tweet.time).toLocaleString()}
Saved: ${new Date(tweet.savedAt).toLocaleString()}
Storage: ${tweet.storageType}
Stats: ${tweet.likes} likes, ${tweet.retweets} retweets, ${tweet.replies} replies
${tweet.mediaItems?.length ? `Media: ${tweet.mediaItems.length} items\n` : ''}
----------------------------------------`;
      }).join('\n');

      await navigator.clipboard.writeText(formattedTweets);
      
      if (window.showNotification) {
        window.showNotification('Tweets copied to clipboard', 'success');
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      if (window.showNotification) {
        window.showNotification('Error copying tweets to clipboard', 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="settings-section">
      <h2>Storage Settings</h2>

      <div className="setting-group">
        <label className="setting-label">
          <span>Save across all browsers</span>
          <input
            type="checkbox"
            checked={syncStorage}
            onChange={handleSyncStorageChange}
            disabled={isProcessing}
          />
        </label>
        <p className="setting-description">
          {isProcessing ? 'Processing storage change...' : 
            'Sync saved tweets across all browsers where you\'re signed in with your account'}
        </p>
      </div>
      
      <div className="setting-group">
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
      </div>

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
        <label className="setting-label">
          <span>Automatic Backup</span>
          <input
            type="checkbox"
            checked={backupEnabled}
            onChange={handleBackupEnabledChange}
          />
        </label>
        <p className="setting-description">
          Automatically backup your saved tweets
        </p>
      </div>

      {backupEnabled && (
        <div className="setting-group">
          <label className="setting-label">
            <span>Backup Frequency</span>
            <select value={backupFrequency} onChange={handleBackupFrequencyChange}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          <p className="setting-description">
            How often to create automatic backups
          </p>
        </div>
      )}

      <div className="setting-group export-section">
        <h3>Export Options</h3>
        <div className="export-buttons">
          <button
            onClick={handleExportData}
            disabled={isProcessing}
            className="export-button"
            title="Download tweets as JSON file"
          >
            <span className="button-icon">📥</span>
            Export to File
          </button>
          <button
            onClick={handleCopyToClipboard}
            disabled={isProcessing}
            className="copy-button"
            title="Copy formatted tweet list to clipboard"
          >
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
    backupFrequency: PropTypes.string,
    storageType: PropTypes.string
  }).isRequired,
  onSettingChange: PropTypes.func.isRequired
};

export default StorageSettings; 