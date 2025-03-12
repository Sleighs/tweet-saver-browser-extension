/* global chrome */

const defaultSettings = {
  enableExtension: true,
  saveLastTweetEnabled: true,
  browserStorageType: 'local',
  debugMode: true,
  enablePhotoUrlSave: true,
  styleTheme: 'dark',
  showNotifications: true,
  notificationDuration: 3000
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

      const result = await chrome.storage.sync.get('options');
      return result.options || defaultSettings;
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
      const currentSettings = await this.getSettings();
      const newSettings = {
        ...currentSettings,
        [key]: value
      };

      return await this.updateSettings(newSettings);
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
      if (namespace === 'sync' && changes.options) {
        callback(changes.options.newValue);
      }
    });
  }
}

export default SettingsService;