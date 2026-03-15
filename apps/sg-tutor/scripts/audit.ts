// Purpose: Traverse the _data/papers directory to calculate total PDF count and cumulative vault size in MB.
import fs from 'fs';
import path from 'path';

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

try {
    const allPdfs = walkDir(papersDir);
    let totalSize = 0;

    console.log(`\n[AUDIT] ---------------------------------`);
    console.log(`[AUDIT] Total PDFs downloaded: ${allPdfs.length}`);

    allPdfs.forEach(file => {
        const stats = fs.statSync(file);
        totalSize += stats.size;
    });

    console.log(`[AUDIT] Total Vault Size: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`[AUDIT] ---------------------------------\n`);
} catch (e) {
    console.log(`[AUDIT] Vault directory not found or empty.`);
}
