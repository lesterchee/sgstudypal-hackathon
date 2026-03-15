// Purpose: Route multimodal student queries to Google Gemini for native
// vision + Socratic tutoring with silent mastery extraction.
// Sprint 200: Consolidated from Qwen-VL-Max → native Gemini multimodal.
// The custom OCR pipeline is eliminated — Gemini natively processes
// image parts alongside text, removing the dual-model handoff overhead.

import { streamText, tool, zodSchema, stepCountIs, convertToModelMessages } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";



// Purpose: Sprint 107 — Shift from strict Socratic gatekeeping to a high-value
// "Worked Example" + "Pitfall Analysis" methodology.
const BASE_SYSTEM_PROMPT = `<role>You are an elite Singapore MOE Primary School Teacher with deep expertise in Primary 6 Mathematics and Science.</role>

<methodology>
You are an Elite Coach providing "Worked Examples." When the student asks for help solving a problem, follow this exact structure:

1. THE BREAKDOWN: Provide the complete, step-by-step logic to solve the problem. If it is a Singapore Primary 6 math problem, you MUST use the "Model Method" or unit/ratio logic (e.g., "Since the sold amounts are equal, we must make the numerators of the sold fractions the same").
2. THE FINAL ANSWER: Clearly state the final numerical or fractional answer.
3. THE COMMON PITFALL: Create a section titled "⚠️ Common PSLE Trap:". Identify the exact conceptual mistake most students make when trying to solve this specific type of problem, and explain why your breakdown avoids it.
</methodology>

<personality>
- Encouraging, warm, and academically rigorous (Warm Demander).
- Uses simple, age-appropriate language for Primary 6 students.
- Keeps the breakdown highly structured and easy to read.
</personality>

<moe_setter_persona>
When asked to GENERATE a practice question, you become an elite Singapore MOE Primary School Math setter. You MUST adhere to the following PSLE standards:

1. DIFFICULTY: Questions must be multi-step word problems requiring heuristics (e.g., working backwards, guess and check, making a systematic list) or the Model Method. Do NOT generate simple, single-step equations.
2. CONTEXT: Use localized Singaporean contexts (e.g., MRT trains, buying items at NTUC FairPrice, selling durians at a Geylang stall, queuing for chicken rice at a hawker centre).
3. SOLUTION FORMAT: When explaining the solution, you MUST break it down using the "Model Method" logic (e.g., "1 unit = X, 3 units = Y"). Draw clear bar-model reasoning in text form.
4. PAPER CLONING: If the user provides a reference question, clone its exact mathematical mechanics and difficulty level, but change the scenario and numbers entirely. Preserve the number of steps and heuristic type.
</moe_setter_persona>

<multimodal_image_directive>
When you receive an image, analyze the math or science question visible in the image.
Type out the question you see, then end your response with exactly this phrase: 'Is my understanding of the question correct?'
</multimodal_image_directive>`;



// Purpose: Sprint 221 — Text-only Homework Help persona. Image upload is
// disabled (Phase 180 WIP lockdown). This prompt waits for the student to
// type their question and guides them with Socratic methodology.
const HOMEWORK_IMAGE_PROMPT = `You are Auntie, a supportive and sharp Singaporean AI tutor for SgStudyPal. The user will type their homework questions to you. Guide them step-by-step using the Socratic method. Do NOT pretend to see an uploaded image. Do NOT make up questions. Wait for the user to provide the problem, and then help them solve it. Use a warm, encouraging Singaporean tone.`;

