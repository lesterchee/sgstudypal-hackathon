// Purpose: Playwright-based web scraper (Apex Harvester) that crawls sgtestpaper.com\n// using BFS discovery, extracts metadata from URL slugs, and downloads PDFs/ZIPs\n// into organized folders by level/subject/year for the exam paper vault.\n// @ts-ignore - Playwright is executed in a separate environment or not fully typed here
import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// Purpose: Delay execution by ms milliseconds to prevent rate-limiting during multi-day runs
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const BASE_URL = 'https://www.sgtestpaper.com';
const DATA_DIR = path.join(process.cwd(), 'apps', 'sg-tutor', '_data', 'papers');

// Purpose: Intercept raw PDF fetches from JS viewers and expand the valid year boundary to 2020-2025.
const VALID_YEAR_MIN = 2020;
const VALID_YEAR_MAX = 2025;

// Purpose: Clean category names for dynamic folder generation
const cleanName = (str: string) => str.replace(/[^a-zA-Z0-9\-]/g, '').trim();

// Purpose: BFS seed URLs — the entry points for the queue
const SEED_URLS = [
    `${BASE_URL}/primary`,
    `${BASE_URL}/secondary`,
    `${BASE_URL}/jc`,
];

// Purpose: Uncapped BFS queue for full-scale site traversal.
const MAX_PAGES_TO_CRAWL = 50000;

// Purpose: Determine if a URL is an internal sgtestpaper link worth queueing
function isQueueableLink(url: string): boolean {
    if (!url.includes('sgtestpaper.com')) return false;
    // Skip non-content pages
    if (/\/(contact|shop|privacy|about|terms)/i.test(url)) return false;
    // Must contain exam-related patterns
    return /(\/exam_|\/y20|\/sec|\/p[1-6]|\/jc|\/\d{4}\/|_paper|_prelim|_sa2|_ca2)/i.test(url);
}

// Purpose: Determine if a URL is a final PDF viewer page (the harvest target)
function isTargetPdfPage(url: string): boolean {
    // Pages ending in _pdf.html or containing /download_
    if (/_pdf\.html/i.test(url)) return true;
    if (/\/download_/i.test(url)) return true;
    // School-specific exam paper pages (e.g., y2025_sec4_a_maths_prelim_SchoolName.html)
    if (/y\d{2,4}_(?:sec|jc)\d_[a-z].*_[A-Z].*\.html/i.test(url)) return true;
    // Primary school-specific pages (e.g., p6_english_prelim_SchoolName.html)
    if (/p[1-6]_[a-z]+_(?:prelim|sa2|ca2).*_[A-Z].*\.html/i.test(url)) return true;
    // Zip download pages
    if (/_zip\.html/i.test(url)) return true;
    return false;
}

