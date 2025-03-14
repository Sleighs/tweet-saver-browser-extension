import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './OptionsPanel.css';

const GeneralSettings = ({ settings, onSettingChange }) => {
  const [autoSave, setAutoSave] = useState(settings.autoSave ?? true);
  const [saveDelay, setSaveDelay] = useState(settings.saveDelay ?? 500);
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled ?? true);
  const [saveOnlyMedia, setSaveOnlyMedia] = useState(settings.saveOnlyMedia ?? false);
  const [saveTweetMetadata, setSaveTweetMetadata] = useState(settings.saveTweetMetadata ?? true);

  useEffect(() => {
    setAutoSave(settings.autoSave ?? true);
    setSaveDelay(settings.saveDelay ?? 500);
    setNotificationsEnabled(settings.notificationsEnabled ?? true);
    setSaveOnlyMedia(settings.saveOnlyMedia ?? false);
    setSaveTweetMetadata(settings.saveTweetMetadata ?? true);
  }, [settings]);

  const handleAutoSaveChange = (e) => {
    const value = e.target.checked;
    setAutoSave(value);
    onSettingChange('autoSave', value);
  };

  const handleSaveDelayChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0) {
      setSaveDelay(value);
      onSettingChange('saveDelay', value);
    }
  };

  const handleNotificationsChange = (e) => {
    const value = e.target.checked;
    setNotificationsEnabled(value);
    onSettingChange('notificationsEnabled', value);
  };

  const handleSaveOnlyMediaChange = (e) => {
    const value = e.target.checked;
    setSaveOnlyMedia(value);
    onSettingChange('saveOnlyMedia', value);
  };

  const handleSaveMetadataChange = (e) => {
    const value = e.target.checked;
    setSaveTweetMetadata(value);
    onSettingChange('saveTweetMetadata', value);
  };

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

GeneralSettings.propTypes = {
  settings: PropTypes.shape({
    autoSave: PropTypes.bool,
    saveDelay: PropTypes.number,
    notificationsEnabled: PropTypes.bool,
    saveOnlyMedia: PropTypes.bool,
    saveTweetMetadata: PropTypes.bool
  }).isRequired,
  onSettingChange: PropTypes.func.isRequired
};

export default GeneralSettings;