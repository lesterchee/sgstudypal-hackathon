// Purpose: API route for serving individual paper PDFs from Firebase Storage by filename.

import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const PAPERS_DIR = path.join(process.cwd(), "_data", "papers");

export async function GET(
    _request: NextRequest,
    { params }: { params: { filename: string } }
) {
    const { filename } = params;

    // Guard against path traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
        return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const filePath = path.join(PAPERS_DIR, filename);

    try {
        const fileBuffer = await fs.readFile(filePath);

        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="${filename}"`,
                "Cache-Control": "public, max-age=3600",
            },
        });
    } catch {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
}
