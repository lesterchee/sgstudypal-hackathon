// Purpose: Sprint 128 — Parse raw PDF filenames and reorganize 5,800+ files into a /Year/Level/Subject taxonomy for easy Firebase batch uploading.
import fs from 'fs';
import path from 'path';

const TARGET_DIR = path.join(process.cwd(), 'public/pdfs');

function sortPdfs() {
    console.log('Starting The Great Sort...');

    if (!fs.existsSync(TARGET_DIR)) {
        console.error(`Directory not found: ${TARGET_DIR}`);
        return;
    }

    const files = fs.readdirSync(TARGET_DIR);
    let movedCount = 0;
    let skippedCount = 0;

    files.forEach(file => {
        // Only process PDFs
        if (!file.endsWith('.pdf')) return;

        // Extract metadata using Regex
        const yearMatch = file.match(/(20\d{2})/);
        const levelMatch = file.match(/(p[1-6])/i);
        const subjectMatch = file.match(/(maths|science|english|chinese)/i);

        const year = yearMatch ? yearMatch[0] : 'Unknown_Year';
        const level = levelMatch ? levelMatch[0].toLowerCase() : 'unknown_level';
        const subject = subjectMatch ? subjectMatch[0].toLowerCase() : 'unknown_subject';

        // Construct the new nested directory path (Year > Level > Subject)
        const newDir = path.join(TARGET_DIR, year, level, subject);

        // Purpose: Ensure the nested destination directories exist before attempting to move files.
        if (!fs.existsSync(newDir)) {
            fs.mkdirSync(newDir, { recursive: true });
        }

        const oldPath = path.join(TARGET_DIR, file);
        const newPath = path.join(newDir, file);

        // Move the file
        try {
            fs.renameSync(oldPath, newPath);
            movedCount++;
        } catch (err) {
            console.error(`Failed to move ${file}:`, err);
            skippedCount++;
        }
    });

    console.log('=========================================');
    console.log(' Sort Complete');
    console.log('=========================================');
    console.log(` Organized: ${movedCount} files`);
    console.log(` Skipped/Errors: ${skippedCount} files`);
}

sortPdfs();
