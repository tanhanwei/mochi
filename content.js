let summarizer = null;

// Initialize the summarizer
async function initSummarizer() {
  try {
    const canSummarize = await ai.summarizer.capabilities();
    if (canSummarize && canSummarize.available !== 'no') {
      summarizer = await ai.summarizer.create();
      if (canSummarize.available !== 'readily') {
        await summarizer.ready;
      }
      console.log('Summarizer initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing summarizer:', error);
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    switch (request.action) {
        case "simplify":
            console.log("Simplifying page content...");
            // Will be implemented with writer/rewriter API
            break;
            
        case "summarize":
            try {
                if (!summarizer) {
                    await initSummarizer();
                }
                const mainContent = document.querySelector('main, article, .content');
                if (mainContent) {
                    const summary = await summarizer.summarize(mainContent.textContent);
                    console.log("Summary:", summary);
                    // TODO: Display summary to user
                }
            } catch (error) {
                console.error("Error summarizing content:", error);
            }
            break;
            
        case "adjustLayout":
            console.log("Adjusting page layout...");
            adjustLayout();
            break;
    }
    return true;
});

function adjustLayout() {
    try {
        const mainContent = document.querySelector('main, article, .content');
        if (mainContent) {
            mainContent.style.maxWidth = '800px';
            mainContent.style.margin = '0 auto';
            mainContent.style.padding = '20px';
            mainContent.style.fontSize = '16px';
            mainContent.style.lineHeight = '1.5';
        } else {
            console.error('Could not find main content element');
        }
    } catch (error) {
        console.error('Error adjusting layout:', error);
    }
}

// Initialize summarizer when content script loads
initSummarizer();
