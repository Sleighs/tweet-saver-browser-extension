/* global chrome */
/* global browser */


const API = browser || chrome;

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
  await API.storage.local.get("tweets")
    .then(() => { 
      console.log('Tweet URLs received.') 
    });
}

export async function getTweetUrls() {
  await API.storage.local.get("tweetUrls")
    .then(() => { 
      console.log('Tweet URLs received.') 
    });
}

export async function updateIcon() {
  // send message to background script to update icon
  await API.runtime.sendMessage({ method: 'enableExtension' }, (response) => {
    //console.log('update icon', response);
  })

};