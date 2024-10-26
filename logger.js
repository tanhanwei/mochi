// Create a logging utility
class Logger {
    constructor() {
        this.logs = [];
        this.lastWrite = Date.now();
        this.writeInterval = 5000; // Write every 5 seconds
    }

    log(...args) {
        const timestamp = new Date().toISOString();
        const logEntry = `${timestamp}: ${args.join(' ')}`;
        this.logs.push(logEntry);
        this._scheduleWrite();
    }

    error(...args) {
        const timestamp = new Date().toISOString();
        const logEntry = `${timestamp} ERROR: ${args.join(' ')}`;
        this.logs.push(logEntry);
        this._scheduleWrite();
    }

    _scheduleWrite() {
        const now = Date.now();
        if (now - this.lastWrite >= this.writeInterval) {
            this._writeLogs();
        }
    }

    async _writeLogs() {
        if (this.logs.length === 0) return;

        const blob = new Blob([this.logs.join('\n') + '\n'], { type: 'text/plain' });
        const downloadUrl = URL.createObjectURL(blob);
        
        try {
            const response = await fetch(downloadUrl);
            const text = await response.text();
            
            // Create download link
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = downloadUrl;
            a.download = `mindmeld-log-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.txt`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } finally {
            URL.revokeObjectURL(downloadUrl);
            this.logs = [];
            this.lastWrite = Date.now();
        }
    }
}

// Export singleton instance
export const logger = new Logger();
