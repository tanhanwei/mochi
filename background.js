chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('MindMeld extension installed');
    chrome.storage.sync.remove('readingLevel');
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSystemPrompts') {
    fetch(chrome.runtime.getURL('systemPrompts.json'))
      .then(response => response.json())
      .then(data => {
        sendResponse({ success: true, prompts: data });
      })
      .catch(error => {
        console.error('Error fetching systemPrompts.json:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  return true;
});
