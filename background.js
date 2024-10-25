chrome.runtime.onInstalled.addListener(() => {
  console.log('MindMeld extension installed');
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