// Purpose: Sprint 102/111/124 — Build a dynamic system prompt. Quizmaster route gets
// conditional branching (Path A/B) + hyper-personalization + persona; Homework Help gets base + follow-up rule.
function buildSystemPrompt(subject?: string, topicName?: string, studentInterests?: string, tutorPersona?: string): string {
    if (subject && topicName) {
        // Purpose: Sprint 111 — Inject student interest context for personalized question scenarios.
        const interestContext = studentInterests
            ? `\nHYPER-PERSONALIZATION: Frequently base the scenario of your new question around the student's interests: [${studentInterests}]. Mix this naturally with standard contexts.`
            : "";
        // Purpose: Sprint 124 — Inject dynamic persona traits based on user settings.
        let personaContext = "\nPERSONA_OVERRIDE: You are an enthusiastic, highly encouraging tutor. Use emojis and hype the student up when they do well.";
        if (tutorPersona === "Roast Me") {
            personaContext = "\nPERSONA_OVERRIDE: You are a sarcastic but loving Asian uncle. If the student gets a question wrong, gently and hilariously roast them about studying harder or drinking chicken essence before you explain the correct answer. Still be helpful, but be funny and sarcastic.";
        }
        // Purpose: Sprint 102 — Quizmaster with Path A (correct → advance)
        // and Path B (incorrect → scaffold). Prevents abandoning unsolved questions.
        return `<quizmaster_directive>
You are a strict but highly energetic Quizmaster testing the student on ${subject} - ${topicName}. 

PERSONA:
Act like an e-Sports announcer. Use enthusiastic gaming terminology (e.g., "BOOM! 🎯", "Level Up! 🌟"). Keep it fun and fast-paced.

STREAK MECHANIC:
Analyze the chat history. If the student answers 2 or 3 questions correctly in a row, trigger a massive combo celebration.

CRITICAL RULES:
1. NEVER put multiple-choice options (A, B, C, D) in the body of your text. 
2. CHAIN OF THOUGHT GRADING: Silently calculate the math step-by-step first. Only AFTER calculating are you allowed to state your gamified "Correct!" or "Incorrect!" response.
3. QUESTION GENERATION CoT: You MUST solve any math you present inside a <scratchpad> ... </scratchpad> block before outputting suggestions.
4. NO LATEX FORMATTING: You must strictly use plain text for all math and fractions. Write "3/5" or "2/3". Do NOT use LaTeX formatting or math blocks.

For the VERY FIRST question, just ask the question. Then do your <scratchpad> math. Then output exactly 3 options in the ###SUGGESTIONS### block.

For ALL SUBSEQUENT turns, evaluate their answer first, then CHOOSE ONE of the following paths:

PATH A: IF THE STUDENT IS CORRECT
1. Give a gamified "Correct!" celebration.
2. Briefly explain the solution.
3. Insert this exact delimiter: ###NEXT_QUESTION###
4. Ask a brand NEW question.
5. Solve your NEW question inside a <scratchpad> block.
6. Append exactly 3 options for the NEW question using this format:
###SUGGESTIONS###
1. [First option]
2. [Second option]
3. [Third option]

PATH B: IF THE STUDENT IS INCORRECT
1. Give an encouraging "Incorrect" response.
2. Break down the current problem. Ask a smaller scaffolding/guiding question to help them find the right answer.
3. DO NOT insert the ###NEXT_QUESTION### delimiter. DO NOT ask a new problem. Stay on the current problem.
4. Solve your scaffolding question inside a <scratchpad> block.
5. Append exactly 3 options for your scaffolding question using the ###SUGGESTIONS### format.
</quizmaster_directive>
${interestContext}
${personaContext}
${BASE_SYSTEM_PROMPT}`;
    }
    // Purpose: Homework Help route gets the base prompt plus the follow-up questions.
    return BASE_SYSTEM_PROMPT;
}

// Purpose: Zod v4 schema for the mastery logging tool input, wrapped with
// zodSchema() for AI SDK v6 FlexibleSchema<T> type compatibility.
const masteryInputSchema = zodSchema(
    z.object({
        concept: z
            .string()
            .describe(
                "The mathematical or scientific concept being assessed, e.g. 'fractions', 'speed-distance-time', 'photosynthesis'"
            ),
        mastery_level: z
            .enum(["low", "medium", "high"])
            .describe("The student's assessed mastery level on this concept"),
    })
);

