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
  storageType: 'local',
  showStorageIndicator: false,
  lastSaved: 0
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
    try {
      if (this.isDevelopment()) {
        return mockStorage.settings;
      }

      // Get settings from both storages
      const [localSettings, syncSettings] = await Promise.all([
        chrome.storage.local.get('settings'),
        chrome.storage.sync.get('settings')
      ]);

      // Get the settings with the most recent lastSaved timestamp
      const local = localSettings.settings || { lastSaved: 0 };
      const sync = syncSettings.settings || { lastSaved: 0 };

      // Use the most recently saved settings
      const mostRecent = (local.lastSaved || 0) > (sync.lastSaved || 0) ? local : sync;

      // Merge with defaults
      const mergedSettings = {
        ...defaultSettings,
        ...mostRecent
      };

      return mergedSettings;
    } catch (error) {
      console.error('Error getting settings:', error);
      // Return default settings if there's an error
      return defaultSettings;
    }
  }

  static async updateSettings(newSettings) {
    try {
      if (this.isDevelopment()) {
        mockStorage.settings = {
          ...mockStorage.settings,
          ...newSettings,
          lastSaved: Date.now()
        };
        return mockStorage.settings;
      }

      // Add lastSaved timestamp
      const settingsWithTimestamp = {
        ...newSettings,
        lastSaved: Date.now()
      };

      // Save to both storages
      await Promise.all([
        chrome.storage.local.set({ settings: settingsWithTimestamp }),
        chrome.storage.sync.set({ settings: settingsWithTimestamp })
      ]);

      // Notify content script of settings change
      if (chrome?.tabs && chrome.runtime?.id) {
        const tabs = await chrome.tabs.query({ url: ['*://*.twitter.com/*', '*://*.x.com/*'] });
        for (const tab of tabs) {
          try {
            await chrome.tabs.sendMessage(tab.id, {
              type: 'SETTINGS_UPDATED',
              payload: settingsWithTimestamp
            });
          } catch (error) {
            console.warn('Could not update content script in tab:', tab.id, error);
          }
        }
      }

      return settingsWithTimestamp;
    } catch (error) {
      console.error('Error updating settings:', error);
      // If we can't save to sync storage, try local storage as fallback
      try {
        await chrome.storage.local.set({ settings: settingsWithTimestamp });
        return settingsWithTimestamp;
      } catch (localError) {
        console.error('Error saving to local storage:', localError);
        throw error;
      }
    }
  }

  static async updateSetting(key, value) {
    const currentSettings = await this.getSettings();
    return this.updateSettings({
      ...currentSettings,
      [key]: value
    });
  }

  static onSettingsChanged(callback) {
    if (!this.isDevelopment() && chrome?.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (changes.settings) {
          callback(changes.settings.newValue);
        }
      });
    }
  }
}

export default SettingsService;