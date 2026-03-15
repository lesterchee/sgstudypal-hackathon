// Purpose: Scaffold a strict, predictable directory taxonomy for Vector DB ingestion.
import fs from 'fs';
import path from 'path';

const baseDir = path.join(process.cwd(), 'apps/sg-tutor/_data/vault');
const levels = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'Sec1', 'Sec2', 'Sec3', 'Sec4', 'Sec5', 'JC1', 'JC2'];
const subjects = ['English', 'Math', 'Science', 'MotherTongue', 'Physics', 'Chemistry', 'Biology', 'POA'];
const years = ['2021', '2022', '2023', '2024', '2025'];

console.log('[SCAFFOLD] Building strict RAG taxonomy...');

levels.forEach(level => {
    subjects.forEach(subject => {
        years.forEach(year => {
            const dirPath = path.join(baseDir, level, subject, year);
            fs.mkdirSync(dirPath, { recursive: true });
        });
    });
});

console.log(`[SCAFFOLD] Vault taxonomy generated at: ${baseDir}`);
