/* global chrome */
import { useState, useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import './OptionsPanel.css';

const AdvancedSettings = () => {
  const { settings, updateSetting } = useSettings();
  const [debugMode, setDebugMode] = useState(settings?.debugMode ?? false);
  const [customCSS, setCustomCSS] = useState(settings?.customCSS ?? '');
  const [retryAttempts, setRetryAttempts] = useState(settings?.retryAttempts ?? 3);
  const [retryDelay, setRetryDelay] = useState(settings?.retryDelay ?? 1000);
  const [customEndpoint, setCustomEndpoint] = useState(settings?.customEndpoint ?? '');

  useEffect(() => {
    if (settings) {
      setDebugMode(settings.debugMode ?? false);
      setCustomCSS(settings.customCSS ?? '');
      setRetryAttempts(settings.retryAttempts ?? 3);
      setRetryDelay(settings.retryDelay ?? 1000);
      setCustomEndpoint(settings.customEndpoint ?? '');
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

  const handleDebugModeChange = async (e) => {
    const value = e.target.checked;
    setDebugMode(value);
    
    try {
      // Update setting in storage
      await updateSetting('debugMode', value);
      
      // Send message to all x.com tabs
      const tabs = await chrome.tabs.query({ url: '*://*.x.com/*' });
      
      // Update each tab
      const updatePromises = tabs.map(tab => 
        chrome.tabs.sendMessage(tab.id, {
          type: 'SETTING_UPDATED',
          payload: {
            key: 'debugMode',
            value,
            notify: settings?.notificationsEnabled
          }
        }).catch(() => {
          // Ignore errors for inactive tabs
        })
      );

      await Promise.allSettled(updatePromises);
    } catch (error) {
      console.error('Error updating debug mode:', error);
    }
  };

  const handleCustomCSSChange = (e) => {
    const value = e.target.value;
    setCustomCSS(value);
    handleSettingChange('customCSS', value);
  };

  const handleRetryAttemptsChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0) {
      setRetryAttempts(value);
      handleSettingChange('retryAttempts', value);
    }
  };

  const handleRetryDelayChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0) {
      setRetryDelay(value);
      handleSettingChange('retryDelay', value);
    }
  };

  const handleCustomEndpointChange = (e) => {
    const value = e.target.value;
    setCustomEndpoint(value);
    handleSettingChange('customEndpoint', value);
  };

  const handleClearData = async () => {
    if (window.confirm("Are you sure you want to clear all extension data? This cannot be undone.")) {
      try {
        await chrome.storage.local.clear();
        await chrome.storage.sync.clear();
        if (window.showNotification) {
          window.showNotification('All data cleared successfully', 'success');
        }
        window.location.reload();
      } catch (error) {
        console.error('Error clearing data:', error);
        if (window.showNotification) {
          window.showNotification('Error clearing data', 'error');
        }
      }
    }
  };

  if (!settings) {
    return <div className="loading">Loading settings...</div>;
  }

  return (
    <div className="settings-section">
      <h2>Advanced Settings</h2>
      
      <div className="setting-group">
        <label className="setting-label">
          <span>Debug Mode</span>
          <input
            type="checkbox"
            checked={debugMode}
            onChange={handleDebugModeChange}
          />
        </label>
        <p className="setting-description">
          Enable detailed logging for troubleshooting
        </p>
      </div>

      {/* <div className="setting-group">
        <label className="setting-label">
          <span>Custom CSS (Coming soon)</span>
        </label>
        <textarea
          className="setting-textarea"
          value={customCSS}
          onChange={handleCustomCSSChange}
          placeholder="Enter custom CSS rules..."
          rows={4}
          disabled={true}
        />
        <p className="setting-description">
          Add custom CSS to modify the extension&apos;s appearance
        </p>
      </div> */}

      {/* <div className="setting-group">
        <label className="setting-label">
          <span>Retry Attempts (Coming soon)</span>
          <input
            type="number"
            min="0"
            max="10"
            value={retryAttempts}
            onChange={handleRetryAttemptsChange}
            disabled={true}
          />
        </label>
        <p className="setting-description">
          Number of times to retry failed operations (0-10)
        </p>
      </div> */}

      {/* <div className="setting-group">
        <label className="setting-label">
          <span>Retry Delay (ms) (Coming soon)</span>
          <input
            type="number"
            min="0"
            max="5000"
            value={retryDelay}
            onChange={handleRetryDelayChange}
            disabled={true}
          />
        </label>
        <p className="setting-description">
          Delay between retry attempts (0-5000 milliseconds)
        </p>
      </div> */}

      {/* <div className="setting-group">
        <label className="setting-label">
          <span>Custom API Endpoint (Coming soon)</span>
        </label>
        <input
          type="text"
          disabled={true}
          className="setting-input"
          value={customEndpoint}
          onChange={handleCustomEndpointChange}
          placeholder="https://api.example.com/v1"
        />
        <p className="setting-description">
          Override the default API endpoint (advanced users only)
        </p>
      </div> */}

      {/* <div className="setting-group danger-zone">
        <h3>Danger Zone</h3>
        <button 
          className="action-button danger"
          onClick={handleClearData}
        >
          Clear All Data
        </button>
        <p className="setting-description">
          Delete all saved tweets and reset extension settings
        </p>
      </div> */}
    </div>
  );
};

export default AdvancedSettings;