/**
 * Deep-Scrape Pipeline
 * --------------------------------------------------
 * Uses Firecrawl's `scrape()` method to target exact high-value pages
 * one at a time, avoiding WAF crawl-detection blocks.
 *
 * Usage:  npm run scrape:deep
 */

import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import Firecrawl from "@mendable/firecrawl-js";

// ── Load env ──────────────────────────────────────────────────────────
const MONOREPO_ROOT = path.resolve(__dirname, "../..");
dotenv.config({ path: path.join(MONOREPO_ROOT, ".env.local") });

const apiKey = process.env.FIRECRAWL_API_KEY;
if (!apiKey) {
    console.error("❌  FIRECRAWL_API_KEY is not set in .env.local / environment.");
    process.exit(1);
}

const app = new Firecrawl({ apiKey });

// ── Target definitions ────────────────────────────────────────────────
interface ScrapeGroup {
    label: string;
    outputPath: string;
    urls: string[];
}

const groups: ScrapeGroup[] = [
    {
        label: "Enterprise Development Grant (EDG)",
        outputPath: "apps/sg-grant/knowledge/edg.md",
        urls: [
            "https://www.enterprisesg.gov.sg/financial-support/enterprise-development-grant",
            "https://www.enterprisesg.gov.sg/financial-support/enterprise-development-grant/core-capabilities",
            "https://www.enterprisesg.gov.sg/financial-support/enterprise-development-grant/innovation-and-productivity",
            "https://www.enterprisesg.gov.sg/financial-support/enterprise-development-grant/market-access",
        ],
    },
    {
        label: "Singapore Customs – Import Rules",
        outputPath: "apps/sg-import/knowledge/customs-rules.md",
        urls: [
            "https://www.customs.gov.sg/businesses/importing-goods/quick-guide-for-importers/",
            "https://www.customs.gov.sg/businesses/importing-goods/import-procedures/",
            "https://www.customs.gov.sg/businesses/valuation-duties-taxes-fees/duties-and-dutiable-goods/",
        ],
    },
];

// ── Helpers ───────────────────────────────────────────────────────────
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function writeMarkdown(filePath: string, content: string): void {
    const abs = path.resolve(MONOREPO_ROOT, filePath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, "utf-8");
    console.log(`   📄  Written → ${filePath}  (${(content.length / 1024).toFixed(1)} KB)`);
}

// ── Main pipeline ─────────────────────────────────────────────────────
async function main() {
    console.log("🔬  Deep-Scrape Pipeline (page-by-page)");
    console.log(`   Groups: ${groups.length}`);
    console.log("─".repeat(60));

    for (const group of groups) {
        console.log(`\n📂  ${group.label}`);
        const sections: string[] = [];

        for (let i = 0; i < group.urls.length; i++) {
            const url = group.urls[i];
            console.log(`   [${i + 1}/${group.urls.length}]  Scraping: ${url}`);

            try {
                const doc = await app.scrape(url, {
                    formats: ["markdown"],
                    onlyMainContent: true,
                });

                const title = doc.metadata?.title ?? `Page ${i + 1}`;
                const md = doc.markdown ?? "";

                if (md.length > 0) {
                    sections.push(`<!-- Source: ${url} -->\n# ${title}\n\n${md}`);
                    console.log(`         ✅  ${md.length} chars`);
                } else {
                    console.warn(`         ⚠️  Empty markdown returned`);
                }
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err);
                console.error(`         ❌  Failed: ${msg}`);
            }

            // Rate-limit: 2s between requests
            if (i < group.urls.length - 1) {
                await delay(2000);
            }
        }

        if (sections.length > 0) {
            const combined = sections.join("\n\n---\n\n");
            writeMarkdown(group.outputPath, combined);
        } else {
            console.warn(`   ⚠️  No content scraped for ${group.label}`);
        }
    }

    console.log("\n" + "─".repeat(60));
    console.log("✅  Deep-scrape pipeline complete.");
}

main();
