// Purpose: Cryptographically hash all PDFs (SHA-256) in the vault to detect and delete exact file duplicates, ensuring RAG purity.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const papersDir = path.join(process.cwd(), 'apps/sg-tutor/_data/papers');

function walkDir(dir: string, fileList: string[] = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            walkDir(filePath, fileList);
        } else if (filePath.endsWith('.pdf')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

function hashFile(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}

try {
    const allPdfs = walkDir(papersDir);
    const seenHashes = new Map<string, string>();
    let duplicateCount = 0;
    let bytesSaved = 0;

    console.log(`\n[DEDUPE] Scanning ${allPdfs.length} files for cryptographic matches...`);

    for (const filePath of allPdfs) {
        const fileHash = hashFile(filePath);

        if (seenHashes.has(fileHash)) {
            const stats = fs.statSync(filePath);
            bytesSaved += stats.size;
            duplicateCount++;

            // Delete the duplicate
            fs.unlinkSync(filePath);
            console.log(`[DEDUPE] Deleted duplicate: ${path.basename(filePath)}`);
        } else {
            seenHashes.set(fileHash, filePath);
        }
    }

    console.log(`[DEDUPE] ---------------------------------`);
    console.log(`[DEDUPE] Total Duplicates Terminated: ${duplicateCount}`);
    console.log(`[DEDUPE] Storage Reclaimed: ${(bytesSaved / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`[DEDUPE] ---------------------------------\n`);

} catch (e) {
    console.log(`[DEDUPE] Vault directory not found or empty.`);
}
