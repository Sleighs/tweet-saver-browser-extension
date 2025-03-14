/**
 * Debug logging utility
 */

let debugMode = false;

/**
 * Initialize debug mode from settings
 * @param {boolean} enabled - Whether debug mode is enabled
 */
export const initializeDebugMode = (enabled) => {
  debugMode = enabled;
};

/**
 * Log a debug message if debug mode is enabled
 * @param {string} message - The message to log
 * @param {...any} args - Additional arguments to log
 */
export const debugLog = (message, ...args) => {
  if (debugMode) {
    console.log(`[Tweet Saver] ${message}`, ...args);
  }
};

/**
 * Log a debug error if debug mode is enabled
 * @param {string} message - The error message to log
 * @param {Error} error - The error object to log
 * @param {...any} args - Additional arguments to log
 */
export const debugError = (message, error, ...args) => {
  if (debugMode) {
    console.error(`[Tweet Saver] ${message}:`, error, ...args);
  }
};

/**
 * Log a debug warning if debug mode is enabled
 * @param {string} message - The warning message to log
 * @param {...any} args - Additional arguments to log
 */
export const debugWarn = (message, ...args) => {
  if (debugMode) {
    console.warn(`[Tweet Saver] ${message}`, ...args);
  }
};

/**
 * Get the current debug mode state
 * @returns {boolean} Whether debug mode is enabled
 */
export const isDebugMode = () => debugMode; 