
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
    // Load font preference
    chrome.storage.sync.get(['useOpenDyslexic'], function(result) {
        document.getElementById('useOpenDyslexic').checked = result.useOpenDyslexic || false;
    });
});
