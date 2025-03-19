/* global chrome */
import { useState, useEffect } from 'react';
import './OptionsPanel.css';
import SettingsService from '../../services/SettingsService';
import GeneralSettings from './GeneralSettings';
import AdvancedSettings from './AdvancedSettings';
import AppearanceSettings from './AppearanceSettings';
import StorageSettings from './StorageSettings';

const OptionsPanel = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    autoSave: false,
    saveDelay: 500,
    notificationsEnabled: true,
    saveOnlyMedia: false,
    saveTweetMetadata: true,
    debugMode: false,
    customCSS: '',
    retryAttempts: 3,
    retryDelay: 1000,
    customEndpoint: '',
    darkMode: false,
    fontSize: 'medium',
    compactMode: false,
    saveIconStyle: 'plus',
    saveIconPosition: 'bottom',
    maxTweets: 1000,
    autoCleanup: false,
    cleanupThreshold: 900,
    backupEnabled: false,
    backupFrequency: 'weekly',
    storageType: 'local'
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await SettingsService.getSettings();
      setSettings(prevSettings => ({
        ...prevSettings,
        ...savedSettings
      }));
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSettingChange = async (key, value) => {
    try {
      const updatedSettings = { ...settings, [key]: value };
      setSettings(updatedSettings);
      await SettingsService.updateSettings(updatedSettings);
      
      // Notify content script about settings update
      if (chrome.runtime?.id) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'SETTINGS_UPDATED' });
          }
        });
      }
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };

  const handleOpenInTab = () => {
    if (chrome.runtime?.id) {
      chrome.tabs.create({
        url: chrome.runtime.getURL('index.html')
      });
    }
  };

  return (
    <div className="options-panel">
      <nav className="options-tabs">
        <button
          className={`options-tab-button ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <span className="tab-icon">⚙️</span>
          General
        </button>
        <button
          className={`options-tab-button ${activeTab === 'storage' ? 'active' : ''}`}
          onClick={() => setActiveTab('storage')}
        >
          <span className="tab-icon">💾</span>
          Storage
        </button>
        <button
          className={`options-tab-button ${activeTab === 'appearance' ? 'active' : ''}`}
          onClick={() => setActiveTab('appearance')}
        >
          <span className="tab-icon">🎨</span>
          Appearance
        </button>
        <button
          className={`options-tab-button ${activeTab === 'advanced' ? 'active' : ''}`}
          onClick={() => setActiveTab('advanced')}
        >
          <span className="tab-icon">🔧</span>
          Advanced
        </button>
      </nav>

      <main className="options-content">
        {activeTab === 'general' && (
          <GeneralSettings settings={settings} onSettingChange={handleSettingChange} />
        )}
        {activeTab === 'storage' && (
          <StorageSettings settings={settings} onSettingChange={handleSettingChange} />
        )}
        {activeTab === 'appearance' && (
          <AppearanceSettings settings={settings} onSettingChange={handleSettingChange} />
        )}
        {activeTab === 'advanced' && (
          <AdvancedSettings settings={settings} onSettingChange={handleSettingChange} />
        )}
      </main>
    </div>
  );
};

export default OptionsPanel;