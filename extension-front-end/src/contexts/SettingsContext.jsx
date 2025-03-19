import { createContext, useContext, useState, useEffect } from 'react';
import SettingsService from '../services/SettingsService';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const currentSettings = await SettingsService.getSettings();
        setSettings(currentSettings);
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();

    // Listen for storage changes
    const handleStorageChange = (changes, areaName) => {
      if (areaName === 'local' && changes.settings) {
        setSettings(changes.settings.newValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  const updateSetting = async (key, value) => {
    try {
      const updatedSettings = { ...settings, [key]: value };
      await SettingsService.updateSettings(updatedSettings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  const value = {
    settings,
    isLoading,
    updateSetting
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export default SettingsContext; 