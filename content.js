let summarizer = null;
let rewriter = null;

// Initialize the AI capabilities
async function initAICapabilities() {
  try {
    // Check summarizer capabilities
    const canSummarize = await ai.summarizer.capabilities();
    if (canSummarize && canSummarize.available !== 'no') {
      summarizer = await ai.summarizer.create();
      if (canSummarize.available !== 'readily') {
        await summarizer.ready;
      }
      console.log('Summarizer initialized successfully');
    }
    
    // Check rewriter capabilities
    const canRewrite = await ai.rewriter.capabilities();
    if (canRewrite && canRewrite.available !== 'no') {
      rewriter = await ai.rewriter.create();
      if (canRewrite.available !== 'readily') {
        await rewriter.ready;
      }
      console.log('Rewriter initialized successfully');
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
            try {
                if (!rewriter) {
                    await initAICapabilities();
                }
                
                const mainContent = document.querySelector('main, article, .content, .post, #content, #main') 
                    || document.querySelector('div[role="main"]');
                
                if (mainContent && rewriter) {
                    const paragraphs = mainContent.getElementsByTagName('p');
                    for (let p of paragraphs) {
                        const originalText = p.textContent;
                        // Use AI rewriter to simplify the text
                        const simplifiedText = await rewriter.simplify(originalText, {
                            level: 'basic',
                            preserveFormatting: true
                        });
                        
                        // Create new paragraph with simplified text
                        const newP = document.createElement('p');
                        newP.textContent = simplifiedText;
                        newP.style.backgroundColor = '#f0f8ff';
                        newP.style.padding = '10px';
                        newP.style.borderLeft = '3px solid #3498db';
                        newP.style.margin = '10px 0';
                        p.parentNode.replaceChild(newP, p);
                    }

                    // Add visual feedback
                    const notification = document.createElement('div');
                    notification.textContent = 'Text simplified';
                    notification.style.position = 'fixed';
                    notification.style.top = '20px';
                    notification.style.left = '50%';
                    notification.style.transform = 'translateX(-50%)';
                    notification.style.backgroundColor = '#3498db';
                    notification.style.color = 'white';
                    notification.style.padding = '10px 20px';
                    notification.style.borderRadius = '5px';
                    notification.style.zIndex = '10000';
                    document.body.appendChild(notification);
                    setTimeout(() => notification.remove(), 3000);
                }
            } catch (error) {
                console.error('Error simplifying content:', error);
            }
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
                    
                    // Create and display summary overlay
                    const overlay = document.createElement('div');
                    overlay.style.position = 'fixed';
                    overlay.style.top = '50%';
                    overlay.style.left = '50%';
                    overlay.style.transform = 'translate(-50%, -50%)';
                    overlay.style.backgroundColor = 'white';
                    overlay.style.padding = '20px';
                    overlay.style.borderRadius = '10px';
                    overlay.style.boxShadow = '0 0 20px rgba(0,0,0,0.3)';
                    overlay.style.maxWidth = '600px';
                    overlay.style.maxHeight = '80vh';
                    overlay.style.overflow = 'auto';
                    overlay.style.zIndex = '10000';

                    const title = document.createElement('h2');
                    title.textContent = 'Page Summary';
                    title.style.marginTop = '0';
                    title.style.color = '#2c3e50';

                    const content = document.createElement('p');
                    content.textContent = summary;
                    content.style.lineHeight = '1.6';
                    content.style.color = '#34495e';

                    const closeButton = document.createElement('button');
                    closeButton.textContent = '✕';
                    closeButton.style.position = 'absolute';
                    closeButton.style.top = '10px';
                    closeButton.style.right = '10px';
                    closeButton.style.border = 'none';
                    closeButton.style.background = 'none';
                    closeButton.style.fontSize = '20px';
                    closeButton.style.cursor = 'pointer';
                    closeButton.style.color = '#7f8c8d';
                    closeButton.onclick = () => overlay.remove();

                    overlay.appendChild(closeButton);
                    overlay.appendChild(title);
                    overlay.appendChild(content);
                    document.body.appendChild(overlay);
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
        // Try multiple selectors to find main content
        const mainContent = document.querySelector('main, article, .content, .post, #content, #main') 
            || document.querySelector('div[role="main"]')
            || document.body;

        if (mainContent) {
            // Apply readable layout
            mainContent.style.maxWidth = '800px';
            mainContent.style.margin = '0 auto';
            mainContent.style.padding = '20px';
            mainContent.style.fontSize = '18px';
            mainContent.style.lineHeight = '1.6';
            mainContent.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
            mainContent.style.color = '#2c3e50';
            mainContent.style.backgroundColor = '#ffffff';

            // Improve paragraph readability
            const paragraphs = mainContent.getElementsByTagName('p');
            for (let p of paragraphs) {
                p.style.marginBottom = '1.5em';
                p.style.textAlign = 'left';
            }

            // Improve headings
            const headings = mainContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
            for (let heading of headings) {
                heading.style.lineHeight = '1.2';
                heading.style.marginTop = '1.5em';
                heading.style.marginBottom = '0.5em';
            }

            // Add visual feedback
            const notification = document.createElement('div');
            notification.textContent = 'Layout adjusted for better readability';
            notification.style.position = 'fixed';
            notification.style.top = '20px';
            notification.style.left = '50%';
            notification.style.transform = 'translateX(-50%)';
            notification.style.backgroundColor = '#2ecc71';
            notification.style.color = 'white';
            notification.style.padding = '10px 20px';
            notification.style.borderRadius = '5px';
            notification.style.zIndex = '10000';
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        }
    } catch (error) {
        console.error('Error adjusting layout:', error);
    }
}

// Initialize AI capabilities when content script loads
initAICapabilities();
