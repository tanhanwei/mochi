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
        const key = `log_${timestamp}`;
        const logData = {
            timestamp: timestamp,
            content: logText
        };

        try {
            console.log('Attempting to store logs:', {
                key,
                timestamp,
                logLength: logText.length,
                entries: this.logs.length
            });

            // Send logs to background script for storage
            const response = await chrome.runtime.sendMessage({
                action: "storeLogs",
                key: key,
                timestamp: timestamp,
                logData: logData
            });
            
            if (!response || !response.success) {
                console.error('Failed to store logs:', response?.error || 'No response');
                throw new Error(response?.error || 'Failed to store logs');
            }
            
            console.log('Logs stored successfully:', {
                key,
                response,
                timestamp
            });
        } catch (error) {
            console.error('Error writing logs:', error);
        } finally {
            this.logs = [];
            this.lastWrite = Date.now();
        }
    }
};
