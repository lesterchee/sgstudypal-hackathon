# SG Tutor - Apex Harvester Upgrade

**Date:** 2026-03-05
**Status:** Completed
**Scope:** `harvester.ts` Scraper Script Upgrade

## Overview
The Playwright scraper in `apps/sg-tutor/scripts/harvester.ts` has been successfully upgraded to autonomously crawl and rip primary, secondary, and JC test papers from `sgtestpaper.com`.

## Key Updates
1. **Tier Expansion & Deep-Crawler Logic**:
   - Upgraded from single-targeted scraping to an expanded universal crawler that parses `/primary`, `/secondary`, and `/jc` roots.
   - Designed continuous nesting logic traversing Tiers -> Levels -> Subjects -> Final PDF.
2. **Dynamic Taxonomy Directory Sort**:
   - The script now extracts category names directly from DOM elements (links and text) and structures directories like:
     `apps/sg-tutor/_data/papers/[Tier]/[Level]/[Subject]/[Year]/`
   - Dynamically constructs nested folders using `fs.mkdirSync(..., { recursive: true })`.
3. **Ad-Resistance Maintained**:
   - Kept Chromium network interception active, explicitly dropping traffic from `googleads`, `doubleclick`, and `iframe` origins.
4. **Resiliency & Rate Limits**:
   - Inserted rigorous `try/catch` enclosures to ensure dead or skipped links won't halt the entire day's run.
   - Enforced a hard 12-second download cooldown delay (`await delay(12000)`) universally, to bypass IP firewall constraints.
5. **Year-Based Filtering (Phase 2 — 2026-03-05)**:
   - Enforced a strict `2021–2025` integer check on extracted year values. Papers outside this range (or with unparseable years) are skipped with a logged message.
   - Constants `VALID_YEAR_MIN` / `VALID_YEAR_MAX` govern the range for easy future adjustment.
6. **Enhanced Telemetry Logging (Phase 2)**:
   - Injected `[HARVESTER]` prefixed `console.log()` at every major execution milestone: browser launch, tier navigation, level/subject link counts, per-subject PDF counts, download actions, skip actions, and browser close.
   - Enables full diagnosis of silent execution failures without attaching a debugger.
7. **Visual Debugging Toggle (Phase 3 — 2026-03-05)**:
   - Temporarily disabled `headless: true` mode in Playwright to enable visual Adversarial EDD.
   - This facilitates diagnosing potential Cloudflare bot-protection blocks or dynamic selector changes causing 0 links to be found.
8. **Execution Pause for DOM Inspection (Phase 3b — 2026-03-05)**:
   - Injected `await page.pause()` immediately after tier navigation to freeze the browser for manual DOM and Cloudflare inspection via the Playwright Inspector.
9. **Resilient Regex DOM Locators (Phase 4 — 2026-03-05)**:
   - Removed all `$$eval` CSS-selector-based extraction. Replaced with `page.locator('a[href]').evaluateAll()` + regex filtering.
   - Tier→Level extraction now uses tier-specific regex patterns (e.g., `/^\\/primary\\/(p[1-6]|primary-[1-6])/i`).
   - Subject and PDF link extraction uses prefix-matching and regex `.pdf`/`down` tests respectively.
   - Added diagnostic `Sample hrefs` console dumps when 0 links are found for faster debugging.
   - Reverted `headless` back to `true` and removed `page.pause()`.
10. **Regex Calibration from Telemetry (Phase 5 — 2026-03-05)**:
    - Rewrote level-extraction regex to handle absolute URLs revealed by telemetry dumps.
    - Primary: matches `sgtestpaper.com/p[1-6]/` (root-level flat routing).
    - Secondary: matches `/secondary/exam_YYYY/` year-based subfolder pattern.
    - JC: matches `/jc/` subpaths.
    - Added robust `URL` parsing for `levelName` extraction from absolute hrefs.
11. **Flat Spider Architecture Pivot (Phase 6 — 2026-03-05)**:
    - **Complete rewrite** — removed the nested `Tier -> Level -> Subject` drill-down loops entirely.
    - New 3-phase architecture: **(1)** Seed discovery from `/primary`, `/secondary`, `/jc`, **(2)** Index page crawl to find exam pages, **(3)** Flat harvest loop with per-file download.
    - Metadata (`level`, `subject`, `year`) is now extracted purely from URL slugs via `parseUrlMetadata()` regex parser — no DOM hierarchy dependency.
    - `2021–2025` year filter is enforced inside `parseUrlMetadata()` before any navigation occurs.
    - Downloads both `.pdf` and `.zip` files. Run-summary stats printed at completion.
