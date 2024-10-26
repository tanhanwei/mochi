chrome.runtime.onInstalled.addListener(() => {
  console.log('MindMeld extension installed');
});

// Handle log storage requests from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "storeLogs") {
    console.log('Received log storage request:', {
      timestamp: request.timestamp,
      logData: request.logData
    });

    (async () => {
      try {
        const key = `log_${request.timestamp}`;
        await chrome.storage.local.set({
          [key]: request.logData
        });
        
        // Verify storage
        const stored = await chrome.storage.local.get(key);
        console.log('Verified stored log:', {
          key,
          stored: stored[key]
        });
        
        // Cleanup old logs
        const keys = await chrome.storage.local.get(null);
        const logKeys = Object.keys(keys).filter(k => k.startsWith('log_')).sort();
        console.log('Current log keys:', logKeys);
        
        if (logKeys.length > 50) {
          const keysToRemove = logKeys.slice(0, logKeys.length - 50);
          await chrome.storage.local.remove(keysToRemove);
          console.log('Cleaned up old logs:', {
            removed: keysToRemove.length,
            remaining: logKeys.length - keysToRemove.length
          });
        }
        
        sendResponse({success: true, key});
      } catch (error) {
        console.error('Error storing logs:', error);
        sendResponse({success: false, error: error.message});
      }
    })();
    return true;
  }
});

// Initialize the AI capabilities when the extension starts
async function initializeAI() {
  try {
    const canSummarize = await ai.summarizer.capabilities();
    if (canSummarize && canSummarize.available !== 'no') {
      if (canSummarize.available === 'readily') {
        console.log('Summarizer is ready to use');
      } else {
        console.log('Summarizer needs to download model first');
      }
    } else {
      console.log('Summarizer is not available');
    }
  } catch (error) {
    console.error('Error initializing AI capabilities:', error);
  }
}

initializeAI();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Messages will be handled by content.js
  return true;
});
