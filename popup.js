function hideAllPages() {
    document.getElementById('welcomePage').style.display = 'none';
    document.getElementById('guidePage').style.display = 'none';
    document.getElementById('personalizedMessagePage').style.display = 'none';
    document.getElementById('mainContent').style.display = 'none';
}

// Text sets and levels
const guideSets = [
    {
        setName: 'Learning and Brain Development',
        levels: [
            'The acquisition of advanced vocabulary and linguistic patterns during early childhood demonstrates remarkable neural plasticity, enabling children to effortlessly assimilate complex communication structures through mere exposure to their environment.',
            'Young children\'s ability to learn language shows how adaptable their brains are, as they can naturally pick up complicated speaking patterns just by listening to the people around them.',
            'Young children learn new words and speaking patterns very easily because their brains are good at learning from what they hear every day.',
            'Kids learn to talk by listening to others. Their young brains help them learn words and speaking very easily.'
        ]
    },
    {
        setName: 'Technology Impact',
        levels: [
            'The proliferation of digital technologies has precipitated unprecedented transformations in societal communication paradigms, fundamentally altering interpersonal dynamics across diverse demographic segments.',
            'The widespread use of digital technology has brought about major changes in how society communicates, affecting how different groups of people interact with each other.',
            'Digital technology has changed how people in society talk to each other, making communication different for various groups.',
            'New tech has changed how people talk to each other in our world today.'
        ]
    }
];

const personalizedMessages = {
    1: `Based on your reading preferences, we'll:\n✨ Keep sophisticated language while adding helpful context\n📚 Use simpler words for specialist terms\n🎯 Maintain detailed information while improving clarity`,
    2: `Based on your reading preferences, we'll:\n💡 Use clear everyday language that's still detailed\n🔄 Break down complex ideas with simpler words\n📝 Make sentences shorter while keeping them interesting`,
    3: `Based on your reading preferences, we'll:\n🌟 Use simple, friendly words\n✂️ Break long sentences into shorter ones\n🎨 Explain tricky ideas with simpler words`,
    4: `Based on your reading preferences, we'll:\n🎯 Use the simplest, clearest words possible\n✨ Keep every sentence short and easy\n🌈 Explain everything like talking to a friend`
};

let currentSetIndex = 0;
let currentLevelIndex = 0;
let userScores = [];

function showCurrentGuideText() {
    const currentSet = guideSets[currentSetIndex];
    const currentText = currentSet.levels[currentLevelIndex];
    document.getElementById('guideText').textContent = currentText;
}

function calculateAverageScore() {
    const sum = userScores.reduce((a, b) => a + b, 0);
    const averageScore = sum / userScores.length;
    let readingLevel;

    if (averageScore <= 1.75) {
        readingLevel = 1;
    } else if (averageScore <= 2.5) {
        readingLevel = 2;
    } else if (averageScore <= 3.25) {
        readingLevel = 3;
    } else {
        readingLevel = 4;
    }

    chrome.storage.sync.set({ readingLevel: readingLevel });

    const message = personalizedMessages[readingLevel];
    document.getElementById('personalizedMessage').textContent = message;

    hideAllPages();
    document.getElementById('personalizedMessagePage').style.display = 'block';
}

function initializePopup() {
    // Restore theme, toggle and slider states
    chrome.storage.sync.get(['selectedTheme'], function(result) {
        document.getElementById('themeSelector').value = result.selectedTheme || 'default';
    });
    chrome.storage.sync.get(['lineSpacing', 'letterSpacing', 'wordSpacing'], function(result) {
        document.getElementById('lineSpacing').value = result.lineSpacing || 1.5;
        document.getElementById('lineSpacingValue').textContent = result.lineSpacing || 1.5;
        
        document.getElementById('letterSpacing').value = result.letterSpacing || 0;
        document.getElementById('letterSpacingValue').textContent = (result.letterSpacing || 0) + 'px';
        
        document.getElementById('wordSpacing').value = result.wordSpacing || 0;
        document.getElementById('wordSpacingValue').textContent = (result.wordSpacing || 0) + 'px';
    });
    
    chrome.storage.sync.get(['fontEnabled', 'hoverEnabled'], function(result) {
        document.getElementById('fontToggle').checked = result.fontEnabled || false;
        document.getElementById('hoverToggle').checked = result.hoverEnabled || false;
    });
}

