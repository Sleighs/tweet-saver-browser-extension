/**
 * Helper utilities for Tweet Saver
 * @module utils/helpers
 */

/**
 * Debounce function to limit the rate at which a function can fire
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to wait
 * @returns {Function} The debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Check if a URL is a valid tweet URL
 * @param {string} url - The URL to check
 * @param {boolean} [ignorePhotoUrl=false] - Whether to ignore photo URLs
 * @returns {boolean} Whether the URL is a valid tweet URL
 */
export const isTweetUrl = (url, ignorePhotoUrl = false) => {
  if (!url) return false;
  
  const isStatusUrl = url.includes('status');
  const isNotCompose = !url.includes('compose');
  const isNotQuote = !url.includes('quote');
  const isNotRetweet = !url.includes('retweet');
  const isNotLike = !url.includes('like');
  const isNotPhoto = ignorePhotoUrl ? !url.includes('photo') : true;

  return isStatusUrl && isNotCompose && isNotQuote && 
         isNotRetweet && isNotLike && isNotPhoto;
};

/**
 * Create a DOM element with attributes and properties
 * @param {string} tag - The HTML tag name
 * @param {Object} attributes - The attributes to set
 * @param {Object} properties - The properties to set
 * @returns {HTMLElement} The created element
 */
export const createElement = (tag, attributes = {}, properties = {}) => {
  const element = document.createElement(tag);
  
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  
  Object.entries(properties).forEach(([key, value]) => {
    element[key] = value;
  });
  
  return element;
};

/**
 * Add an animation to an element
 * @param {HTMLElement} element - The element to animate
 * @param {string} animationClass - The CSS class for the animation
 * @param {number} duration - The duration of the animation in milliseconds
 * @returns {void}
 */
export const addAnimation = (element, animationClass, duration) => {
  element.classList.add(animationClass);
  setTimeout(() => {
    element.classList.remove(animationClass);
  }, duration);
};

/**
 * Format a date string for display
 * @param {string} dateString - The date string to format
 * @returns {string} The formatted date string
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

/**
 * Generate a unique ID
 * @returns {string} A unique ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Log a message if debug mode is enabled
 * @param {string} message - The message to log
 * @param {...any} args - Additional arguments to log
 */
export const debugLog = (message, ...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Tweet Saver] ${message}`, ...args);
  }
};

/**
 * Handle errors and optionally show user feedback
 * @param {Error} error - The error to handle
 * @param {string} context - The context where the error occurred
 * @param {boolean} [showUser=false] - Whether to show feedback to the user
 */
export const handleError = (error, context, showUser = false) => {
  debugLog(`Error in ${context}:`, error);
  
  if (showUser) {
    // TODO: Implement user feedback mechanism
    console.error(`An error occurred while ${context}`);
  }
};

export default {
  debounce,
  isTweetUrl,
  createElement,
  addAnimation,
  formatDate,
  generateId,
  debugLog,
  handleError
}; 