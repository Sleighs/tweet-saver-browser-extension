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
      const tweets = await chrome.storage.local.get('tweets');
      const dataStr = JSON.stringify(tweets);
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

  return (
    <div className="settings-section">
      <h2>Storage Settings</h2>
      
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

      <div className="setting-group">
        <button 
          className="action-button"
          onClick={handleExportData}
        >
          Export Data
        </button>
        <p className="setting-description">
          Download all your saved tweets as a JSON file
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