// Purpose: Extract metadata (Level, Subject, Year) directly from flat URL slugs instead of relying on DOM hierarchy.
function parseUrlMetadata(url: string): { level: string; subject: string; year: string } | null {
    try {
        const parsedUrl = new URL(url);
        const pathname = parsedUrl.pathname;

        // Try to extract year from the URL path
        let year: string | null = null;
        const year4Match = pathname.match(/(?:_|\/)(20[1-2]\d)(?:_|\/|\.)/);
        const year2Match = pathname.match(/(?:_|\/)y(\d{2})_/);
        if (year4Match) {
            year = year4Match[1];
        } else if (year2Match) {
            year = `20${year2Match[1]}`;
        }

        // Enforce the 2021-2025 date filter
        if (!year) return null;
        const yearInt = parseInt(year, 10);
        if (isNaN(yearInt) || yearInt < VALID_YEAR_MIN || yearInt > VALID_YEAR_MAX) return null;

        // Try to extract level
        let level = 'unknown';
        const priMatch = pathname.match(/\/p([1-6])[\/_]/i);
        const secMatch = pathname.match(/sec([1-5])/i);
        const jcMatch = pathname.match(/jc([1-2])/i);
        if (priMatch) level = `primary-${priMatch[1]}`;
        else if (secMatch) level = `secondary-${secMatch[1]}`;
        else if (jcMatch) level = `jc-${jcMatch[1]}`;
        else if (pathname.includes('/secondary/')) level = 'secondary';
        else if (pathname.includes('/jc/')) level = 'jc';
        else if (/\/p[1-6]\//.test(pathname)) level = 'primary';

        // Try to extract subject from the filename slug
        let subject = 'general';
        const filename = pathname.split('/').pop() || '';
        // Secondary/JC pattern: y2025_sec4_a_maths_prelim_SchoolName.html
        const secSubjectMatch = filename.match(/sec\d_([a-z][a-z_]+?)_(sa2|prelim|ca2|zip|paper)/i);
        // Primary pattern: p6_english_prelim_SchoolName.html
        const priSubjectMatch = filename.match(/p\d_([a-z][a-z_]+?)_(sa2|prelim|ca2|zip|paper)/i);
        // Fallback: just grab the subject-like segment
        const fallbackMatch = filename.match(/(?:sec\d|p\d|jc\d)_([a-z_]+?)_/i);

        if (secSubjectMatch) subject = secSubjectMatch[1];
        else if (priSubjectMatch) subject = priSubjectMatch[1];
        else if (fallbackMatch) subject = fallbackMatch[1];

        subject = subject.replace(/_+/g, '-').toLowerCase();

        return { level, subject, year };
    } catch {
        return null;
    }
}

async function runScraper() {
    console.log('[HARVESTER] Launching Chromium browser (headless)...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    console.log('[HARVESTER] Browser launched successfully.');

    // Purpose: Intercept network requests to block ad trackers and iframes for faster, ad-resistant scraping
    await page.route('**/*', (route: any) => {
        const url = route.request().url();
        if (
            url.includes('googleads') ||
            url.includes('doubleclick') ||
            route.request().resourceType() === 'iframe'
        ) {
            route.abort();
        } else {
            route.continue();
        }
    });

    // Purpose: Utilize a Set-backed recursive queue to traverse sub-indexes until reaching the final _pdf.html viewer pages.
    const visited = new Set<string>();
    const queue: string[] = [...SEED_URLS];
    const targetPdfPages = new Set<string>();

    // ===== BFS DISCOVERY PHASE =====
    console.log(`[HARVESTER] Starting BFS discovery from ${SEED_URLS.length} seed URLs...`);
    let crawlCount = 0;

    while (queue.length > 0 && crawlCount < MAX_PAGES_TO_CRAWL) {
        const currentUrl = queue.shift()!;

        // Normalize URL to prevent duplicate visits
        const normalizedUrl = currentUrl.replace(/\/$/, '');
        if (visited.has(normalizedUrl)) continue;
        visited.add(normalizedUrl);
        crawlCount++;

        try {
            console.log(`[HARVESTER] [BFS ${crawlCount}] Visiting: ${currentUrl}`);
            await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

            const allHrefs: string[] = await page.locator('a[href]').evaluateAll((els: any[]) =>
                els.map((a: any) => a.getAttribute('href')).filter(Boolean)
            );
            console.log(`[HARVESTER]   Found ${allHrefs.length} anchors.`);

            for (const href of allHrefs) {
                const fullUrl = href.startsWith('http') ? href : new URL(href, currentUrl).href;
                const normalizedFull = fullUrl.replace(/\/$/, '');

                if (visited.has(normalizedFull)) continue;

                // Route decision: is this a final target page or a sub-index to queue?
                if (isTargetPdfPage(fullUrl)) {
                    targetPdfPages.add(fullUrl);
                } else if (isQueueableLink(fullUrl)) {
                    queue.push(fullUrl);
                }
            }

            console.log(`[HARVESTER]   Queue: ${queue.length} | Targets: ${targetPdfPages.size} | Visited: ${visited.size}`);
        } catch (err) {
            console.error(`[HARVESTER]   Error visiting: ${currentUrl}`, err);
        }
    }

    console.log(`[HARVESTER] ===== BFS DISCOVERY COMPLETE =====`);
    console.log(`[HARVESTER]   Pages crawled: ${crawlCount}`);
    console.log(`[HARVESTER]   Target PDF pages found: ${targetPdfPages.size}`);

    // ===== HARVEST PHASE =====
    let downloadCount = 0;
    let skipCount = 0;

    for (const examUrl of Array.from(targetPdfPages)) {
        try {
            // Purpose: Extract metadata (Level, Subject, Year) directly from flat URL slugs instead of relying on DOM hierarchy.
            const meta = parseUrlMetadata(examUrl);
            if (!meta) {
                console.log(`[HARVESTER]   Skipping (no valid metadata / out of date range): ${examUrl}`);
                skipCount++;
                continue;
            }

            console.log(`[HARVESTER]   Harvesting: ${examUrl} -> ${meta.level}/${meta.subject}/${meta.year}`);

            // Purpose: Intercept raw PDF fetches from JS viewers before page navigation.
            let interceptedPdfUrl: string | null = null;
            const requestListener = (request: any) => {
                const url = request.url().toLowerCase();
                if (url.includes('.pdf') && !url.includes('.html')) {
                    interceptedPdfUrl = request.url();
                }
            };

            page.on('request', requestListener);
            await page.goto(examUrl, { waitUntil: 'networkidle', timeout: 60000 });
            // Give PDF.js an extra 2 seconds to trigger the XHR fetch
            await page.waitForTimeout(2000);
            page.off('request', requestListener);

            const dirPath = path.join(DATA_DIR, meta.level, meta.subject, meta.year);
            fs.mkdirSync(dirPath, { recursive: true });

            // Strategy 0 (Sniffer): Use the intercepted PDF URL if found
            const sniffedUrl = interceptedPdfUrl as string | null;
            if (sniffedUrl) {
                console.log(`[HARVESTER]     [SNIFFER] Intercepted network request: ${sniffedUrl}`);
                try {
                    const filename = path.basename((sniffedUrl as string).split('?')[0]);
                    const filePath = path.join(dirPath, filename);

                    if (!fs.existsSync(filePath)) {
                        const response = await page.context().request.get(sniffedUrl);
                        const buffer = await response.body();
                        fs.writeFileSync(filePath, buffer);
                        console.log(`[HARVESTER]     [SNIFFER] Saved: ${filePath}`);
                        downloadCount++;
                        await delay(12000);
                    } else {
                        console.log(`[HARVESTER]     [SNIFFER] Already exists: ${filePath}`);
                    }
                } catch (sniffErr) {
                    console.error(`[HARVESTER]     [SNIFFER] Error downloading: ${sniffedUrl}`, sniffErr);
                }
            } else {
                // Strategy 1 (Fallback): Extract the raw PDF URL from embedded viewer tags
                const pdfRelativeUrl = await page.evaluate(() => {
                    const embed = document.querySelector('embed[src*=".pdf"], iframe[src*=".pdf"]');
                    if (embed) return embed.getAttribute('src');

                    const obj = document.querySelector('object[data*=".pdf"]');
                    if (obj) return obj.getAttribute('data');

                    const hiddenLink = document.querySelector('a[href*=".pdf"]');
                    if (hiddenLink) return hiddenLink.getAttribute('href');

                    const zipLink = document.querySelector('a[href*=".zip"]');
                    if (zipLink) return zipLink.getAttribute('href');

                    return null;
                });

                if (pdfRelativeUrl) {
                    try {
                        const absolutePdfUrl = new URL(pdfRelativeUrl, page.url()).href;
                        const filename = path.basename(absolutePdfUrl.split('?')[0]);
                        const filePath = path.join(dirPath, filename);

                        if (!fs.existsSync(filePath)) {
                            console.log(`[HARVESTER]     [EMBED] Downloading: ${filename} from ${absolutePdfUrl}`);
                            const response = await page.context().request.get(absolutePdfUrl);
                            const buffer = await response.body();
                            fs.writeFileSync(filePath, buffer);
                            console.log(`[HARVESTER]     [EMBED] Saved: ${filePath}`);
                            downloadCount++;
                            await delay(12000);
                        } else {
                            console.log(`[HARVESTER]     [EMBED] Already exists: ${filePath}`);
                        }
                    } catch (embedErr) {
                        console.error(`[HARVESTER]     [EMBED] Error downloading: ${pdfRelativeUrl}`, embedErr);
                    }
                } else {
                    // Strategy 2 (Fallback): Scan ALL anchor hrefs for .pdf/.zip
                    const fileLinks: string[] = await page.locator('a[href]').evaluateAll((els: any[]) =>
                        els
                            .map((a: any) => a.getAttribute('href'))
                            .filter((href: string) => href && (/\.pdf/i.test(href) || /\.zip/i.test(href)))
                    );

                    console.log(`[HARVESTER]     [FALLBACK] Found ${fileLinks.length} direct file links.`);

                    for (const fileHref of fileLinks) {
                        try {
                            const fileUrl = fileHref.startsWith('http') ? fileHref : new URL(fileHref, page.url()).href;
                            const filename = path.basename(fileUrl.split('?')[0]);
                            const filePath = path.join(dirPath, filename);

                            if (!fs.existsSync(filePath)) {
                                console.log(`[HARVESTER]       Downloading: ${filename} -> ${dirPath}`);
                                const response = await page.context().request.get(fileUrl);
                                const buffer = await response.body();
                                fs.writeFileSync(filePath, buffer);
                                console.log(`[HARVESTER]       Saved: ${filePath}`);
                                downloadCount++;

                                await delay(12000);
                            } else {
                                console.log(`[HARVESTER]       Already exists, skipping: ${filePath}`);
                            }
                        } catch (fileErr) {
                            console.error(`[HARVESTER]       Error downloading file: ${fileHref}`, fileErr);
                            continue;
                        }
                    }
                }
            }
        } catch (examErr) {
            console.error(`[HARVESTER]   Error processing exam page: ${examUrl}`, examErr);
            continue;
        }
    }

    console.log(`[HARVESTER] ========== RUN COMPLETE ==========`);
    console.log(`[HARVESTER]   Total target pages found: ${targetPdfPages.size}`);
    console.log(`[HARVESTER]   Pages skipped (date/meta): ${skipCount}`);
    console.log(`[HARVESTER]   Files downloaded: ${downloadCount}`);
    console.log('[HARVESTER] Closing browser...');
    await browser.close();
    console.log('[HARVESTER] Browser closed.');
}

// Ensure the scraper is executed autonomously when called directly
if (require.main === module) {
    runScraper().catch((err) => {
        console.error('Fatal crash in main execution:', err);
        process.exit(1);
    });
}
