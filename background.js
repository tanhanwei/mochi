// Background service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('MindMeld extension installed');
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "simplify") {
    // TODO: Implement text simplification logic
    console.log("Simplify request received");
  } else if (request.action === "summarize") {
    // TODO: Implement summarization logic
    console.log("Summarize request received");
  }
  return true;
});
