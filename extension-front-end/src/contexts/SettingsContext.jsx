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
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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
      // First update local state for immediate UI feedback
      setSettings({ ...settings, ...newSettings });

      // Then persist to storage using service
      const updatedSettings = await SettingsService.updateSettings(newSettings);
      return updatedSettings;
    } catch (error) {
      // Revert local state if storage update failed
      setSettings(settings);
      console.error('Failed to update settings:', error);
      throw error;
    }
  };

  const updateSetting = async (key, value) => {
    try {
      // First update local state for immediate UI feedback
      setSettings({ ...settings, [key]: value });

      // Then persist to storage using service
      const updatedSettings = await SettingsService.updateSetting(key, value);
      return updatedSettings;
    } catch (error) {
      // Revert local state if storage update failed
      setSettings(settings);
      console.error('Failed to update setting:', error);
      throw error;
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
        setError('Failed to handle storage change');
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