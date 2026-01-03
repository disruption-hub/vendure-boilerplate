
import * as fs from 'fs';
import * as path from 'path';

const LOG_FILE = '/tmp/whatsapp-worker.log';

export function debugLog(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message} ${data ? JSON.stringify(data) : ''}\n`;
    try {
        fs.appendFileSync(LOG_FILE, logEntry);
    } catch (e) {
        console.error('Failed to write to debug log', e);
    }
}
