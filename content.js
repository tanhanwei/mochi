let summarizer = null;
let promptAPI = null;

// Initialize the AI capabilities
async function initAICapabilities() {
  console.log('Starting AI capabilities initialization...');
  try {
    // Check if AI API is available
    if (typeof ai === 'undefined') {
      console.error('AI API is not defined');
      return { summarizer: null, promptAPI: null };
    }

    // Initialize summarizer
    if (ai.summarizer) {
      console.log('Creating summarizer...');
      summarizer = await ai.summarizer.create();
      console.log('Waiting for summarizer to be ready...');
      await summarizer.ready;
      console.log('Summarizer initialized successfully');
    } else {
      console.warn('Summarizer API not available in ai object:', ai);
    }
    
    // Initialize Prompt API
    if (ai.languageModel) {
      try {
        console.log('Creating Language Model instance for text simplification...');
        promptAPI = await ai.languageModel.create();
        if (!promptAPI) {
          throw new Error('Language Model creation failed - returned null');
        }
        console.log('Waiting for Language Model to be ready...');
        await promptAPI.ready;
        console.log('Language Model initialized successfully for text simplification');
      } catch (error) {
        console.error('Failed to initialize Language Model:', error);
        promptAPI = null;
      }
    } else {
      console.warn('Language Model not available in ai object:', ai);
    }

    console.log('AI capabilities initialization complete:', {
      summarizerAvailable: !!summarizer,
      promptAPIAvailable: !!promptAPI
    });
    return { summarizer, promptAPI };
  } catch (error) {
    console.error('Error initializing AI capabilities:', error);
    throw error;
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Handle message asynchronously but keep connection open
    (async () => {
        console.log("Received action:", request.action);
        switch (request.action) {
            case "simplify":
                try {
                    await ensureInitialized();
                if (!promptAPI) {
                    console.error('Prompt API not available - cannot simplify text');
                    return;
                }
                
                console.log('Finding main content element...');
                
                console.log('Prompt API status:', promptAPI ? 'initialized' : 'not initialized');
                
                // Try to find the main content using various selectors
                const mainContent = document.querySelector('main, article, .content, .post, #content, #main') 
                    || document.querySelector('div[role="main"]');
                
                if (!mainContent) {
                    console.error('Could not find main content element');
                    return;
                }

                console.log('Found main content element:', {
                    tagName: mainContent.tagName,
                    className: mainContent.className,
                    id: mainContent.id
                });

                // Get all paragraphs within main content
                const paragraphs = Array.from(mainContent.getElementsByTagName('p'));

                console.log(`Found ${paragraphs.length} paragraphs to simplify in main content`);
                    for (let p of paragraphs) {
                        const originalText = p.textContent;
                        // Use Prompt API to simplify the text
                        console.log('Attempting to simplify text:', originalText.substring(0, 50) + '...');
                        console.log('Processing paragraph:', {
                            length: originalText.length,
                            preview: originalText.substring(0, 100) + '...'
                        });

                        try {
                            const simplifiedText = await promptAPI.prompt(
                                `Simplify this text to make it easier to understand: "${originalText}"`
                            );
                            
                            console.log('API Response:', {
                                original: {
                                    length: originalText.length,
                                    preview: originalText.substring(0, 100)
                                },
                                simplified: {
                                    length: simplifiedText.length,
                                    preview: simplifiedText.substring(0, 100)
                                }
                            });

                            if (!simplifiedText || simplifiedText.trim().length === 0) {
                                console.warn('Empty response from API - keeping original text');
                                continue;
                            }
                        
                            // Create new paragraph with simplified text
                            const newP = document.createElement('p');
                            newP.textContent = simplifiedText;
                            newP.style.backgroundColor = '#f0f8ff';
                            newP.style.padding = '10px';
                            newP.style.borderLeft = '3px solid #3498db';
                            newP.style.margin = '10px 0';
                            
                            // Add original text as hidden attribute for reference
                            newP.setAttribute('data-original-text', originalText);
                            
                            p.parentNode.replaceChild(newP, p);
                            console.log('Successfully replaced paragraph with simplified version');
                        } catch (error) {
                            console.error('Error simplifying paragraph:', error, {
                                text: originalText.substring(0, 100) + '...'
                            });
                        }
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
                } catch (error) {
                    console.error('Error simplifying content:', error);
                }
                break;
                
            case "summarize":
            try {
                await ensureInitialized();
                if (!summarizer) {
                    console.error('Summarizer not available - cannot generate summary');
                    return;
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
        sendResponse({success: true});
    })();
    return true; // Keep the message channel open for async response
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
let initializationPromise = null;

function ensureInitialized() {
    if (!initializationPromise) {
        console.log('Content script loaded - starting initialization');
        initializationPromise = initAICapabilities().then(() => {
            console.log('Content script setup complete with capabilities:', {
                summarizerAvailable: !!summarizer,
                promptAPIAvailable: !!promptAPI
            });
        }).catch(error => {
            console.error('Failed to initialize AI capabilities:', error);
            initializationPromise = null; // Allow retry on failure
        });
    }
    return initializationPromise;
}

// Initialize on load
ensureInitialized();
