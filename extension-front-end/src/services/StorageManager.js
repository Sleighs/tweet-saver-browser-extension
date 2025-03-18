/* global chrome */

/**
 * StorageManager class handles all storage operations and migrations between storage types.
 * It provides a consistent interface for saving and retrieving tweets across different storage types.
 */
class StorageManager {
  constructor() {
    this.LOCAL_STORAGE_KEY = 'tweets';
    this.SYNC_STORAGE_KEY = 'tweets';
    this.STORAGE_TYPE_KEY = 'storageType';
  }

  /**
   * Get the current storage type from settings
   * @returns {Promise<string>} Returns 'sync' or 'local'
   */
  async getCurrentStorageType() {
    try {
      const result = await chrome.storage.sync.get(this.STORAGE_TYPE_KEY);
      return result[this.STORAGE_TYPE_KEY] || 'sync';
    } catch (error) {
      console.error('Error getting storage type:', error);
      return 'sync'; // Default to sync storage
    }
  }

  /**
   * Set the storage type and handle data migration
   * @param {string} newStorageType - 'sync' or 'local'
   * @returns {Promise<void>}
   */
  async setStorageType(newStorageType) {
    try {
      const currentType = await this.getCurrentStorageType();
      
      // If storage type is changing, migrate the data
      if (currentType !== newStorageType) {
        await this.migrateData(currentType, newStorageType);
      }

      // Update storage type setting
      await chrome.storage.sync.set({ [this.STORAGE_TYPE_KEY]: newStorageType });
    } catch (error) {
      console.error('Error setting storage type:', error);
      throw new Error('Failed to change storage type');
    }
  }

  /**
   * Migrate data between storage types
   * @param {string} fromType - Source storage type
   * @param {string} toType - Target storage type
   * @returns {Promise<void>}
   */
  async migrateData(fromType, toType) {
    try {
      // Get all tweets from both storages
      const [localTweets, syncTweets] = await Promise.all([
        this.getFromStorage('local'),
        this.getFromStorage('sync')
      ]);

      // Combine and deduplicate tweets
      const allTweets = this.deduplicateTweets([...localTweets, ...syncTweets]);

      // Save to new storage type
      const targetStorage = toType === 'sync' ? chrome.storage.sync : chrome.storage.local;
      await targetStorage.set({ [this.SYNC_STORAGE_KEY]: JSON.stringify(allTweets) });

      // Clear old storage
      const sourceStorage = fromType === 'sync' ? chrome.storage.sync : chrome.storage.local;
      await sourceStorage.remove(this.SYNC_STORAGE_KEY);

    } catch (error) {
      console.error('Error migrating data:', error);
      throw new Error('Failed to migrate data between storage types');
    }
  }

  /**
   * Get tweets from specified storage
   * @param {string} storageType - 'sync' or 'local'
   * @returns {Promise<Array>}
   */
  async getFromStorage(storageType) {
    try {
      const storage = storageType === 'sync' ? chrome.storage.sync : chrome.storage.local;
      const result = await storage.get(this.SYNC_STORAGE_KEY);
      return JSON.parse(result[this.SYNC_STORAGE_KEY] || '[]');
    } catch (error) {
      console.error(`Error getting tweets from ${storageType} storage:`, error);
      return [];
    }
  }

  /**
   * Get all tweets from both storage types
   * @returns {Promise<Array>}
   */
  async getAllTweets() {
    try {
      const [localTweets, syncTweets] = await Promise.all([
        this.getFromStorage('local'),
        this.getFromStorage('sync')
      ]);

      return this.deduplicateTweets([...localTweets, ...syncTweets]);
    } catch (error) {
      console.error('Error getting all tweets:', error);
      throw new Error('Failed to retrieve tweets');
    }
  }

  /**
   * Save tweet to the current storage type
   * @param {Object} tweet - Tweet object to save
   * @returns {Promise<void>}
   */
  async saveTweet(tweet) {
    try {
      const storageType = await this.getCurrentStorageType();
      const storage = storageType === 'sync' ? chrome.storage.sync : chrome.storage.local;
      
      // Get existing tweets
      const tweets = await this.getFromStorage(storageType);
      
      // Add new tweet
      tweets.push({
        ...tweet,
        savedAt: new Date().toISOString(),
        storageType
      });

      // Save back to storage
      await storage.set({ [this.SYNC_STORAGE_KEY]: JSON.stringify(tweets) });
    } catch (error) {
      console.error('Error saving tweet:', error);
      throw new Error('Failed to save tweet');
    }
  }

  /**
   * Delete tweet from both storage types
   * @param {string} tweetUrl - URL of tweet to delete
   * @returns {Promise<void>}
   */
  async deleteTweet(tweetUrl) {
    try {
      // Delete from both storage types to ensure it's completely removed
      await Promise.all([
        this.deleteFromStorage('local', tweetUrl),
        this.deleteFromStorage('sync', tweetUrl)
      ]);
    } catch (error) {
      console.error('Error deleting tweet:', error);
      throw new Error('Failed to delete tweet');
    }
  }

  /**
   * Delete tweet from specified storage
   * @param {string} storageType - 'sync' or 'local'
   * @param {string} tweetUrl - URL of tweet to delete
   * @returns {Promise<void>}
   */
  async deleteFromStorage(storageType, tweetUrl) {
    try {
      const storage = storageType === 'sync' ? chrome.storage.sync : chrome.storage.local;
      const tweets = await this.getFromStorage(storageType);
      
      const filteredTweets = tweets.filter(tweet => tweet.url !== tweetUrl);
      await storage.set({ [this.SYNC_STORAGE_KEY]: JSON.stringify(filteredTweets) });
    } catch (error) {
      console.error(`Error deleting tweet from ${storageType} storage:`, error);
      throw new Error(`Failed to delete tweet from ${storageType} storage`);
    }
  }

  /**
   * Remove duplicates from an array of tweets based on URL
   * @param {Array} tweets - Array of tweets
   * @returns {Array}
   */
  deduplicateTweets(tweets) {
    return Array.from(
      new Map(tweets.map(tweet => [tweet.url, tweet])).values()
    );
  }
}

export default new StorageManager(); 