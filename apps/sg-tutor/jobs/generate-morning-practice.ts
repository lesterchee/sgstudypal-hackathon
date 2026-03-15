// Purpose: Nightly Trigger.dev v3 scheduled task that scans Firestore for
// low-mastery concepts, generates custom practice questions via Qwen-Plus,
// compiles them into a PDF, and saves it locally + writes metadata to Firestore.
// Cron: 0 2 * * * (2:00 AM SGT daily)

import { schedules, logger } from "@trigger.dev/sdk/v3";
import { generateText } from "ai";
import { alibaba } from "@ai-sdk/alibaba";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs/promises";
import path from "path";

// ---------------------------------------------------------------------------
// Purpose: Hardcoded fallback userId — same as in chat route and mastery API.
// FLAGGED: must be replaced with real auth before multi-user deployment.
// ---------------------------------------------------------------------------
const FALLBACK_USER_ID = "guest-p6-student";

// ---------------------------------------------------------------------------
// Purpose: Initialize Firebase Admin SDK inside the Trigger.dev worker context.
// This is duplicated from lib/firebase-admin.ts because Trigger.dev workers
// run in an isolated process and cannot import Next.js path aliases.
// ---------------------------------------------------------------------------
function getAdminDb() {
    if (getApps().length === 0) {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (serviceAccountJson) {
            const serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount;
            initializeApp({ credential: cert(serviceAccount) });
        } else {
            initializeApp({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mock-project-id",
            });
        }
    }
    return getFirestore();
}

// ---------------------------------------------------------------------------
// Purpose: Query Firestore for low-mastery concepts from the past 24 hours.
// Returns deduplicated concept names where mastery_level === "low".
// ---------------------------------------------------------------------------
async function fetchWeakConcepts(db: FirebaseFirestore.Firestore): Promise<string[]> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const snapshot = await db
        .collection("users")
        .doc(FALLBACK_USER_ID)
        .collection("sessions")
        .where("mastery_level", "==", "low")
        .where("timestamp", ">=", twentyFourHoursAgo)
        .orderBy("timestamp", "desc")
        .limit(50)
        .get();

    // Purpose: Deduplicate concepts — a student may have multiple "low" entries
    // for the same topic from repeated interactions.
    const concepts = new Set<string>();
    snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.concept) concepts.add(data.concept);
    });

    return Array.from(concepts);
}

// ---------------------------------------------------------------------------
// Purpose: Use Qwen-Plus (fast text model) to generate exactly 3 P6-level
// exam questions targeting the student's weak concepts.
// ---------------------------------------------------------------------------
async function generatePracticeQuestions(weakConcepts: string[]): Promise<string> {
    const conceptList = weakConcepts.join(", ");

    const { text } = await generateText({
        model: alibaba("qwen-plus"),
        prompt: `You are a Singapore MOE Primary 6 exam paper setter.

Generate exactly 3 Primary 6 level exam questions targeting these specific weak concepts: ${conceptList}.

Rules:
- Each question must be clearly numbered (1, 2, 3).
- Questions should match the Singapore PSLE difficulty level.
- Include a mix of short-answer and structured questions.
- Do NOT include answers or solutions.
- Use plain text formatting only — no markdown, no bold, no bullet points.
- Each question should be separated by a blank line.

Begin:`,
    });

    return text;
}

