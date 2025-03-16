import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './OptionsPanel.css';

const AppearanceSettings = ({ settings, onSettingChange }) => {
  const [isDarkMode, setIsDarkMode] = useState(settings.darkMode ?? false);
  const [fontSize, setFontSize] = useState(settings.fontSize ?? 'medium');
  const [compactMode, setCompactMode] = useState(settings.compactMode ?? false);
  const [saveIconStyle, setSaveIconStyle] = useState(settings.saveIconStyle ?? 'plus');
  const [saveIconPosition, setSaveIconPosition] = useState(settings.saveIconPosition ?? 'bottom');

  useEffect(() => {
    setIsDarkMode(settings.darkMode ?? false);
    setFontSize(settings.fontSize ?? 'medium');
    setCompactMode(settings.compactMode ?? false);
    setSaveIconStyle(settings.saveIconStyle ?? 'plus');
    setSaveIconPosition(settings.saveIconPosition ?? 'bottom');
  }, [settings]);

  const handleDarkModeChange = (e) => {
    const value = e.target.checked;
    setIsDarkMode(value);
    onSettingChange('darkMode', value);
  };

  const handleFontSizeChange = (e) => {
    const value = e.target.value;
    setFontSize(value);
    onSettingChange('fontSize', value);
  };

  const handleCompactModeChange = (e) => {
    const value = e.target.checked;
    setCompactMode(value);
    onSettingChange('compactMode', value);
  };

  const handleSaveIconStyleChange = (e) => {
    const value = e.target.value;
    setSaveIconStyle(value);
    onSettingChange('saveIconStyle', value);
  };

  const handleSaveIconPositionChange = (e) => {
    const value = e.target.value;
    setSaveIconPosition(value);
    onSettingChange('saveIconPosition', value);
  };

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
            <option value="plus">Plus Sign</option>
            {/* <option value="heart">Heart</option> */}
            <option value="star">Star</option>
            <option value="cloud">Cloud</option>
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
    </div>
  );
};

AppearanceSettings.propTypes = {
  settings: PropTypes.shape({
    darkMode: PropTypes.bool,
    fontSize: PropTypes.string,
    compactMode: PropTypes.bool,
    saveIconStyle: PropTypes.string,
    saveIconPosition: PropTypes.string
  }).isRequired,
  onSettingChange: PropTypes.func.isRequired
};

export default AppearanceSettings; 