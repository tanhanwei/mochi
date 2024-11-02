document.addEventListener('DOMContentLoaded', function() {
    // Restore toggle state
    chrome.storage.sync.get('fontEnabled', function(result) {
        document.getElementById('fontToggle').checked = result.fontEnabled || false;
    });

    // Button click handlers
    document.getElementById('simplifyText').addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "simplify"});
        });
    });

    document.getElementById('summarize').addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "summarize"});
        });
    });

    document.getElementById('adjustLayout').addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "adjustLayout"});
        });
    });

    document.getElementById('viewLogs').addEventListener('click', function() {
        try {
            console.log('Fetching logs from storage...');
            chrome.storage.local.get(null, function(result) {
                console.log('Storage contents:', result);
                
                const logKeys = Object.keys(result)
                    .filter(k => k.startsWith('log_'))
                    .sort()
                    .reverse();
                
                console.log('Found log keys:', logKeys);

                // Debug log storage state
                for (const key of logKeys) {
                    const entry = result[key];
                    console.log('Log entry:', {
                        key,
                        hasContent: !!entry?.content,
                        contentLength: entry?.content?.length,
                        timestamp: entry?.timestamp
                    });
                }
                
                const logContent = document.getElementById('logContent');
                const logsView = document.getElementById('logsView');
                
                if (logKeys.length === 0) {
                    logContent.textContent = 'No logs found';
                    console.log('No logs found in storage');
                } else {
                    const allLogs = logKeys.map(key => {
                        const entry = result[key];
                        console.log('Processing log entry:', { key, entry });
                        return entry.content || 'Invalid log entry';
                    }).join('\n');
                    
                    logContent.textContent = allLogs;
                    console.log('Displayed logs:', {
                        numberOfEntries: logKeys.length,
                        totalLength: allLogs.length
                    });
                }
                
                logsView.style.display = 'block';
            });
        } catch (error) {
            console.error('Error viewing logs:', error);
            const logContent = document.getElementById('logContent');
            logContent.textContent = `Error viewing logs: ${error.message}`;
            document.getElementById('logsView').style.display = 'block';
        }
    });

    document.getElementById('closeLogs').addEventListener('click', function() {
        document.getElementById('logsView').style.display = 'none';
    });

    document.getElementById('downloadLogs').addEventListener('click', function() {
        chrome.storage.local.get(null, function(result) {
        const logKeys = Object.keys(result)
            .filter(k => k.startsWith('log_'))
            .sort();
        
        if (logKeys.length === 0) {
            alert('No logs to download');
            return;
        }

        const allLogs = logKeys.map(key => result[key].content).join('\n');
        const blob = new Blob([allLogs], {type: 'text/plain'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mindmeld-logs-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}); // Close downloadLogs click handler

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
});
