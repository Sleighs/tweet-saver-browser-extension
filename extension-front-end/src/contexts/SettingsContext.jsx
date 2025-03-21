/* global chrome */
import React, { createContext, useContext, useState, useEffect } from 'react';
import SettingsService from '../services/SettingsService';
import Notification from '../components/Notification/Notification';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [notification, setNotification] = useState(null);

  const showNotification = (message) => {
    setNotification(message);
  };

  const hideNotification = () => {
    setNotification(null);
  };

  const loadSettings = async () => {
    try {
      const loadedSettings = await SettingsService.getSettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const updatedSettings = await SettingsService.updateSettings(newSettings);
      setSettings(updatedSettings);
      
      // Show notification for successful update
      const changedSettings = Object.keys(newSettings).filter(key => 
        settings[key] !== newSettings[key]
      );
      
      if (changedSettings.length > 0) {
        const settingNames = {
          saveIconStyle: 'Icon style',
          showStorageIndicator: 'Storage indicator',
          debugMode: 'Debug mode',
          browserStorageType: 'Storage type'
        };
        
        const message = changedSettings
          .map(key => settingNames[key] || key)
          .join(', ');
          
        showNotification(`${message} updated successfully`);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      showNotification('Failed to update settings');
    }
  };

  useEffect(() => {
    loadSettings();

    // Listen for storage changes
    const handleStorageChange = (changes, areaName) => {
      try {
        if (changes.settings) {
          const newSettings = changes.settings.newValue;
          const oldSettings = changes.settings.oldValue;
          
          // Only update if the new settings are more recent
          if (!oldSettings || (newSettings.lastSaved > oldSettings.lastSaved)) {
            setSettings(newSettings);
          }
        }
      } catch (error) {
        console.error('Error handling storage change:', error);
      }
    };

    if (chrome.storage) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    } else {
      console.error('Chrome storage is not available.');
    }

    return () => {
      if (chrome.storage) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
    };
  }, []);

  const value = {
    settings,
    updateSettings,
    showNotification
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