import { useState, useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import './OptionsPanel.css';

const GeneralSettings = () => {
  const { settings, updateSetting } = useSettings();
  // Existing state
  const [autoSave, setAutoSave] = useState(settings?.autoSave ?? true);
  const [saveDelay, setSaveDelay] = useState(settings?.saveDelay ?? 500);
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings?.notificationsEnabled ?? true);
  const [saveOnlyMedia, setSaveOnlyMedia] = useState(settings?.saveOnlyMedia ?? false);
  const [saveTweetMetadata, setSaveTweetMetadata] = useState(settings?.saveTweetMetadata ?? true);
  
  // Add appearance state
  const [saveIconStyle, setSaveIconStyle] = useState(settings?.saveIconStyle ?? 'cloud');
  const [saveIconPosition, setSaveIconPosition] = useState(settings?.saveIconPosition ?? 'bottom');
  const [showStorageIndicator, setShowStorageIndicator] = useState(settings?.showStorageIndicator ?? true);

  useEffect(() => {
    if (settings) {
      // Existing settings
      setAutoSave(settings.autoSave ?? true);
      setSaveDelay(settings.saveDelay ?? 500);
      setNotificationsEnabled(settings.notificationsEnabled ?? true);
      setSaveOnlyMedia(settings.saveOnlyMedia ?? false);
      setSaveTweetMetadata(settings.saveTweetMetadata ?? true);
      
      // Appearance settings
      setSaveIconStyle(settings.saveIconStyle ?? 'cloud');
      setSaveIconPosition(settings.saveIconPosition ?? 'bottom');
      setShowStorageIndicator(settings.showStorageIndicator ?? true);
    }
  }, [settings]);

  const handleSettingChange = async (key, value) => {
    if (!key) return;
    
    try {
      await updateSetting(key, value);
      
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];
      
      if (activeTab?.url?.includes('x.com')) {
        chrome.tabs.sendMessage(activeTab.id, {
          type: 'SETTING_UPDATED',
          payload: {
            key,
            value,
            notify: settings?.notificationsEnabled ?? true
          }
        }).catch(() => {
          // Ignore errors for inactive tabs
        });
      }

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

  const handleAutoSaveChange = (e) => {
    const value = e.target.checked;
    setAutoSave(value);
    handleSettingChange('autoSave', value);
  };

  const handleSaveDelayChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0) {
      setSaveDelay(value);
      handleSettingChange('saveDelay', value);
    }
  };

  const handleNotificationsChange = (e) => {
    const value = e.target.checked;
    setNotificationsEnabled(value);
    handleSettingChange('notificationsEnabled', value);
  };

  const handleSaveOnlyMediaChange = (e) => {
    const value = e.target.checked;
    setSaveOnlyMedia(value);
    handleSettingChange('saveOnlyMedia', value);
  };

  const handleSaveMetadataChange = (e) => {
    const value = e.target.checked;
    setSaveTweetMetadata(value);
    handleSettingChange('saveTweetMetadata', value);
  };

  // Add appearance handlers
  const handleSaveIconStyleChange = (e) => {
    const value = e.target.value;
    setSaveIconStyle(value);
    handleSettingChange('saveIconStyle', value);
  };

  const handleSaveIconPositionChange = (e) => {
    const value = e.target.value;
    setSaveIconPosition(value);
    handleSettingChange('saveIconPosition', value);
  };

  const handleShowStorageIndicatorChange = (e) => {
    const value = e.target.checked;
    setShowStorageIndicator(value);
    handleSettingChange('showStorageIndicator', value);
  };

  if (!settings) {
    return <div className="loading">Loading settings...</div>;
  }

  return (
    <div className="settings-section">
      <h2>General Settings</h2>

      {/* <h3>General</h3> */}
      {/* Existing general settings */}
      <div className="setting-group">
        <label className="setting-label">
          <span>Show Notifications</span>
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={handleNotificationsChange}
          />
        </label>
        <p className="setting-description">
          Display notifications when tweets are saved
        </p>
      </div>

      {/* <div className="setting-group">
        <label className="setting-label">
          <span>Save Only Media Tweets</span>
          <input
            type="checkbox"
            checked={saveOnlyMedia}
            onChange={handleSaveOnlyMediaChange}
          />
        </label>
        <p className="setting-description">
          Only save auotsave tweets that contain images or videos
        </p>
      </div> */}

      <div className="setting-group">
        <label className="setting-label">
          <span>Autosave Clicked Tweets</span>
          <input
            type="checkbox"
            checked={autoSave}
            onChange={handleAutoSaveChange}
          />
        </label>
        <p className="setting-description">
          Automatically save tweets when you click to view them
        </p>
      </div>

      {autoSave && (
        <div className="setting-group">
          <label className="setting-label">
            <span>Save Delay (ms)</span>
            <input
              type="number"
              min="0"
              max="5000"
              value={saveDelay}
              onChange={handleSaveDelayChange}
            />
          </label>
          <p className="setting-description">
            Delay before auto-saving (0-5000 milliseconds)
          </p>
        </div>
      )}

      <h2>Appearance</h2>
      {/* Add appearance settings */}
      <div className="setting-group">
        <label className="setting-label">
          <span>Save Icon Style</span>
          <select value={saveIconStyle} onChange={handleSaveIconStyleChange}>
            <option value="cloud">Cloud</option>
            <option value="star">Star</option>
            <option value="plus">Plus Sign</option>
          </select>
        </label>
        <p className="setting-description">
          Choose the style of the save button icon
        </p>
      </div>

      <div className="setting-group">
        <label className="setting-label">
          <span>Save Icon Position</span>
          <select value={saveIconPosition} onChange={handleSaveIconPositionChange}>
            <option value="bottom">Bottom (Next to Bookmark)</option>
            <option value="top" disabled={true}>Top (Near Post Options)</option>
          </select>
        </label>
        <p className="setting-description">
          Choose where the save button appears on posts
        </p>
      </div>

      <div className="setting-group">
        <label className="setting-label">
          <span>Show Storage Location of Posts</span>
          <input
            type="checkbox"
            checked={showStorageIndicator}
            onChange={handleShowStorageIndicatorChange}
          />
        </label>
        <p className="setting-description">
          Show storage location indicator on saved posts local or online/sync
        </p>
      </div>
    </div>
  );
};

export default GeneralSettings;