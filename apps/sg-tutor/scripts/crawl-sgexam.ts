// Purpose: Automates the downloading of P3-P6 exam papers from sgexam.com,
// bypassing UI ads by extracting direct PDF links via a Two-Hop method.
// Hop 1: Scan category pages for ALL paper listings.
// Hop 2: Navigate into each paper page to find .pdf download links.
import puppeteer from 'puppeteer';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Purpose: Sprint 127 — Randomized throttle (jitter) to mimic human behavior and evade WAF rate limits.
const randomSleep = (min: number, max: number) => {
    const ms = Math.floor(Math.random() * (max - min + 1) + min);
    return new Promise(r => setTimeout(r, ms));
};

const TARGET_LEVELS = [3, 4, 5, 6];
const TARGET_SUBJECTS = ['maths', 'science', 'english', 'chinese'];
// Purpose: Sprint 123 — Fix ESM compatibility by using process.cwd() instead of __dirname.
const DOWNLOAD_DIR = path.join(process.cwd(), 'public/pdfs');

// Purpose: Ensure the target download directory exists before any write operations
if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// Purpose: Stream-download a PDF from a URL to the local filesystem with graceful error handling
async function downloadPdf(url: string, filepath: string): Promise<void> {
    try {
        const response = await axios({ url, method: 'GET', responseType: 'stream', timeout: 30000 });
        return new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(filepath);
            response.data.pipe(writer);
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`  ❌ Failed to download ${url}:`, (error as Error).message);
    }
}

// Purpose: Core crawler orchestrator — iterates through level×subject combos,
// performs Two-Hop navigation, and invokes downloadPdf for each discovered link.
async function runCrawler(): Promise<void> {
    console.log('=========================================');
    console.log('  SGExam Two-Hop Crawler — Starting...');
    console.log('=========================================');
    console.log(`  Targets: P${TARGET_LEVELS.join(', P')} × [${TARGET_SUBJECTS.join(', ')}]`);
    console.log(`  Output:  ${DOWNLOAD_DIR}\n`);

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Purpose: Block ad-related network requests to speed up page loads and avoid overlay interference
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        const url = req.url();
        if (
            url.includes('googleads') ||
            url.includes('doubleclick') ||
            url.includes('adservice') ||
            req.resourceType() === 'image' ||
            req.resourceType() === 'font'
        ) {
            req.abort();
        } else {
            req.continue();
        }
    });

    let downloadCount = 0;
    let skipCount = 0;

    for (const level of TARGET_LEVELS) {
        for (const subject of TARGET_SUBJECTS) {
            const categoryUrl = `https://sgexam.com/primary-${level}-${subject}/`;
            console.log(`\n[HOP 1] Scanning Category: ${categoryUrl}`);

            try {
                await page.goto(categoryUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

                // Purpose: Sprint 127 — Extract all paper URLs on the category page and process them with stealth delays.
                const paperLinks = await page.evaluate(() => {
                    const links = Array.from(document.querySelectorAll('article a')) as HTMLAnchorElement[];
                    return Array.from(new Set(links.map(a => a.href).filter(href => href.includes('-pdf'))));
                });

                if (paperLinks.length === 0) {
                    console.log(`  ⏭️  No papers found for P${level} ${subject}. Skipping.`);
                    skipCount++;
                    continue;
                }

                console.log(`  📦 Found ${paperLinks.length} papers for P${level} ${subject}. Beginning stealth extraction...`);

                for (const link of paperLinks) {
                    console.log(`\n[HOP 2] Navigating to: ${link}`);
                    try {
                        await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 60000 });

                        // Purpose: Derive a filename slug from the URL path segment
                        const urlParts = link.split('/');
                        const slug = urlParts[urlParts.length - 2] || `p${level}-${subject}-${Date.now()}`;

                        // Purpose: Sprint 125+127 — Bypass AddToAny decoys, also accept Google Drive links.
                        const pdfUrl = await page.evaluate(() => {
                            const links = Array.from(document.querySelectorAll('a'));
                            const downloadBtn = links.find(a =>
                                !a.href.includes('addtoany') &&
                                (a.href.toLowerCase().includes('drive.google.com') || a.href.toLowerCase().endsWith('.pdf') || a.innerText.toLowerCase().includes('download'))
                            );
                            return downloadBtn ? downloadBtn.href : null;
                        });

                        if (pdfUrl) {
                            const fileName = `${slug}.pdf`;
                            const filePath = path.join(DOWNLOAD_DIR, fileName);

                            // Purpose: Skip re-download if file already exists (idempotent runs)
                            if (fs.existsSync(filePath)) {
                                console.log(`  ⏭️  Already exists: ${fileName}`);
                                continue;
                            }

                            console.log(`  ⬇️  Downloading: ${fileName}`);
                            await downloadPdf(pdfUrl, filePath);
                            downloadCount++;

                            // Purpose: Sprint 127 — Randomized delay between 8-15s to mimic human browsing cadence
                            const delayMs = Math.floor(Math.random() * (15000 - 8000 + 1) + 8000);
                            console.log(`  ✅ Saved. Chilling for ${(delayMs / 1000).toFixed(1)} seconds...`);
                            await randomSleep(8000, 15000);
                        } else {
                            console.log(`  ❌ No PDF link found on ${link}`);
                            skipCount++;
                        }
                    } catch (err) {
                        console.error(`  ❌ Error on paper ${link}:`, (err as Error).message);
                        skipCount++;
                    }
                }
            } catch (error) {
                // Purpose: Graceful failsafe — log and continue on 404s, timeouts, and DOM errors
                console.error(`  ❌ Error processing P${level} ${subject} category:`, (error as Error).message);
                skipCount++;
            }
        }
    }

    await browser.close();

    console.log('\n=========================================');
    console.log('  Crawler Execution Complete');
    console.log('=========================================');
    console.log(`  Downloaded: ${downloadCount}`);
    console.log(`  Skipped:    ${skipCount}`);
    console.log(`  Output Dir: ${DOWNLOAD_DIR}`);
}

// Purpose: Sprint 124 — Direct invocation (ESM-compatible, no require.main guard needed).
runCrawler().catch((err) => {
    console.error('Fatal crash in crawler execution:', err);
    process.exit(1);
});
