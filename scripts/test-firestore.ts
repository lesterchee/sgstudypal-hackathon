import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function checkConnection() {
    try {
        console.log('Project ID Configured:', process.env.FIREBASE_PROJECT_ID);

        let credential;

        // 1. Try FIREBASE_ADMIN_CREDENTIALS
        if (process.env.FIREBASE_ADMIN_CREDENTIALS && process.env.FIREBASE_ADMIN_CREDENTIALS !== '{"type":"service_account","project_id":"<insert-project-id>"}') {
            console.log('Using FIREBASE_ADMIN_CREDENTIALS...');
            const creds = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
            credential = cert(creds);
        }
        // 2. Try individual env vars
        else if (process.env.FIREBASE_PRIVATE_KEY) {
            console.log('Using individual FIREBASE env vars...');
            credential = cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            });
        }
        else {
            console.log('No valid Firebase Admin credentials found in .env.local');
            process.exit(1);
        }

        const app = initializeApp({ credential });
        const db = getFirestore(app);

        // Try reading a basic document or collection to verify permissions
        console.log('Attempting to read from Firestore...');
        const snippet = await db.collection('test_logs').limit(1).get();
        console.log('✅ Connection successful. Permission granted. Found document?', !snippet.empty);

    } catch (e: any) {
        console.error('❌ Connection failed:', e.message);
        console.error(e.stack);
        process.exit(1);
    }
}

checkConnection();
