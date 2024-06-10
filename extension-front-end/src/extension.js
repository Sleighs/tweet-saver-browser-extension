/* global chrome */
/* global browser */


const API = chrome || browser;

// Opens options page
export async function openOptions() {
  if (API.runtime.openOptionsPage) {
    //console.log('chrome runtime opened options page');
    API.runtime.openOptionsPage();
  } else {
    //console.log('window opened options page');
    window.open(API.runtime.getURL('options.html'));
  }
}

// Saves options to chrome.storage
export async function saveOptions(data) {
  await API.storage.sync.set({ options: data })
    .then(() => { 
      if (data.debug) console.log('Options saved.') 
    });
}

// Gets options from chrome.storage
export async function getOptions() {
  var optionsData;
  try {
    const data = await API.storage.sync.get("options")
      .then((result) => { 
        if (result.options.debug) console.log('Options retrieved.', result.options)
        optionsData = result.options; 
      });
  } catch (error) {
    console.log('Error retrieving options.', error);
  }
  return optionsData;
}

export async function getSavedTweets() {
  let tweetData = null;

  try {
    await API.storage.local.get("tweets")
      .then((result) => { 
        console.log('Tweets received.', result) 
        tweetData = result;
      });
  } catch (error) {
    console.log('getSavedTweets - Error retrieving tweets.', error);
  }

  return tweetData;
}

export async function getTweetUrls() {
  try {
    let urlData = null;
    
    await API.storage.local.get("tweetUrls")
      .then((result) => { 
        console.log('Tweet URLs received.', result) 
        urlData = result;
      });
    
    return urlData;
  } catch (error) {
    console.log('getTweetUrls - Error retrieving tweet URLs.', error);
  }  
}

export async function saveQuickDraft(draft) {
  await API.storage.local.set({ draft })
    .then(() => { console.log('Draft saved.') });
}

export async function loadQuickDraft() {
  let draftData = null;

  try {
    await API.storage.local.get("draft")
      .then((result) => { 
        console.log('Draft received.', result) 
        draftData = result.draft;
      });
  } catch (error) {
    console.log('loadQuickDraft - Error retrieving draft.', error);
  }  

  return draftData;
}
export async function updateIcon() {
  // send message to background script to update icon
  await API.runtime.sendMessage({ method: 'enableExtension' }, (response) => {
    //console.log('update icon', response);
  })

};