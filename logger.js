// Create a logging utility
const logger = {
    logs: [],
    lastWrite: Date.now(),
    writeInterval: 5000, // Write every 5 seconds

    log(...args) {
        const timestamp = new Date().toISOString();
        const logEntry = `${timestamp}: ${args.join(' ')}`;
        this.logs.push(logEntry);
        this._scheduleWrite();
    },

    error(...args) {
        const timestamp = new Date().toISOString();
        const logEntry = `${timestamp} ERROR: ${args.join(' ')}`;
        this.logs.push(logEntry);
        this._scheduleWrite();
    },

    _scheduleWrite() {
        const now = Date.now();
        if (now - this.lastWrite >= this.writeInterval) {
            this._writeLogs();
        }
    },

    async _writeLogs() {
        if (this.logs.length === 0) return;

        const logText = this.logs.join('\n') + '\n';
        const timestamp = new Date().toISOString().slice(0,19).replace(/:/g,'-');
        const logData = {
            timestamp: timestamp,
            content: logText
        };

        try {
            // Store logs in chrome.storage.local
            await chrome.storage.local.set({
                [`log_${timestamp}`]: logData
            });
            
            // Keep only last 50 log entries
            const keys = await chrome.storage.local.get(null);
            const logKeys = Object.keys(keys).filter(k => k.startsWith('log_')).sort();
            if (logKeys.length > 50) {
                const keysToRemove = logKeys.slice(0, logKeys.length - 50);
                await chrome.storage.local.remove(keysToRemove);
            }
        } catch (error) {
            console.error('Error writing logs:', error);
        } finally {
            this.logs = [];
            this.lastWrite = Date.now();
        }
    }
};
