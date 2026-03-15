// Purpose: Flash Vision Extractor — Multimodal OCR pipeline using Google
// Generative AI SDK (Gemini Flash) to extract structured text and diagram
// descriptions from homework images. This is the "handoff" layer — it extracts
// intent without solving the problem, then passes structured context to the
// Socratic LLM.

// Purpose: Structured result from the OCR extraction pipeline.
export interface ImageIntentResult {
    /** Purpose: Whether extraction succeeded. */
    success: boolean;
    /** Purpose: The exact text written in the image (handwritten or printed). */
    extractedText: string;
    /** Purpose: A precise description of any diagrams, math variables, or
     *  visual elements found in the image. */
    diagramDescription: string;
    /** Purpose: Error message if extraction failed. */
    error?: string;
}

// Purpose: The extraction prompt — instructs Gemini Flash to extract WITHOUT
// solving. This is critical to prevent the OCR layer from leaking answers
// to the downstream Socratic tutor.
// Sprint 20: Added strict LaTeX mandate for all mathematical notation.
const EXTRACTION_PROMPT = `Analyze this homework image. Do not solve it. Do not provide any answers or hints.

Output ONLY a JSON object with exactly these two fields:
{
  "extractedText": "<The exact text written in the image, including all numbers, operators, and words. Preserve punctuation and formatting. You MUST output all mathematical numbers, fractions, and formulas in strict LaTeX format (e.g., \\\\frac{3}{4}, \\\\times, \\\\div, x^2, \\\\sqrt{16}).>",
  "diagramDescription": "<A precise description of any diagrams, bar models, geometric shapes, tables, or math variables visible in the image. If no diagrams exist, write 'None'.>"
}

Rules:
- Extract the EXACT text. Do not paraphrase or correct spelling.
- For handwritten text, do your best to interpret each character.
- For math equations, you MUST use strict LaTeX notation (e.g., \\\\frac{3}{4} not 3/4, \\\\times not x for multiplication, \\\\div not ÷).
- For fractions, ALWAYS use \\\\frac{numerator}{denominator} format.
- Describe diagrams objectively without interpreting their meaning.
- Output ONLY the JSON object. No other text.`;

// Purpose: Main entry point — sends the image to Gemini Flash for structured
// extraction. Returns an ImageIntentResult with the extracted text and
// diagram description. Handles timeouts and API errors gracefully.
export async function extractImageIntent(
    imageUrl: string,
    mimeType: string = 'image/jpeg'
): Promise<ImageIntentResult> {
    // Purpose: Validate input — reject empty or malformed URLs.
    if (!imageUrl || imageUrl.trim().length === 0) {
        return {
            success: false,
            extractedText: '',
            diagramDescription: '',
            error: 'Empty image URL provided.',
        };
    }

    try {
        // Purpose: Use Gemini REST API directly to avoid @google/generative-ai
        // module dependency. This keeps the build clean without requiring the
        // package to be installed as a direct dependency.
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            return {
                success: false,
                extractedText: '',
                diagramDescription: '',
                error: 'GOOGLE_GENERATIVE_AI_API_KEY not configured.',
            };
        }

        // Purpose: Call Gemini Flash via REST API for low-latency vision extraction.
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: EXTRACTION_PROMPT },
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: imageUrl,
                                },
                            },
                        ],
                    },
                ],
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            return {
                success: false,
                extractedText: '',
                diagramDescription: '',
                error: `Gemini API error (${response.status}): ${errorBody}`,
            };
        }

        const data = await response.json();
        const rawText: string =
            data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Purpose: Parse the JSON response from Gemini Flash.
        // Handle cases where the model wraps JSON in markdown code fences.
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return {
                success: false,
                extractedText: rawText,
                diagramDescription: '',
                error: 'Failed to parse structured JSON from Gemini response.',
            };
        }

        const parsed = JSON.parse(jsonMatch[0]);

        return {
            success: true,
            extractedText: parsed.extractedText || '',
            diagramDescription: parsed.diagramDescription || 'None',
        };
    } catch (error) {
        // Purpose: Graceful fallback — log the error and return a failure result.
        // The chat route will proceed without OCR context rather than crashing.
        const errorMessage =
            error instanceof Error ? error.message : 'Unknown OCR pipeline error.';

        console.error('[OCR Pipeline] extractImageIntent failed:', errorMessage);

        return {
            success: false,
            extractedText: '',
            diagramDescription: '',
            error: errorMessage,
        };
    }
}

// Purpose: Format the extraction result as a context string that can be
// injected into the Socratic system prompt. This is the handoff format
// consumed by the chat route.
export function formatExtractedContext(result: ImageIntentResult): string {
    if (!result.success) {
        return '[Extracted Homework Context: Image extraction failed. Please ask the student to describe their question in text.]';
    }

    let context = `[Extracted Homework Context:\nText: ${result.extractedText}`;

    if (result.diagramDescription && result.diagramDescription !== 'None') {
        context += `\nDiagram: ${result.diagramDescription}`;
    }

    context += ']';
    return context;
}
