/* global chrome */
/* global browser */

import { debugLog, debugError } from '../utils/debug.js';

const API = chrome || browser;

// Opens options page
export async function openOptions() {
  if (API.runtime.openOptionsPage) {
    debugLog('chrome runtime opened options page');
    API.runtime.openOptionsPage();
  } else {
    debugLog('window opened options page');
    window.open(API.runtime.getURL('options.html'));
  }
}

// Saves options to chrome.storage
export async function saveOptions(data) {
  await API.storage.sync.set({ options: data })
    .then(() => { 
      debugLog('Options saved.'); 
    });
}

// Gets options from chrome.storage
export async function getOptions() {
  let optionsData;
  try {
    await API.storage.sync.get("options")
      .then((result) => { 
        debugLog('Options retrieved.', result.options);
        optionsData = result.options; 
      });
  } catch (error) {
    debugError('Error retrieving options.', error);
  }
  return optionsData;
}

export async function getSavedTweets() {
  let tweetData = null;

  try {
    await API.storage.local.get("tweets")
      .then((result) => { 
        debugLog('Tweets received.', result);
        tweetData = result;
      });
  } catch (error) {
    debugError('Error retrieving tweets.', error);
  }

  return tweetData;
}

export async function getTweetUrls() {
  try {
    let urlData = null;
    
    await API.storage.local.get("tweetUrls")
      .then((result) => { 
        debugLog('Tweet URLs received.', result);
        urlData = result;
      });
    
    return urlData;
  } catch (error) {
    debugError('Error retrieving tweet URLs.', error);
  }  
}

export async function saveQuickDraft(draft) {
  await API.storage.local.set({ draft })
    .then(() => { debugLog('Draft saved.') });
}

export async function loadQuickDraft() {
  let draftData = null;

  try {
    await API.storage.local.get("draft")
      .then((result) => { 
        debugLog('Draft received.', result);
        draftData = result.draft;
      });
  } catch (error) {
    debugError('Error retrieving draft.', error);
  }  

  return draftData;
}

export async function updateIcon() {
  // send message to background script to update icon
  await API.runtime.sendMessage({ method: 'enableExtension' });
}

export async function saveDataToStorage(tweetUrls, tweets, browserStorageType) {
  try {
    if (browserStorageType === 'sync') {
      await chrome.storage.sync.set({
        tweetUrls: JSON.stringify(tweetUrls),
        tweets: JSON.stringify(tweets),
      }, function() {
        debugLog('Data saved successfully:', { tweetUrls, tweets });
      });
    } else if (browserStorageType === 'local') {
      await chrome.storage.local.set({ 
        tweetUrls: JSON.stringify(tweetUrls),
        tweets: JSON.stringify(tweets),
      }, function() {
        debugLog('Data saved successfully:', { tweetUrls, tweets });
      });
    } else {
      return;
    }
  } catch (error) {
    debugError('Error saving data:', error, { tweetUrls, tweets });
  }
}