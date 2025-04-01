/* global chrome */
import React, { createContext, useContext, useState, useEffect } from 'react';
import SettingsService from '../services/SettingsService';
import Notification from '../components/Notification/Notification';

// Add default settings
const DEFAULT_SETTINGS = {
  extensionInstalled: false,
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
  showStorageIndicator: false,
  lastSaved: Date.now(),

  maxTweets: 1000,
  autoCleanup: false,
  cleanupThreshold: 900,
  backupEnabled: false,
  backupFrequency: 'weekly',

  // Advanced settings
  customCSS: '',
  retryAttempts: 3,
  retryDelay: 1000,
  customEndpoint: '',
  storageType: 'local'
};

// Storage keys constant
const STORAGE_KEYS = {
  SETTINGS: 'settings'
};

// Update the storage object with better error handling and type checking
const storage = {
  get: async () => {
    try {
      if (!chrome?.storage) {
        throw new Error('Chrome storage not available');
      }

      return new Promise((resolve) => {
        chrome.storage.local.get(STORAGE_KEYS.SETTINGS, (result) => {
          try {
            // If result.settings is already an object, return it
            if (result.settings && typeof result.settings === 'object') {
              resolve(result.settings);
              return;
            }
            
            // If it's a string, try to parse it
            if (typeof result.settings === 'string') {
              resolve(JSON.parse(result.settings));
              return;
            }

            // If nothing found or invalid, return defaults
            resolve(DEFAULT_SETTINGS);
          } catch (parseError) {
            console.error('Error parsing settings:', parseError);
            resolve(DEFAULT_SETTINGS);
          }
        });
      });
    } catch (error) {
      console.error('Error accessing storage:', error);
      return DEFAULT_SETTINGS;
    }
  },

  set: async (settings) => {
    try {
      if (!chrome?.storage) {
        throw new Error('Chrome storage not available');
      }

      // Ensure we're storing an object, not a string
      const settingsToStore = typeof settings === 'string' ? JSON.parse(settings) : settings;

      return new Promise((resolve) => {
        chrome.storage.local.set({ 
          [STORAGE_KEYS.SETTINGS]: settingsToStore 
        }, () => {
          if (chrome.runtime.lastError) {
            console.error('Error saving settings:', chrome.runtime.lastError);
            throw chrome.runtime.lastError;
          }
          resolve();
        });
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  },

  clear: async () => {
    try {
      if (!chrome?.storage) {
        throw new Error('Chrome storage not available');
      }

      return new Promise((resolve) => {
        chrome.storage.local.remove(STORAGE_KEYS.SETTINGS, () => {
          if (chrome.runtime.lastError) {
            console.error('Error clearing settings:', chrome.runtime.lastError);
            throw chrome.runtime.lastError;
          }
          resolve();
        });
      });
    } catch (error) {
      console.error('Error clearing settings:', error);
      throw error;
    }
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
      const updatedSettings = { 
        ...newSettings, 
        lastSaved: Date.now() 
      };
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
            const newValue = changes.settings.newValue;
            const oldValue = changes.settings.oldValue;

            // Handle both string and object formats
            const newSettings = typeof newValue === 'string' ? JSON.parse(newValue) : newValue;
            const oldSettings = oldValue ? (typeof oldValue === 'string' ? JSON.parse(oldValue) : oldValue) : null;

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