12. **Download Event Interceptor (Phase 7 — 2026-03-05)**:
    - Replaced static href extraction with a dual-strategy download approach.
    - **Strategy 1 (Primary):** Clicks `text="Download button"` locator and intercepts via `page.waitForEvent('download')`, then saves via `download.saveAs()`.
    - **Strategy 2 (Fallback):** Extracts direct `.pdf`/`.zip` hrefs from the DOM if the click interaction fails or times out.
    - Both strategies wrapped in `try/catch` to ensure the 30-hour marathon loop never crashes on a single malformed page.
13. **Iframe Traversal for Download Interception (Phase 8 — 2026-03-05)**:
    - Added `page.frames().find()` to detect embedded file-host iframes (matching `digi`, `drive`, `file` in URL, or frames with child frames).
    - 3-tier download resolution: **(1)** `text="Download button"` inside iframe, **(1b)** generic `button:has-text("Download"), a:has-text("Download")` inside iframe, **(2)** direct `.pdf`/`.zip` href fallback from main page.
    - Frame URL is logged for diagnosis on each exam page.
14. **Direct Embed Src Extraction & Buffer Streaming (Phase 9 — 2026-03-05)**:
    - Ripped out all click-based download interceptor logic (Strategy 1, 1b, iframe traversal).
    - **New Strategy 1:** `page.evaluate()` scans for `<embed src=".pdf">`, `<iframe src=".pdf">`, `<object data=".pdf">`, and falls back to `<a href=".pdf">` / `<a href=".zip">`.
    - Downloads via `page.context().request.get(absoluteUrl)` → `response.body()` → `fs.writeFileSync()`.
    - **Fallback:** Loosened anchor href regex (no `$` anchor) to catch `.pdf` and `.zip` anywhere in href.
15. **Recursive BFS Queue Architecture (Phase 10 — 2026-03-05)**:
    - Replaced the 3-phase crawl (Seed → Index → Exam) with a `Set`-backed BFS queue starting from 3 seed URLs.
    - `isQueueableLink()` routes internal exam-related links back into the queue; `isTargetPdfPage()` routes final `_pdf.html`, `_zip.html`, and school-specific pages to the harvest set.
    - Safety cap of 500 pages to prevent runaway crawls. URL normalization via trailing-slash stripping.
    - Harvest phase unchanged: `parseUrlMetadata()` → embed src extraction → buffer streaming.
16. **Uncapped BFS for Production (Phase 11 — 2026-03-05)**:
    - Raised `MAX_PAGES_TO_CRAWL` from `500` to `50000` for full-scale site traversal.
17. **Network Sniffer & Date Expansion (Phase 12 — 2026-03-05)**:
    - Expanded `VALID_YEAR_MIN` from `2021` to `2020` to include 2020 exam papers.
    - Injected passive `page.on('request')` listener before `page.goto()` (with `networkidle` wait + 2s timeout) to intercept PDF.js XHR fetches.
    - New 3-tier download priority: **(0)** Sniffed network URL → **(1)** Embed/iframe/object src extraction → **(2)** Direct anchor href fallback.
18. **Vault Audit Script (Phase 13 — 2026-03-06)**:
    - Created `apps/sg-tutor/scripts/audit.ts` to autonomously traverse `_data/papers`, calculating total PDF count and cumulative vault size in MB.
19. **Cryptographic Deduplicator (Phase 14 — 2026-03-06)**:
    - Created `apps/sg-tutor/scripts/dedupe.ts` using SHA-256 hashing to detect and `fs.unlinkSync()` exact byte-for-byte PDF duplicates.
    - Execution result: **1 duplicate terminated** (`SCIENCE_2024_TaoNan.pdf`), **0.01 MB reclaimed**. Clean vault: **479 unique PDFs / 619.38 MB**.

**Next Steps:**
- Await manual activation of the scraper when bandwidth allocation is ready. Do not execute prior to infrastructure clearance.
