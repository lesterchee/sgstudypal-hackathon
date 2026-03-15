/**
 * Firecrawl Ingestion Pipeline
 * --------------------------------------------------
 * Crawls target government / business sites and persists the resulting
 * Markdown into each B2B app's `knowledge/` folder.
 *
 * Usage:  npm run crawl   (or  npx tsx scripts/data-pipeline/crawl.ts)
 */

import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import Firecrawl from "@mendable/firecrawl-js";

// Load .env.local from monorepo root
const MONOREPO_ROOT = path.resolve(__dirname, "../..");
dotenv.config({ path: path.join(MONOREPO_ROOT, ".env.local") });

// ── Validate env ──────────────────────────────────────────────────────
const apiKey = process.env.FIRECRAWL_API_KEY;
if (!apiKey) {
    console.error("❌  FIRECRAWL_API_KEY is not set in .env.local / environment.");
    process.exit(1);
}

// ── Initialise client ─────────────────────────────────────────────────
const app = new Firecrawl({ apiKey });

// ── Target definitions ────────────────────────────────────────────────
interface CrawlTarget {
    label: string;
    url: string;
    outputPath: string; // relative to monorepo root
}

const targets: CrawlTarget[] = [
    {
        label: "MOM Employment Pass",
        url: "https://www.mom.gov.sg/passes-and-permits/employment-pass",
        outputPath: "apps/sg-visa/knowledge/mom-ep.md",
    },
    {
        label: "Enterprise Development Grant",
        url: "https://www.gobusiness.gov.sg/enterprise-development-grant/",
        outputPath: "apps/sg-grant/knowledge/edg.md",
    },
    {
        label: "Singapore Customs – Business Rules",
        url: "https://www.customs.gov.sg/businesses/",
        outputPath: "apps/sg-import/knowledge/customs-rules.md",
    },
];

// ── Helpers ───────────────────────────────────────────────────────────
function writeMarkdown(filePath: string, content: string): void {
    const abs = path.resolve(MONOREPO_ROOT, filePath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, "utf-8");
    console.log(`   📄  Written → ${filePath}  (${(content.length / 1024).toFixed(1)} KB)`);
}

// ── Main pipeline ─────────────────────────────────────────────────────
async function main() {
    console.log("🔥  Firecrawl Ingestion Pipeline");
    console.log(`   Targets: ${targets.length}`);
    console.log("─".repeat(60));

    for (const target of targets) {
        console.log(`\n🌐  Crawling: ${target.label}`);
        console.log(`   URL: ${target.url}`);

        try {
            const result = await app.crawl(target.url, {
                limit: 50,
                scrapeOptions: {
                    formats: ["markdown"],
                    onlyMainContent: true,
                },
            });

            // CrawlJob has status and data fields
            if (result.status === "failed" || result.status === "cancelled") {
                console.error(`   ❌  Crawl ${result.status}`);
                continue;
            }

            const pages = result.data ?? [];
            console.log(`   ✅  Received ${pages.length} page(s)`);

            if (pages.length === 0) {
                console.warn(`   ⚠️  No pages returned – skipping write.`);
                continue;
            }

            // Aggregate all page markdown into a single file
            const aggregated = pages
                .map((doc, i) => {
                    const title = doc.metadata?.title ?? `Page ${i + 1}`;
                    const md = doc.markdown ?? "";
                    return `<!-- Source: ${doc.metadata?.sourceURL ?? "unknown"} -->\n# ${title}\n\n${md}`;
                })
                .join("\n\n---\n\n");

            writeMarkdown(target.outputPath, aggregated);
        } catch (err) {
            console.error(`   ❌  Exception during crawl:`, err);
        }
    }

    console.log("\n" + "─".repeat(60));
    console.log("✅  Ingestion pipeline complete.");
}

main();
