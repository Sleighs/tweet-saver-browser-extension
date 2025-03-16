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
  compactMode: false
};

// Mock storage for development
const mockStorage = {
  settings: { ...defaultSettings }
};

class SettingsService {
  static isDevelopment() {
    return !chrome?.storage?.sync;
  }

  static async getSettings() {
    try {
      // Use mock storage in development
      if (this.isDevelopment()) {
        return mockStorage.settings;
      }

      // Get all settings from Chrome storage
      const result = await chrome.storage.sync.get(null);
      
      // Start with default settings
      const settings = { ...defaultSettings };
      
      // Override with any settings from storage
      for (const key in defaultSettings) {
        if (result[key] !== undefined) {
          settings[key] = result[key];
        }
      }
      
      // For backwards compatibility, check for settings in the options object
      if (result.options) {
        for (const key in result.options) {
          if (settings[key] === undefined || settings[key] === defaultSettings[key]) {
            settings[key] = result.options[key];
          }
        }
      }
      
      return settings;
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
        await chrome.storage.sync.set({ [key]: newSettings[key] });
      }

      // Also keep the options object for backwards compatibility
      await chrome.storage.sync.set({ options: mergedSettings });

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
      await chrome.storage.sync.set({ [key]: value });
      
      // Update options object for backwards compatibility
      const currentSettings = await this.getSettings();
      const newSettings = {
        ...currentSettings,
        [key]: value
      };
      
      // Also update the options object
      await chrome.storage.sync.set({ options: newSettings });

      // Notify the extension that settings have changed
      if (chrome?.runtime?.sendMessage) {
        await chrome.runtime.sendMessage({
          type: 'SETTINGS_UPDATED',
          payload: newSettings
        });
      }

      return newSettings;
    } catch (error) {
      console.error(`Error updating setting ${key}:`, error);
      throw error;
    }
  }

  static onSettingsChanged(callback) {
    if (this.isDevelopment()) {
      // No need for change listener in development
      return;
    }

    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        // If individual settings changed, get the full settings object and notify
        if (changes.options || Object.keys(changes).some(key => key in defaultSettings)) {
          this.getSettings().then(settings => callback(settings));
        }
      }
    });
  }
}

export default SettingsService;