// Saves options to chrome.storage
function saveOptions() {
    const rewriterApiKey = document.getElementById('rewriterApiKey').value;
    const summarizerApiKey = document.getElementById('summarizerApiKey').value;
    
    chrome.storage.sync.set({
        rewriterApiKey: rewriterApiKey,
        summarizerApiKey: summarizerApiKey
    }, function() {
        // Update status to let user know options were saved.
        const status = document.getElementById('status');
        status.textContent = 'Options saved.';
        status.className = 'status success';
        status.style.display = 'block';
        setTimeout(function() {
            status.style.display = 'none';
        }, 2000);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
    chrome.storage.sync.get({
        rewriterApiKey: '',
        summarizerApiKey: ''
    }, function(items) {
        document.getElementById('rewriterApiKey').value = items.rewriterApiKey;
        document.getElementById('summarizerApiKey').value = items.summarizerApiKey;
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
