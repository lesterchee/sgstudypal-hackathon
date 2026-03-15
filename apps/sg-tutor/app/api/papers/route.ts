// Purpose: API route listing available test papers from the Firebase Storage vault.

import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const PAPERS_DIR = path.join(process.cwd(), "_data", "papers");

export async function GET() {
    try {
        await fs.mkdir(PAPERS_DIR, { recursive: true });
        const files = await fs.readdir(PAPERS_DIR);

        const pdfFiles = files
            .filter((f) => f.endsWith(".pdf"))
            .map((filename) => ({
                filename,
                url: `/api/papers/${encodeURIComponent(filename)}`,
                // Extract metadata from filename convention: SUBJECT_YEAR_SCHOOL.pdf
                subject: filename.split("_")[0] ?? "Unknown",
                year: filename.split("_")[1] ?? "Unknown",
                school: filename.split("_")[2]?.replace(".pdf", "") ?? "Unknown",
            }));

        return NextResponse.json(pdfFiles);
    } catch {
        return NextResponse.json([], { status: 200 });
    }
}
