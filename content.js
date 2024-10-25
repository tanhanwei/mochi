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

                // Helper function to check if element is a header
                const isHeader = (element) => {
                    return element.tagName.match(/^H[1-6]$/i);
                };

                // Helper function to estimate token count (rough approximation)
                const estimateTokens = (text) => {
                    return text.split(/\s+/).length * 1.3; // Multiply by 1.3 as a safety factor
                };

                // Get all content elements (paragraphs and headers)
                const contentElements = Array.from(mainContent.querySelectorAll('p, h1, h2, h3, h4, h5, h6'))
                    .filter(el => {
                        if (isHeader(el)) return true;
                        
                        // Skip paragraphs that are likely metadata
                        const isMetadata = 
                            el.closest('.author, .meta, .claps, .likes, .stats, .profile, .bio, header, footer') ||
                            el.textContent.trim().length < 50 ||
                            /^(By|Published|Updated|Written by|(\d+) min read|(\d+) claps)/i.test(el.textContent.trim());
                        
                        return !isMetadata;
                    });

                console.log(`Found ${contentElements.length} content elements to process`);

                // Group elements into chunks
                const chunks = [];
                let currentChunk = [];
                let currentTokenCount = 0;
                const MAX_TOKENS = 800; // Leave room for prompt text and response

                for (let i = 0; i < contentElements.length; i++) {
                    const element = contentElements[i];
                    
                    // If we hit a header or the chunk is getting too big, start a new chunk
                    if (isHeader(element) || 
                        (currentChunk.length > 0 && 
                         (currentTokenCount + estimateTokens(element.textContent) > MAX_TOKENS))) {
                        
                        if (currentChunk.length > 0) {
                            chunks.push(currentChunk);
                        }
                        currentChunk = [element];
                        currentTokenCount = estimateTokens(element.textContent);
                    } else {
                        currentChunk.push(element);
                        currentTokenCount += estimateTokens(element.textContent);
                    }
                }
                
                // Add the last chunk if it exists
                if (currentChunk.length > 0) {
                    chunks.push(currentChunk);
                }

                console.log(`Grouped content into ${chunks.length} chunks`);

                // Process each chunk
                for (let chunk of chunks) {
                    // Skip chunks that only contain headers
                    if (chunk.length === 1 && isHeader(chunk[0])) continue;

                    // Combine paragraph texts in the chunk
                    const chunkText = chunk
                        .filter(el => !isHeader(el))
                        .map(el => el.textContent)
                        .join('\n\n');

                    try {
                        console.log('Attempting to simplify chunk:', chunkText.substring(0, 50) + '...');
                        
                        let simplifiedText;
                        // First attempt with original text
                        try {
                            simplifiedText = await promptAPI.prompt(
                                `Rewrite the following English language text to make it easier to understand for those with ADHD. Use simple language and short sentences. Keep all proper names, places, and quotes exactly as they are. Preserve paragraph breaks. Keep the same basic structure but make it clearer: "${chunkText}"`
                            );
                        } catch (err) {
                            if (err.name === 'NotSupportedError' && err.message.includes('untested language')) {
                                console.log('Detected non-English content, attempting to identify problematic words...');
                                
                                // Try to identify non-English words
                                try {
                                    // Force API to only output foreign words in strict comma format
                                    const analysis = await promptAPI.prompt(
                                        `Analyze this text and identify ONLY non-English words. Output ONLY the words in this EXACT format - example: "word1","word2","word3" (no spaces after commas): "${chunkText}"`
                                    );
                                    
                                    // Parse the strictly formatted response
                                    const nonEnglishWords = analysis.split(',')
                                        .map(word => word.replace(/"/g, '').trim()) // Remove quotes and trim
                                        .filter(word => word && word.length > 1);
                                    console.log('Identified non-English words:', nonEnglishWords);
                                    
                                    // Replace non-English words with quoted placeholders
                                    let modifiedText = chunkText;
                                    const replacements = new Map();
                                    
                                    nonEnglishWords.forEach((word, index) => {
                                        if (word && modifiedText.includes(word)) {
                                            // Use quoted single letters as placeholders
                                            const placeholder = `"${String.fromCharCode(65 + index)}"`; // "A", "B", "C", etc.
                                            replacements.set(placeholder, word);
                                            // Escape special characters in word for RegExp
                                            const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                            modifiedText = modifiedText.replace(new RegExp(escapedWord, 'g'), placeholder);
                                        }
                                    });
                                    
                                    // Try simplification with replaced text, using a more specific prompt
                                    try {
                                        const attempts = 3;
                                        for (let i = 0; i < attempts; i++) {
                                            try {
                                                simplifiedText = await promptAPI.prompt(
                                                    `Your task is to simplify this English text while keeping all [NAME#] placeholders unchanged:
                                                    1. Use basic English words and short sentences
                                                    2. Break complex ideas into simple parts
                                                    3. Keep paragraph structure
                                                    4. Do NOT change any [NAME#] placeholders
                                                    5. Do NOT add any explanations
                                                    
                                                    Text to simplify: "${modifiedText}"`
                                                );
                                                break; // Success - exit loop
                                            } catch (retryError) {
                                                if (i === attempts - 1) throw retryError; // Last attempt failed
                                                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
                                            }
                                        }
                                        
                                        // Restore original names
                                        replacements.forEach((original, placeholder) => {
                                            simplifiedText = simplifiedText.replace(new RegExp(placeholder, 'g'), original);
                                        });
                                        
                                    } catch (error) {
                                        console.error('Failed to simplify even with replacements:', error);
                                        throw error;
                                    }
                                } catch (error) {
                                    console.error('Failed to analyze non-English content:', error);
                                    throw error;
                                }
                            } else {
                                throw err; // Re-throw other errors
                            }
                        }

                        if (!simplifiedText || simplifiedText.trim().length === 0) {
                            console.warn('Empty response from API - keeping original text');
                            continue;
                        }

                        // Split simplified text back into paragraphs
                        const simplifiedParagraphs = simplifiedText.split('\n\n');
                        const originalParagraphs = chunk.filter(el => !isHeader(el));

                        // Replace each original paragraph with its simplified version
                        originalParagraphs.forEach((p, index) => {
                            if (index < simplifiedParagraphs.length) {
                                const newP = document.createElement('p');
                                newP.textContent = simplifiedParagraphs[index];
                                newP.style.backgroundColor = '#f0f8ff';
                                newP.style.padding = '10px';
                                newP.style.borderLeft = '3px solid #3498db';
                                newP.style.margin = '10px 0';
                                newP.setAttribute('data-original-text', p.textContent);
                                p.parentNode.replaceChild(newP, p);
                            }
                        });
                            console.log('Successfully replaced paragraph with simplified version');
                        } catch (error) {
                            console.error('Error simplifying paragraph:', error, {
                                text: chunkText.substring(0, 100) + '...'
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
