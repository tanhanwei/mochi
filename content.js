// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case "simplify":
            console.log("Simplifying page content...");
            // TODO: Implement text simplification
            break;
        case "summarize":
            console.log("Summarizing page content...");
            // TODO: Implement summarization
            break;
        case "adjustLayout":
            console.log("Adjusting page layout...");
            // TODO: Implement layout adjustment
            break;
    }
    return true;
});