document.addEventListener('DOMContentLoaded', function() {
    hideAllPages();
    
    chrome.storage.sync.get('readingLevel', function(result) {
        if (result.readingLevel) {
            document.getElementById('mainContent').style.display = 'block';
            initializePopup();
        } else {
            document.getElementById('welcomePage').style.display = 'block';
        }
    });

    document.getElementById('letsBegin').addEventListener('click', function() {
        hideAllPages();
        currentSetIndex = 0;
        currentLevelIndex = 0;
        userScores = [];
        document.getElementById('guidePage').style.display = 'block';
        showCurrentGuideText();
    });

    document.getElementById('comfortableBtn').addEventListener('click', function() {
        userScores.push(currentLevelIndex + 1);
        currentSetIndex++;
        currentLevelIndex = 0;
        if (currentSetIndex < guideSets.length) {
            showCurrentGuideText();
        } else {
            calculateAverageScore();
        }
    });

    document.getElementById('preferEasierBtn').addEventListener('click', function() {
        currentLevelIndex++;
        if (currentLevelIndex < 4) {
            showCurrentGuideText();
        } else {
            userScores.push(currentLevelIndex + 1);
            currentSetIndex++;
            currentLevelIndex = 0;
            if (currentSetIndex < guideSets.length) {
                showCurrentGuideText();
            } else {
                calculateAverageScore();
            }
        }
    });

    document.getElementById('continueBtn').addEventListener('click', function() {
        hideAllPages();
        document.getElementById('mainContent').style.display = 'block';
        initializePopup();
    });
});

    // Button click handlers
    document.getElementById('simplifyText').addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0] && /^https?:/.test(tabs[0].url)) {
                chrome.tabs.sendMessage(tabs[0].id, {action: "simplify"}, function(response) {
                    if (chrome.runtime.lastError) {
                        console.error("Could not send simplify message:", chrome.runtime.lastError.message);
                    }
                });
            } else {
                console.warn("Active tab is not a valid web page.");
            }
        });
    });

    // Hover to show original toggle handler
    const hoverToggle = document.getElementById('hoverToggle');
    
    // Request current hover state when popup opens
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && /^https?:/.test(tabs[0].url)) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'getHoverState' }, function(response) {
                if (chrome.runtime.lastError) {
                    console.error("Could not get hover state:", chrome.runtime.lastError);
                } else if (response && response.hoverEnabled !== undefined) {
                    hoverToggle.checked = response.hoverEnabled;
                }
            });
        }
    });

    hoverToggle.addEventListener('change', function(e) {
        const enabled = e.target.checked;
        
        // Save preference
        chrome.storage.sync.set({ hoverEnabled: enabled });
        
        // Apply to current tab
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0] && /^https?:/.test(tabs[0].url)) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'toggleHover',
                    enabled: enabled
                }, function(response) {
                    if (chrome.runtime.lastError) {
                        console.error('Could not toggle hover:', chrome.runtime.lastError.message);
                    }
                });
            } else {
                console.warn("Active tab is not a valid web page. Cannot toggle hover.");
            }
        });
    });

    // OpenDyslexic font toggle handler
    const fontToggle = document.getElementById('fontToggle');
    
    // Request current font state when popup opens
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && /^https?:/.test(tabs[0].url)) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'getFontState' }, function(response) {
                if (chrome.runtime.lastError) {
                    console.error("Could not get font state:", chrome.runtime.lastError.message);
                    fontToggle.checked = false; // Default to unchecked
                } else if (response && response.fontEnabled !== undefined) {
                    fontToggle.checked = response.fontEnabled;
                }
            });
        } else {
            console.warn("Active tab is not a valid web page. Cannot get font state.");
            fontToggle.checked = false; // Default to unchecked
        }
    });

    fontToggle.addEventListener('change', function(e) {
        const enabled = e.target.checked;
        
        // Save preference
        chrome.storage.sync.set({ fontEnabled: enabled });
        
        // Apply to current tab
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0] && /^https?:/.test(tabs[0].url)) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'toggleFont',
                    enabled: enabled
                }, function(response) {
                    if (chrome.runtime.lastError) {
                        console.error('Could not toggle font:', chrome.runtime.lastError.message);
                    }
                });
            } else {
                console.warn("Active tab is not a valid web page. Cannot toggle font.");
            }
        });
    });

    // Spacing adjustment handlers
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    function applySpacingAdjustments() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0] && /^https?:/.test(tabs[0].url)) {
                chrome.storage.sync.get(['lineSpacing', 'letterSpacing', 'wordSpacing'], function(result) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'adjustSpacing',
                        lineSpacing: result.lineSpacing || 1.5,
                        letterSpacing: result.letterSpacing || 0,
                        wordSpacing: result.wordSpacing || 0
                    }, function(response) {
                        if (chrome.runtime.lastError) {
                            console.error('Could not adjust spacing:', chrome.runtime.lastError.message);
                        }
                    });
                });
            } else {
                console.warn("Active tab is not a valid web page. Cannot adjust spacing.");
            }
        });
    }

    const debouncedApplySpacing = debounce(applySpacingAdjustments, 100);

    // Line Spacing Slider
    document.getElementById('lineSpacing').addEventListener('input', function(e) {
        const value = e.target.value;
        document.getElementById('lineSpacingValue').textContent = value;
        chrome.storage.sync.set({ lineSpacing: value });
        debouncedApplySpacing();
    });

    // Letter Spacing Slider
    document.getElementById('letterSpacing').addEventListener('input', function(e) {
        const value = e.target.value;
        document.getElementById('letterSpacingValue').textContent = value + 'px';
        chrome.storage.sync.set({ letterSpacing: value });
        debouncedApplySpacing();
    });

    // Word Spacing Slider
    document.getElementById('wordSpacing').addEventListener('input', function(e) {
        const value = e.target.value;
        document.getElementById('wordSpacingValue').textContent = value + 'px';
        chrome.storage.sync.set({ wordSpacing: value });
        debouncedApplySpacing();
    });

    // Theme Selector Handler
    document.getElementById('themeSelector').addEventListener('change', function(e) {
        const selectedTheme = e.target.value;
        
        // Save the selected theme
        chrome.storage.sync.set({ selectedTheme: selectedTheme });
        
        // Send message to content script to apply the theme
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'applyTheme',
                theme: selectedTheme
            });
        });
    });

    // Apply initial spacing and theme
    debouncedApplySpacing();
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0] && /^https?:/.test(tabs[0].url)) {
            chrome.storage.sync.get(['selectedTheme'], function(result) {
                const selectedTheme = result.selectedTheme || 'default';
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'applyTheme',
                    theme: selectedTheme
                }, function(response) {
                    if (chrome.runtime.lastError) {
                        console.error('Could not apply theme:', chrome.runtime.lastError.message);
                    }
                });
            });
        } else {
            console.warn("Active tab is not a valid web page. Cannot apply theme.");
        }
    });
