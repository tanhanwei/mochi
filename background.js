chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('MindMeld extension installed');
    chrome.storage.sync.remove('readingLevel');
  }
});


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Messages will be handled by content.js
  return true;
});
