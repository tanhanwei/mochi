document.addEventListener('DOMContentLoaded', function() {
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

    document.getElementById('viewLogs').addEventListener('click', async function() {
        const result = await chrome.storage.local.get(null);
        const logKeys = Object.keys(result)
            .filter(k => k.startsWith('log_'))
            .sort()
            .reverse();
        
        const logContent = document.getElementById('logContent');
        const logsView = document.getElementById('logsView');
        
        if (logKeys.length === 0) {
            logContent.textContent = 'No logs found';
        } else {
            const allLogs = logKeys.map(key => result[key].content).join('\n');
            logContent.textContent = allLogs;
        }
        
        logsView.style.display = 'block';
    });

    document.getElementById('closeLogs').addEventListener('click', function() {
        document.getElementById('logsView').style.display = 'none';
    });

    document.getElementById('downloadLogs').addEventListener('click', async function() {
        const result = await chrome.storage.local.get(null);
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
});