// ---------------------------------------------------------------------------
// Purpose: Compile the LLM-generated practice questions into a clean PDF
// document using pdf-lib. Returns the PDF as a Uint8Array buffer.
// ---------------------------------------------------------------------------
async function compilePdf(questionsText: string, date: string): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Purpose: Page setup constants for consistent layout.
    const pageWidth = 595.28; // A4 width in points
    const pageHeight = 841.89; // A4 height in points
    const margin = 50;
    const lineHeight = 18;
    const maxWidth = pageWidth - margin * 2;
    const fontSize = 11;
    const titleFontSize = 16;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let yPos = pageHeight - margin;

    // Purpose: Draw title header.
    page.drawText("SG Tutor — Morning Practice", {
        x: margin,
        y: yPos,
        size: titleFontSize,
        font: boldFont,
        color: rgb(0.298, 0.149, 0.851), // Purple (#4C2699)
    });
    yPos -= lineHeight * 1.5;

    page.drawText(`Date: ${date} | Level: Primary 6 | Focus: Weak Concepts`, {
        x: margin,
        y: yPos,
        size: 9,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
    });
    yPos -= lineHeight * 2;

    // Purpose: Draw a separator line.
    page.drawLine({
        start: { x: margin, y: yPos },
        end: { x: pageWidth - margin, y: yPos },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
    });
    yPos -= lineHeight * 1.5;

    // Purpose: Word-wrap and draw the questions text line by line.
    const lines = questionsText.split("\n");
    for (const rawLine of lines) {
        const line = rawLine.trim();

        // Purpose: Handle page overflow — add a new page if needed.
        if (yPos < margin + lineHeight) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            yPos = pageHeight - margin;
        }

        if (line === "") {
            yPos -= lineHeight * 0.8;
            continue;
        }

        // Purpose: Simple word wrapping by character width estimation.
        const words = line.split(" ");
        let currentLine = "";
        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const textWidth = font.widthOfTextAtSize(testLine, fontSize);
            if (textWidth > maxWidth && currentLine) {
                page.drawText(currentLine, {
                    x: margin,
                    y: yPos,
                    size: fontSize,
                    font: font,
                    color: rgb(0.1, 0.1, 0.1),
                });
                yPos -= lineHeight;
                if (yPos < margin + lineHeight) {
                    page = pdfDoc.addPage([pageWidth, pageHeight]);
                    yPos = pageHeight - margin;
                }
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) {
            page.drawText(currentLine, {
                x: margin,
                y: yPos,
                size: fontSize,
                font: font,
                color: rgb(0.1, 0.1, 0.1),
            });
            yPos -= lineHeight;
        }
    }

    return pdfDoc.save();
}

// ---------------------------------------------------------------------------
// Purpose: The main Trigger.dev scheduled task. Runs at 2:00 AM SGT daily.
// Orchestrates: Firestore query → LLM generation → PDF compilation → storage.
// ---------------------------------------------------------------------------
export const generateMorningPractice = schedules.task({
    id: "generate-morning-practice",
    // Purpose: Cron schedule — 2:00 AM Singapore time (UTC+8 = 18:00 UTC prev day).
    cron: "0 2 * * *",
    maxDuration: 120,
    run: async () => {
        const db = getAdminDb();
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        logger.info(`[Morning Practice] Starting generation for ${today}`);

        // Step 1: Query Firestore for weak concepts
        const weakConcepts = await fetchWeakConcepts(db);

        if (weakConcepts.length === 0) {
            logger.info("[Morning Practice] No low-mastery concepts found in past 24h. Skipping.");
            return { success: true, skipped: true, message: "No weak concepts detected." };
        }

        logger.info(`[Morning Practice] Found ${weakConcepts.length} weak concept(s): ${weakConcepts.join(", ")}`);

        // Step 2: Generate practice questions via Qwen-Plus
        const questionsText = await generatePracticeQuestions(weakConcepts);
        logger.info(`[Morning Practice] LLM generated ${questionsText.length} chars of questions.`);

        // Step 3: Compile into PDF
        const pdfBuffer = await compilePdf(questionsText, today);
        logger.info(`[Morning Practice] PDF compiled: ${pdfBuffer.byteLength} bytes.`);

        // Step 4: Save PDF locally
        const fileName = `morning_practice_${today}.pdf`;
        const dataDir = path.join(process.cwd(), "_data", "papers");
        await fs.mkdir(dataDir, { recursive: true });
        const filePath = path.join(dataDir, fileName);
        await fs.writeFile(filePath, pdfBuffer);
        logger.info(`[Morning Practice] PDF saved to: ${filePath}`);

        // Step 5: Write metadata to Firestore for frontend alert
        await db
            .collection("users")
            .doc(FALLBACK_USER_ID)
            .collection("practice_papers")
            .add({
                fileName,
                filePath: `/api/papers/${fileName}`,
                generatedAt: new Date().toISOString(),
                weakConcepts,
                questionCount: 3,
                source: "morning-practice-cron",
            });
        logger.info(`[Morning Practice] Metadata written to Firestore.`);

        return {
            success: true,
            fileName,
            weakConcepts,
            pdfSize: pdfBuffer.byteLength,
            message: `Generated practice paper targeting: ${weakConcepts.join(", ")}`,
        };
    },
});
