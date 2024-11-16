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
    chrome.storage.sync.get('isNewUser', function(result) {
        if (result.isNewUser === undefined || result.isNewUser) {
            // Show welcome page
            document.getElementById('welcomePage').style.display = 'block';
            document.getElementById('mainContent').style.display = 'none';
        } else {
            // Show main content
            document.getElementById('welcomePage').style.display = 'none';
            document.getElementById('mainContent').style.display = 'block';
            initializePopup();
        }
    });

    // Event listener for "Let's Begin" button
    document.getElementById('letsBegin').addEventListener('click', function() {
        // Update isNewUser flag
        chrome.storage.sync.set({ isNewUser: false }, function() {
            // Show main content
            document.getElementById('welcomePage').style.display = 'none';
            document.getElementById('mainContent').style.display = 'block';
            initializePopup();
        });
    });
});

    // Button click handlers
    document.getElementById('simplifyText').addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "simplify"});
        });
    });

    // Hover to show original toggle handler
    const hoverToggle = document.getElementById('hoverToggle');
    
    // Request current hover state when popup opens
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getHoverState' }, function(response) {
            if (response && response.hoverEnabled !== undefined) {
                hoverToggle.checked = response.hoverEnabled;
            }
        });
    });

    hoverToggle.addEventListener('change', function(e) {
        const enabled = e.target.checked;
        
        // Save preference
        chrome.storage.sync.set({ hoverEnabled: enabled });
        
        // Apply to current tab
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'toggleHover',
                enabled: enabled
            });
        });
    });

    // OpenDyslexic font toggle handler
    const fontToggle = document.getElementById('fontToggle');
    
    // Request current font state when popup opens
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getFontState' }, function(response) {
            if (response && response.fontEnabled !== undefined) {
                fontToggle.checked = response.fontEnabled;
            }
        });
    });

    fontToggle.addEventListener('change', function(e) {
        const enabled = e.target.checked;
        
        // Save preference
        chrome.storage.sync.set({ fontEnabled: enabled });
        
        // Apply to current tab
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'toggleFont',
                enabled: enabled
            });
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
            chrome.storage.sync.get(['lineSpacing', 'letterSpacing', 'wordSpacing'], function(result) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'adjustSpacing',
                    lineSpacing: result.lineSpacing || 1.5,
                    letterSpacing: result.letterSpacing || 0,
                    wordSpacing: result.wordSpacing || 0
                });
            });
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
        chrome.storage.sync.get(['selectedTheme'], function(result) {
            const selectedTheme = result.selectedTheme || 'default';
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'applyTheme',
                theme: selectedTheme
            });
        });
    });
});
