import { useState, useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import './OptionsPanel.css';

const GeneralSettings = () => {
  const { settings, updateSetting } = useSettings();
  const [autoSave, setAutoSave] = useState(settings?.autoSave ?? true);
  const [saveDelay, setSaveDelay] = useState(settings?.saveDelay ?? 500);
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings?.notificationsEnabled ?? true);
  const [saveOnlyMedia, setSaveOnlyMedia] = useState(settings?.saveOnlyMedia ?? false);
  const [saveTweetMetadata, setSaveTweetMetadata] = useState(settings?.saveTweetMetadata ?? true);

  useEffect(() => {
    if (settings) {
      setAutoSave(settings.autoSave ?? true);
      setSaveDelay(settings.saveDelay ?? 500);
      setNotificationsEnabled(settings.notificationsEnabled ?? true);
      setSaveOnlyMedia(settings.saveOnlyMedia ?? false);
      setSaveTweetMetadata(settings.saveTweetMetadata ?? true);
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

  if (!settings) {
    return <div className="loading">Loading settings...</div>;
  }

  return (
    <div className="settings-section">
      <h2>General Settings</h2>

      <div className="setting-group">
        <label className="setting-label">
          <span>Auto-Save Tweets</span>
          <input
            type="checkbox"
            checked={autoSave}
            onChange={handleAutoSaveChange}
          />
        </label>
        <p className="setting-description">
          Automatically save tweets when you click on them to view (separate from the save button)
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

      <div className="setting-group">
        <label className="setting-label">
          <span>Save Only Media Tweets</span>
          <input
            type="checkbox"
            checked={saveOnlyMedia}
            onChange={handleSaveOnlyMediaChange}
          />
        </label>
        <p className="setting-description">
          Only save tweets that contain images or videos
        </p>
      </div>

      <div className="setting-group">
        <label className="setting-label">
          <span>Save Tweet Metadata</span>
          <input
            type="checkbox"
            checked={saveTweetMetadata}
            onChange={handleSaveMetadataChange}
          />
        </label>
        <p className="setting-description">
          Include likes, retweets, and other metadata when saving tweets
        </p>
      </div>
    </div>
  );
};

export default GeneralSettings;