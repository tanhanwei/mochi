chrome.runtime.onInstalled.addListener(() => {
  console.log('MindMeld extension installed');
});


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Messages will be handled by content.js
  return true;
});
