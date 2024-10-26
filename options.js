// Check AI capabilities when options page loads
async function checkCapabilities() {
    try {
        const status = document.getElementById('status');
        const canSummarize = await ai.summarizer.capabilities();
        
        if (canSummarize && canSummarize.available !== 'no') {
            status.textContent = canSummarize.available === 'readily' ? 
                'AI features are ready to use' : 
                'AI features are downloading...';
            status.className = 'status success';
        } else {
            status.textContent = 'AI features are not available on this device';
            status.className = 'status error';
        }
        status.style.display = 'block';
    } catch (error) {
        console.error('Error checking AI capabilities:', error);
        const status = document.getElementById('status');
        status.textContent = 'Error checking AI capabilities';
        status.className = 'status error';
        status.style.display = 'block';
    }
}

// Save font preference
document.getElementById('useOpenDyslexic').addEventListener('change', function(e) {
    chrome.storage.sync.set({
        useOpenDyslexic: e.target.checked
    }, function() {
        const status = document.getElementById('status');
        status.textContent = 'Settings saved';
        status.className = 'status success';
        status.style.display = 'block';
        setTimeout(() => status.style.display = 'none', 2000);
    });
});

// Load saved preferences
document.addEventListener('DOMContentLoaded', function() {
    checkCapabilities();
    
    // Load font preference
    chrome.storage.sync.get(['useOpenDyslexic'], function(result) {
        document.getElementById('useOpenDyslexic').checked = result.useOpenDyslexic || false;
    });
});
