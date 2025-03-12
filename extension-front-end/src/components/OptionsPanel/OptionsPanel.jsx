import { useState, useEffect } from 'react';
import './OptionsPanel.css';
import SettingsService from '../../services/SettingsService';

// Tab components
import GeneralSettings from './GeneralSettings';
import AppearanceSettings from './AppearanceSettings';
import StorageSettings from './StorageSettings';
import AdvancedSettings from './AdvancedSettings';

const TABS = [
  {
    id: 'general',
    label: 'General',
    icon: '⚙️',
    component: GeneralSettings
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: '🎨',
    component: AppearanceSettings
  },
  {
    id: 'storage',
    label: 'Storage',
    icon: '💾',
    component: StorageSettings
  },
  {
    id: 'advanced',
    label: 'Advanced',
    icon: '🔧',
    component: AdvancedSettings
  }
];

const OptionsPanel = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isDirty, setIsDirty] = useState(false);
  const [settings, setSettings] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    // Load initial settings
    const loadSettings = async () => {
      const currentSettings = await SettingsService.getSettings();
      setSettings(currentSettings);
    };

    loadSettings();

    // Listen for settings changes from other sources
    SettingsService.onSettingsChanged((newSettings) => {
      setSettings(newSettings);
      setIsDirty(false);
    });
  }, []);

  const handleSettingChange = async (key, value) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [key]: value
    }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      await SettingsService.updateSettings(settings);
      setIsDirty(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const ActiveComponent = TABS.find(tab => tab.id === activeTab)?.component;

  if (!settings) {
    return <div className="options-panel">Loading settings...</div>;
  }

  return (
    <div className="options-panel">
      <header className="options-header">
        <h1>Tweet Saver Settings</h1>
        {isDirty && (
          <button 
            className={`save-button ${isSaving ? 'saving' : ''}`}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </header>

      {saveError && (
        <div className="error-message">
          {saveError}
        </div>
      )}

      <nav className="options-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="options-content">
        {ActiveComponent && (
          <ActiveComponent 
            settings={settings}
            onSettingChange={handleSettingChange}
          />
        )}
      </main>

      <footer className="options-footer">
        <div className="version">Version 1.0.0</div>
        <a 
          href="https://github.com/Sleighs/tweet-saver-browser-extension" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </footer>
    </div>
  );
};

export default OptionsPanel;