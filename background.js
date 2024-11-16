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
        const key = request.key || `log_${request.timestamp}`;
        const data = {
          [key]: request.logData
        };
        
        console.log('Storing log data:', {
          key,
          data: request.logData
        });

        await chrome.storage.local.set(data);
        
        // Verify storage
        const stored = await chrome.storage.local.get(key);
        console.log('Verified stored log:', {
          key,
          stored: stored[key]
        });

        if (!stored[key]) {
          throw new Error('Failed to verify log storage');
        }
        
        // Cleanup old logs
        const allData = await chrome.storage.local.get(null);
        const logKeys = Object.keys(allData)
          .filter(k => k.startsWith('log_'))
          .sort();
        
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


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Messages will be handled by content.js
  return true;
});
