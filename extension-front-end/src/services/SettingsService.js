/* global chrome */

const defaultSettings = {
  enableExtension: true,
  saveLastTweetEnabled: true,
  browserStorageType: 'local',
  debugMode: true,
  enablePhotoUrlSave: true,
  styleTheme: 'dark',
  notificationsEnabled: true,
  notificationDuration: 3000,
  autoSave: false,
  saveDelay: 500,
  saveOnlyMedia: false,
  saveTweetMetadata: true,
  saveIconStyle: 'plus',
  saveIconPosition: 'bottom',
  darkMode: false,
  fontSize: 'medium',
  compactMode: false,
  storageType: 'local'
};

// Mock storage for development
const mockStorage = {
  settings: { ...defaultSettings }
};

class SettingsService {
  static isDevelopment() {
    return !chrome?.storage?.local;
  }

  static async getSettings() {
    console.log('SettingsService.getSettings called');
    try {
      if (this.isDevelopment()) {
        console.log('Using mock storage:', mockStorage.settings);
        return mockStorage.settings;
      }

      const result = await chrome.storage.local.get('settings');
      console.log('Settings from chrome storage:', result);
      return result.settings || defaultSettings;
    } catch (error) {
      console.error('Error getting settings:', error);
      return defaultSettings;
    }
  }

  static async updateSettings(newSettings) {
    try {
      // Use mock storage in development
      if (this.isDevelopment()) {
        mockStorage.settings = {
          ...mockStorage.settings,
          ...newSettings
        };
        return mockStorage.settings;
      }

      // Merge with existing settings to ensure we don't lose any values
      const currentSettings = await this.getSettings();
      const mergedSettings = {
        ...currentSettings,
        ...newSettings
      };

      // Save each setting individually at the top level
      for (const key in newSettings) {
        await chrome.storage.local.set({ [key]: newSettings[key] });
      }

      // Also keep the options object for backwards compatibility
      await chrome.storage.local.set({ options: mergedSettings });

      // Notify the extension that settings have changed
      if (chrome?.runtime?.sendMessage) {
        await chrome.runtime.sendMessage({
          type: 'SETTINGS_UPDATED',
          payload: mergedSettings
        });
      }

      return mergedSettings;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  static async updateSetting(key, value) {
    try {
      // Save the individual setting at the top level
      await chrome.storage.local.set({ [key]: value });
      
      // Update options object for backwards compatibility
      const currentSettings = await this.getSettings();
      const newSettings = {
        ...currentSettings,
        [key]: value
      };
      await chrome.storage.local.set({ options: newSettings });

      // Notify the extension that settings have changed
      if (chrome?.runtime?.sendMessage) {
        await chrome.runtime.sendMessage({
          type: 'SETTINGS_UPDATED',
          payload: newSettings
        });
      }

      return newSettings;
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  }

  static onSettingsChanged(callback) {
    if (!this.isDevelopment() && chrome?.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local') {
          callback(changes);
        }
      });
    }
  }
}

export default SettingsService;