// Purpose: POST handler — streams natively multimodal Socratic responses from
// Google Gemini. Images sent by the client are handled directly by the Gemini
// provider without any intermediate OCR pipeline.
export async function POST(req: Request) {
    // Purpose: Sprint 134 — Extract verified user ID from the middleware state handoff. Reject if missing.
    const userId = req.headers.get('x-user-id');
    if (!userId) {
        return new Response(JSON.stringify({ error: "Unauthorized: Missing user ID at network boundary" }), { status: 401 });
    }

    try {
        const body = await req.json();
        const { messages, topicId, subject, topicName, studentInterests, tutorPersona } = body;

        // Purpose: Sprint 231 — Extract side-channeled image data from the
        // request body. The frontend passes base64 data URL through
        // sendMessage's options.body.imageData, bypassing the SDK's message
        // scrubber that strips parts/files/experimental_attachments.
        const imageData: string | undefined = body.imageData;
        const hasImage = !!imageData;

        // Purpose: Sprint 221 — Dynamic system prompt routing. When the student
        // uploads an image, we drop the MOE Setter persona (which hallucinates
        // new scenarios) and inject a strict homework analysis directive instead.
        let systemPrompt: string;
        if (hasImage && !subject && !topicName) {
            // Purpose: Image-present + Homework Help route — strict analysis only.
            systemPrompt = HOMEWORK_IMAGE_PROMPT;
        } else {
            // Purpose: Text-only or Quizmaster route — full persona stack.
            systemPrompt = buildSystemPrompt(subject, topicName, studentInterests, tutorPersona);
        }

        // Purpose: Sprint 209 — Convert raw UIMessages from the client into
        // strict ModelMessage[] before passing to streamText. This sanitizes
        // file parts, text parts, and tool invocations into the exact schema
        // that Gemini expects, preventing Zod invalid_union validation crashes.
        const coreMessages = await convertToModelMessages(messages);

        // Purpose: [DISABLED Phase 180] Multimodal image injection reverted to
        // stabilize demo. Re-enable once Buffer/mimeType serialization is validated
        // against the @ai-sdk/google provider's internal schema.
        // if (imageData) {
        //     const lastCoreMessage = coreMessages[coreMessages.length - 1];
        //     if (lastCoreMessage && lastCoreMessage.role === "user") {
        //         if (typeof lastCoreMessage.content === 'string') {
        //             (lastCoreMessage as any).content = [
        //                 { type: 'text', text: lastCoreMessage.content }
        //             ];
        //         }
        //         const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
        //         const mimeTypeMatch = imageData.match(/data:(.*?);/);
        //         const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
        //         (lastCoreMessage.content as any[]).push({
        //             type: "image",
        //             image: Buffer.from(base64Data, 'base64'),
        //             mimeType: mimeType,
        //         });
        //         console.log("[IMAGE INJECT] Buffer injected");
        //     }
        // }

        // Purpose: Sprint 115 — Intercept hidden UI directives from the side-channel.
        // The frontend passes natural user text for the chat bubble, while strict
        // AI commands (e.g., ###NEXT_QUESTION###) are routed here and silently
        // appended to the last user message so Gemini executes them.
        const hiddenDirective: string | undefined = body.hiddenDirective;
        if (hiddenDirective) {
            const lastCoreMessage = coreMessages[coreMessages.length - 1];
            if (lastCoreMessage && lastCoreMessage.role === "user") {
                if (typeof lastCoreMessage.content === "string") {
                    (lastCoreMessage as any).content += `\n\n[SYSTEM DIRECTIVE: ${hiddenDirective}]`;
                } else if (Array.isArray(lastCoreMessage.content)) {
                    (lastCoreMessage.content as any[]).push({
                        type: "text",
                        text: `\n\n[SYSTEM DIRECTIVE: ${hiddenDirective}]`,
                    });
                }
                console.log("[DIRECTIVE INJECT] Successfully injected hidden system directive");
            }
        }

        // Purpose: X-RAY — truncated log to verify payload structure.
        console.log("X-RAY LAST CORE MESSAGE:", JSON.stringify(coreMessages[coreMessages.length - 1], null, 2).slice(0, 500));

        // Purpose: Native multimodal routing directly to Gemini. The AI SDK's
        // Google provider natively handles image parts in the messages array,
        // converting them to inlineData for the Gemini API. This eliminates
        // the need for a separate OCR pipeline — Gemini sees the image AND
        // responds as a Socratic tutor in a single inference call.
        const result = streamText({
            model: google("gemini-2.5-flash"),
            system: systemPrompt,
            messages: coreMessages,
            // Purpose: Allow up to 5 steps so the LLM can call log_student_mastery
            // and still produce a text response to the student.
            stopWhen: stepCountIs(5),
            tools: {
                // Purpose: Silent tool that logs the student's assessed mastery
                // level on a concept. Persists to Firestore subcollection
                // users/{userId}/sessions using fire-and-forget pattern.
                log_student_mastery: tool({
                    description:
                        "Silently log the student's mastery level on a concept. " +
                        "Call this tool whenever you can assess the student's understanding " +
                        "from their response. This data is used for learning analytics.",
                    inputSchema: masteryInputSchema,
                    execute: async ({ concept, mastery_level }) => {
                        console.log(
                            `[MASTERY LOG] Concept: ${concept} | Level: ${mastery_level} | Timestamp: ${new Date().toISOString()}`
                        );

                        // Purpose: Fire-and-forget Firestore write scoped to the authenticated user.
                        adminDb
                            .collection("users")
                            .doc(userId)
                            .collection("sessions")
                            .add({
                                concept,
                                mastery_level,
                                timestamp: new Date().toISOString(),
                                source: "sg-tutor-socratic",
                                ...(topicId ? { topicId } : {}),
                            })
                            .catch((err: any) => {
                                console.error("[FIRESTORE WRITE ERROR]", err.message);
                            });

                        return { logged: true, concept, mastery_level };
                    },
                }),
            },
        });

        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error("CHAT ROUTE ERROR:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
