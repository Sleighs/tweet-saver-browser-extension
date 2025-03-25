/* global chrome */
import React, { createContext, useContext, useState, useEffect } from 'react';
import SettingsService from '../services/SettingsService';
import Notification from '../components/Notification/Notification';

// Add default settings
const DEFAULT_SETTINGS = {
  enableExtension: true,
  saveLastTweetEnabled: true,
  browserStorageType: 'local',
  debugMode: false,
  notificationsEnabled: true,
  autoSave: false,
  saveDelay: 500,
  saveOnlyMedia: false,
  saveTweetMetadata: true,
  saveIconStyle: 'cloud',
  saveIconPosition: 'bottom',
  showStorageIndicator: true,
  lastSaved: Date.now(),

  maxTweets: 1000,
  autoCleanup: false,
  cleanupThreshold: 900,
  backupEnabled: false,
  backupFrequency: 'weekly',

  // Missing settings from AdvancedSettings
  customCSS: '',
  retryAttempts: 3,
  retryDelay: 1000,
  customEndpoint: '',
  storageType: 'sync'
};

// Add storage configuration
const STORAGE_CONFIG = {
  key: 'xpostsaver-settings',
  expirationDays: 30
};

// Update the storage object
const storage = {
  get: async () => {
    if (chrome?.storage) {
      return new Promise((resolve) => {
        chrome.storage.local.get('settings', (result) => {
          resolve(result.settings ? JSON.parse(result.settings) : DEFAULT_SETTINGS);
        });
      });
    }

    // Fallback to localStorage with expiration check
    try {
      const item = localStorage.getItem(STORAGE_CONFIG.key);
      if (!item) return DEFAULT_SETTINGS;

      const { value, timestamp } = JSON.parse(item);
      const now = Date.now();
      const expirationMs = STORAGE_CONFIG.expirationDays * 24 * 60 * 60 * 1000;

      // Check if data has expired
      if (now - timestamp > expirationMs) {
        localStorage.removeItem(STORAGE_CONFIG.key);
        return DEFAULT_SETTINGS;
      }

      return value;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return DEFAULT_SETTINGS;
    }
  },

  set: async (settings) => {
    if (chrome?.storage) {
      return chrome.storage.local.set({ settings: JSON.stringify(settings) });
    }

    // Fallback to localStorage with expiration
    try {
      const data = {
        value: settings,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_CONFIG.key, JSON.stringify(data));
      return Promise.resolve();
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      return Promise.reject(error);
    }
  },

  clear: async () => {
    if (chrome?.storage) {
      return chrome.storage.local.remove('settings');
    }
    localStorage.removeItem(STORAGE_CONFIG.key);
    return Promise.resolve();
  }
};

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const showNotification = (message) => {
    setNotification(message);
  };

  const hideNotification = () => {
    setNotification(null);
  };

  const loadSettings = async () => {
    try {
      const loadedSettings = await storage.get();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const updatedSettings = { ...newSettings, lastSaved: Date.now() };
      await storage.set(updatedSettings);
      setSettings(updatedSettings);
      return updatedSettings;
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  };

  const updateSetting = async (key, value) => {
    try {
      const updatedSettings = {
        ...settings,
        [key]: value,
        lastSaved: Date.now()
      };
      await storage.set(updatedSettings);
      setSettings(updatedSettings);
      return updatedSettings;
    } catch (error) {
      console.error('Failed to update setting:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadSettings();

    // Only set up storage listener if chrome.storage is available
    if (chrome?.storage) {
      const handleStorageChange = (changes, areaName) => {
        try {
          if (changes.settings) {
            const newSettings = JSON.parse(changes.settings.newValue);
            const oldSettings = changes.settings.oldValue 
              ? JSON.parse(changes.settings.oldValue)
              : null;
            
            if (!oldSettings || (newSettings.lastSaved > oldSettings.lastSaved)) {
              setSettings(newSettings);
            }
          }
        } catch (error) {
          console.error('Error handling storage change:', error);
          setError('Failed to handle storage change');
        }
      };

      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => chrome.storage.onChanged.removeListener(handleStorageChange);
    }
  }, []);

  const value = {
    settings,
    updateSettings,
    updateSetting,
    isLoading,
    error,
    showNotification,
    hideNotification
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
      {notification && (
        <Notification
          message={notification}
          onClose={hideNotification}
        />
      )}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;