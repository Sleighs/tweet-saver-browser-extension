import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './OptionsPanel.css';

const AppearanceSettings = ({ settings, onSettingChange }) => {
  const [isDarkMode, setIsDarkMode] = useState(settings.darkMode ?? false);
  const [fontSize, setFontSize] = useState(settings.fontSize ?? 'medium');
  const [compactMode, setCompactMode] = useState(settings.compactMode ?? false);

  useEffect(() => {
    setIsDarkMode(settings.darkMode ?? false);
    setFontSize(settings.fontSize ?? 'medium');
    setCompactMode(settings.compactMode ?? false);
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

  return (
    <div className="settings-section">
      <h2>Appearance Settings</h2>
      
      <div className="setting-group">
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
      </div>

      <div className="setting-group">
        <label className="setting-label">
          <span>Font Size</span>
          <select value={fontSize} onChange={handleFontSizeChange}>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </label>
        <p className="setting-description">
          Adjust the text size throughout the application
        </p>
      </div>

      <div className="setting-group">
        <label className="setting-label">
          <span>Compact Mode</span>
          <input
            type="checkbox"
            checked={compactMode}
            onChange={handleCompactModeChange}
          />
        </label>
        <p className="setting-description">
          Show more tweets at once by reducing padding and spacing
        </p>
      </div>
    </div>
  );
};

AppearanceSettings.propTypes = {
  settings: PropTypes.shape({
    darkMode: PropTypes.bool,
    fontSize: PropTypes.string,
    compactMode: PropTypes.bool
  }).isRequired,
  onSettingChange: PropTypes.func.isRequired
};

export default AppearanceSettings; 