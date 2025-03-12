/**
 * Storage service for Tweet Saver
 * @module services/storage
 */

import { config } from '../config/config';
import { handleError, debugLog } from '../utils/helpers';

class StorageService {
  constructor() {
    this.storage = config.storage.type === 'sync' ? chrome.storage.sync : chrome.storage.local;
    this.urlsKey = config.storage.urlsKey;
    this.tweetsKey = config.storage.tweetsKey;
  }

  /**
   * Get all saved data
   * @async
   * @returns {Promise<{urls: string[], tweets: Object[]}>} The saved data
   */
  async getSavedData() {
    try {
      const result = await this.storage.get([this.urlsKey, this.tweetsKey]);
      return {
        urls: JSON.parse(result[this.urlsKey] || '[]'),
        tweets: JSON.parse(result[this.tweetsKey] || '[]')
      };
    } catch (error) {
      handleError(error, 'getSavedData');
      return { urls: [], tweets: [] };
    }
  }

  /**
   * Save data to storage
   * @async
   * @param {string[]} urls - The URLs to save
   * @param {Object[]} tweets - The tweets to save
   * @returns {Promise<void>}
   */
  async saveData(urls, tweets) {
    try {
      await this.storage.set({
        [this.urlsKey]: JSON.stringify(urls),
        [this.tweetsKey]: JSON.stringify(tweets)
      });
      debugLog('Data saved successfully:', { urls, tweets });
    } catch (error) {
      handleError(error, 'saveData', true);
    }
  }

  /**
   * Clear all saved data
   * @async
   * @returns {Promise<void>}
   */
  async clearData() {
    try {
      await this.storage.clear();
      debugLog('Storage cleared successfully');
    } catch (error) {
      handleError(error, 'clearData', true);
    }
  }

  /**
   * Check if a URL is already saved
   * @async
   * @param {string} url - The URL to check
   * @returns {Promise<boolean>} Whether the URL is saved
   */
  async isUrlSaved(url) {
    try {
      const { urls } = await this.getSavedData();
      return urls.includes(url);
    } catch (error) {
      handleError(error, 'isUrlSaved');
      return false;
    }
  }

  /**
   * Get storage usage statistics
   * @async
   * @returns {Promise<{usage: number, quota: number}>} Storage usage stats
   */
  async getStorageStats() {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const { usage, quota } = await navigator.storage.estimate();
        return { usage, quota };
      } catch (error) {
        handleError(error, 'getStorageStats');
      }
    }
    return { usage: 0, quota: 0 };
  }

  /**
   * Check if storage quota is available
   * @async
   * @returns {Promise<boolean>} Whether storage quota is available
   */
  async hasQuotaAvailable() {
    const { usage, quota } = await this.getStorageStats();
    return usage / quota < config.storage.quotaWarningThreshold;
  }

  /**
   * Add event listener for storage changes
   * @param {Function} callback - The callback to call when storage changes
   * @returns {void}
   */
  onStorageChanged(callback) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === config.storage.type) {
        callback(changes);
      }
    });
  }
}

export default new StorageService(); 