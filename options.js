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

document.addEventListener('DOMContentLoaded', checkCapabilities);
