/* global chrome */
import { useState, useEffect } from 'react';
import './OptionsPanel.css';
import SettingsService from '../../services/SettingsService';
import GeneralSettings from './GeneralSettings';
import AdvancedSettings from './AdvancedSettings';

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
    customEndpoint: ''
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
      <header className="options-header">
        <h1>
          <span className="tab-icon">⚙️</span>
          Tweet Saver Settings
        </h1>
        <div className="header-actions">
          <button className="open-in-tab-button" onClick={handleOpenInTab}>
            <span className="tab-icon">🔗</span>
            Open in Tab
          </button>
        </div>
      </header>

      <nav className="options-tabs">
        <button
          className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <span className="tab-icon">⚙️</span>
          General
        </button>
        <button
          className={`tab-button ${activeTab === 'advanced' ? 'active' : ''}`}
          onClick={() => setActiveTab('advanced')}
        >
          <span className="tab-icon">🔧</span>
          Advanced
        </button>
      </nav>

      <main className="options-content">
        {activeTab === 'general' ? (
          <GeneralSettings settings={settings} onSettingChange={handleSettingChange} />
        ) : (
          <AdvancedSettings settings={settings} onSettingChange={handleSettingChange} />
        )}
      </main>
    </div>
  );
};

export default OptionsPanel;