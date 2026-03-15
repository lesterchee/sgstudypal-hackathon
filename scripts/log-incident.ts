import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const errorMessage = args[0] || 'Unknown Error';
const fixDescription = args[1] || 'No fix provided';

const logPath = path.join(__dirname, '../temp/logs/incident-tracker.json');

function logIncident() {
    try {
        let logs = [];
        if (fs.existsSync(logPath)) {
            const data = fs.readFileSync(logPath, 'utf8');
            logs = JSON.parse(data);
        } else {
            fs.mkdirSync(path.dirname(logPath), { recursive: true });
        }

        logs.push({
            timestamp: new Date().toISOString(),
            error: errorMessage,
            fix: fixDescription,
        });

        fs.writeFileSync(logPath, JSON.stringify(logs, null, 2), 'utf8');
        console.log(`Incident logged successfully to ${logPath}`);
    } catch (error) {
        console.error('Failed to log incident:', error);
        process.exit(1);
    }
}

logIncident();
