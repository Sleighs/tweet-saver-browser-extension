import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSettings } from '../../contexts/SettingsContext';
import './OptionsPanel.css';

const AppearanceSettings = () => {
  const { settings, updateSetting } = useSettings();
  const [isDarkMode, setIsDarkMode] = useState(settings?.darkMode ?? false);
  const [fontSize, setFontSize] = useState(settings?.fontSize ?? 'medium');
  const [compactMode, setCompactMode] = useState(settings?.compactMode ?? false);
  const [saveIconStyle, setSaveIconStyle] = useState(settings?.saveIconStyle ?? 'star');
  const [saveIconPosition, setSaveIconPosition] = useState(settings?.saveIconPosition ?? 'bottom');
  const [showStorageIndicator, setShowStorageIndicator] = useState(settings?.showStorageIndicator ?? true);

  useEffect(() => {
    if (settings) {
      setIsDarkMode(settings.darkMode ?? false);
      setFontSize(settings.fontSize ?? 'medium');
      setCompactMode(settings.compactMode ?? false);
      setSaveIconStyle(settings.saveIconStyle ?? 'star');
      setSaveIconPosition(settings.saveIconPosition ?? 'bottom');
      setShowStorageIndicator(settings.showStorageIndicator ?? true);
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

  const handleDarkModeChange = (e) => {
    const value = e.target.checked;
    setIsDarkMode(value);
    handleSettingChange('darkMode', value);
  };

  const handleFontSizeChange = (e) => {
    const value = e.target.value;
    setFontSize(value);
    handleSettingChange('fontSize', value);
  };

  const handleCompactModeChange = (e) => {
    const value = e.target.checked;
    setCompactMode(value);
    handleSettingChange('compactMode', value);
  };

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
      <h2>Appearance Settings</h2>
      
      {/* <div className="setting-group">
        <label className="setting-label">
          <span>Dark Mode</span>
          <input
            type="checkbox"
            checked={isDarkMode}
            onChange={handleDarkModeChange}
          />
        </label>
        <p className="setting-description">
          Enable dark mode for a more comfortable viewing experience in low-light conditions
        </p>
      </div> */}

      {/* <div className="setting-group">
        <label className="setting-label">
          <span>Font Size</span>
          <select value={fontSize} onChange={handleFontSizeChange}>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </label>
        <p className="setting-description">
          Adjust the size of text throughout the extension
        </p>
      </div> */}

      {/* <div className="setting-group">
        <label className="setting-label">
          <span>Compact Mode</span>
          <input
            type="checkbox"
            checked={compactMode}
            onChange={handleCompactModeChange}
          />
        </label>
        <p className="setting-description">
          Display tweets in a more compact layout
        </p>
      </div> */}

      <div className="setting-group">
        <label className="setting-label">
          <span>Save Icon Style</span>
          <select value={saveIconStyle} onChange={handleSaveIconStyleChange}>
            <option value="star">Star</option>
            <option value="cloud">Cloud</option>
            <option value="plus">Plus Sign</option>
            {/* <option value="heart">Heart</option> */}
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
          <span>Show Storage Location</span>
          <input
            type="checkbox"
            checked={showStorageIndicator}
            onChange={handleShowStorageIndicatorChange}
          />
        </label>
        <p className="setting-description">
          Show or hide the storage location indicator on saved posts
        </p>
      </div>
    </div>
  );
};

AppearanceSettings.propTypes = {
  settings: PropTypes.shape({
    darkMode: PropTypes.bool,
    fontSize: PropTypes.string,
    compactMode: PropTypes.bool,
    saveIconStyle: PropTypes.string,
    saveIconPosition: PropTypes.string,
    showStorageIndicator: PropTypes.bool
  }).isRequired,
  onSettingChange: PropTypes.func.isRequired
};

export default AppearanceSettings; 