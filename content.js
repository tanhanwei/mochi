let summarizer = null;
let promptSession = null;

// Initialize the AI capabilities
async function initAICapabilities() {
    logger.log('Starting AI capabilities initialization...');
    try {
        // Check if AI API is available
        if (!self.ai || !self.ai.languageModel) {
            logger.error('AI API is not available');
            return { summarizer: null, promptSession: null }; 
        }

        // Initialize summarizer
        if (self.ai.summarizer) {
            console.log('Creating summarizer...');
            summarizer = await self.ai.summarizer.create();
            console.log('Summarizer initialized successfully');
        }

        // Initialize Prompt API with systemPrompt
        const { defaultTemperature, defaultTopK } = await self.ai.languageModel.capabilities();
        promptSession = await self.ai.languageModel.create({
            temperature: defaultTemperature,
            topK: defaultTopK,
            systemPrompt: `You are a helpful assistant that rewrites text to make it easier to understand for 5 year olds. You use very very simple language and short sentences. You keep all proper names, places, and quotes exactly as they are. You preserve paragraph breaks. You keep the same basic structure but make it clearer. For regular paragraphs, do not use bullet points if not found in original text. For any lists (numbered, bulleted, or otherwise), preserve the list format but simplify the language of each item. Respond with the new text only without ANY messages.`
        });
        console.log('Language Model initialized successfully');

        return { summarizer, promptSession };
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
                    if (!promptSession) {
                        console.error('Prompt API not available - cannot simplify text');
                        sendResponse({success: false, error: 'Prompt API not available'});
                        return;
                    }
                
                console.log('Finding main content element...');
                
                console.log('Prompt API status:', promptSession ? 'initialized' : 'not initialized');
                
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

                // Get all content elements (paragraphs, headers, and lists)
                const contentElements = Array.from(mainContent.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, dl'))
                    .filter(el => {
                        if (isHeader(el)) return true;
                        
                        // Skip elements that are likely metadata
                        const isMetadata = 
                            el.closest('.author, .meta, .claps, .likes, .stats, .profile, .bio, header, footer') ||
                            (el.tagName !== 'UL' && el.tagName !== 'OL' && el.tagName !== 'DL' && el.textContent.trim().length < 50) ||
                            /^(By|Published|Updated|Written by|(\d+) min read|(\d+) claps)/i.test(el.textContent.trim());
                        
                        // Include if it's not metadata and either a list or paragraph/header
                        return !isMetadata;
                    });

                console.log(`Found ${contentElements.length} content elements to process`);

                // Helper function to check if element is a list
                const isList = (element) => {
                    return ['UL', 'OL', 'DL'].includes(element.tagName);
                };

                // Group elements into chunks
                const chunks = [];
                let currentChunk = [];
                let currentTokenCount = 0;
                const MAX_TOKENS = 800; // Leave room for prompt text and response

                for (let i = 0; i < contentElements.length; i++) {
                    const element = contentElements[i];

                    // If we hit a header, list, or the chunk is getting too big, start a new chunk
                    if (isHeader(element) || isList(element) ||
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
                    // Log full chunk details before processing
                    console.log('Processing chunk:', {
                        elements: chunk.length,
                        types: chunk.map(el => el.tagName).join(', '),
                        isHeaderOnly: chunk.length === 1 && isHeader(chunk[0])
                    });

                    // Skip chunks that only contain headers
                    if (chunk.length === 1 && isHeader(chunk[0])) {
                        console.log('Skipping header-only chunk');
                        continue;
                    }

                    // Combine paragraph texts in the chunk
                    const chunkText = chunk
                        .filter(el => !isHeader(el))
                        .map(el => el.textContent)
                        .join('\n\n');

                    try {
                        console.log('Attempting to simplify chunk:', {
                            fullText: chunkText,
                            length: chunkText.length,
                            paragraphs: chunkText.split('\n\n').length
                        });
                        
                        // First attempt with original text
                        // Log the exact prompt being sent
                        console.log('Sending prompt to API:', {
                            text: chunkText,
                            length: chunkText.length,
                            wordCount: chunkText.split(/\s+/).length
                        });
                        
                        // Send the chunkText as the prompt with retries and API reinitialization
                        let simplifiedText = '';
                        let attempts = 0;
                        const maxAttempts = 20;
                        
                        while (attempts < maxAttempts) {
                            try {
                                // Reinitialize the Prompt API before each attempt
                                const { defaultTemperature, defaultTopK } = await self.ai.languageModel.capabilities();
                                promptSession = await self.ai.languageModel.create({
                                    temperature: defaultTemperature,
                                    topK: defaultTopK,
                                    systemPrompt: `You are a helpful assistant that rewrites text to make it easier to understand for those with ADHD. You use simple language and short sentences. You keep all proper names, places, and quotes exactly as they are. You preserve paragraph breaks. You keep the same basic structure but make it clearer.`
                                });
                                
                                const stream = await promptSession.promptStreaming(chunkText);
                                for await (const chunk of stream) {
                                    simplifiedText = chunk.trim();
                                }
                                
                                if (simplifiedText && simplifiedText.trim().length > 0) {
                                    console.log(`Successfully simplified text on attempt ${attempts + 1}`);
                                    break;
                                }
                                
                                console.warn(`Empty response from API on attempt ${attempts + 1} - retrying with new API session...`);
                            } catch (error) {
                                console.warn(`API error on attempt ${attempts + 1}:`, error);
                                if (attempts === maxAttempts - 1) {
                                    throw error; // Rethrow on final attempt
                                }
                            }
                            
                            attempts++;
                            // Add a small delay between retries
                            await new Promise(resolve => setTimeout(resolve, 500)); // Increased delay to 500ms
                        }

                        if (!simplifiedText || simplifiedText.trim().length === 0) {
                            console.warn('Failed to get valid response after all attempts - keeping original text');
                            continue;
                        }

                        // Split simplified text back into paragraphs and ensure we have the right number
                        const simplifiedParagraphs = simplifiedText.split('\n\n');
                        const originalParagraphs = chunk.filter(el => !isHeader(el));

                        console.log('Paragraph replacement:', {
                            originalCount: originalParagraphs.length,
                            simplifiedCount: simplifiedParagraphs.length,
                            originalTexts: originalParagraphs.map(p => p.textContent.substring(0, 50) + '...'),
                            simplifiedTexts: simplifiedParagraphs.map(p => p.substring(0, 50) + '...')
                        });

                        // Handle paragraph count mismatch
                        if (simplifiedParagraphs.length !== originalParagraphs.length) {
                            console.warn('Mismatch in paragraph counts:', {
                                original: originalParagraphs.length,
                                simplified: simplifiedParagraphs.length
                            });
                            
                            // If we got more simplified paragraphs than original, trim the excess
                            if (simplifiedParagraphs.length > originalParagraphs.length) {
                                simplifiedParagraphs.length = originalParagraphs.length;
                            }
                            // If we got fewer simplified paragraphs, remove extra original paragraphs
                            if (simplifiedParagraphs.length < originalParagraphs.length) {
                                // Remove the extra original paragraphs from the DOM
                                for (let i = simplifiedParagraphs.length; i < originalParagraphs.length; i++) {
                                    originalParagraphs[i].remove();
                                }
                                // Update the array to match simplified length
                                originalParagraphs.length = simplifiedParagraphs.length;
                            }
                        }

                        // Replace remaining original paragraphs with simplified versions
                        originalParagraphs.forEach((p, index) => {
                            let newElement;
                            if (isList(p)) {
                                // Create the same type of list
                                newElement = document.createElement(p.tagName);
                                
                                // Get original list items for comparison
                                const originalItems = Array.from(p.children);
                                
                                // Split the simplified text into list items
                                const items = simplifiedParagraphs[index].split('\n').filter(item => item.trim());
                                
                                // Create new list items
                                items.forEach((item, idx) => {
                                    const li = document.createElement(p.tagName === 'DL' ? 'dt' : 'li');
                                    li.textContent = item.replace(/^[•\-*]\s*/, ''); // Remove bullet points if present
                                    
                                    // Preserve any nested lists from original
                                    if (originalItems[idx]) {
                                        const nestedLists = originalItems[idx].querySelectorAll('ul, ol, dl');
                                        nestedLists.forEach(nested => {
                                            li.appendChild(nested.cloneNode(true));
                                        });
                                    }
                                    
                                    newElement.appendChild(li);
                                });
                            } else {
                                // Handle regular paragraphs
                                newElement = document.createElement('p');
                                newElement.textContent = simplifiedParagraphs[index];
                            }
                            
                            newElement.style.backgroundColor = '#f0f8ff';
                            newElement.style.padding = '10px';
                            newElement.style.borderLeft = '3px solid #3498db';
                            newElement.style.margin = '10px 0';
                            newElement.setAttribute('data-original-text', p.textContent);
                            p.parentNode.replaceChild(newElement, p);
                            
                            console.log(`Replaced paragraph ${index + 1}/${originalParagraphs.length}:`, {
                                original: p.textContent.substring(0, 50) + '...',
                                simplified: newElement.textContent.substring(0, 50) + '...'
                            });
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
            // Add OpenDyslexic font from jsDelivr CDN
            const fontLink = document.createElement('link');
            fontLink.rel = 'stylesheet';
            fontLink.href = 'https://cdn.jsdelivr.net/npm/opendyslexic@1.0.0/dist/opendyslexic.min.css';
            document.head.appendChild(fontLink);
            
            // Get font preference and apply
            chrome.storage.sync.get(['useOpenDyslexic'], function(result) {
                mainContent.style.fontFamily = result.useOpenDyslexic ? 
                    'OpenDyslexic, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' :
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
            });
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
                promptSessionAvailable: !!promptSession
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
