import { z } from "zod";

// Purpose: Validates and enforces the required runtime environment variables using Zod schema to ensure mandatory integrations (Gemini, Firebase, Ghost Crypto) are present.
export const envSchema = z.object({
    GEMINI_API_KEY: z.string({ message: "GEMINI_API_KEY is required and must be a string." })
        .min(30, "GEMINI_API_KEY must be at least 30 characters long."),

    GHOST_CRYPTO_KEY: z.string({ message: "GHOST_CRYPTO_KEY is required and must be a string." }),

    FIREBASE_PROJECT_ID: z.string({ message: "FIREBASE_PROJECT_ID is required and must be a string." })
        .min(5, "FIREBASE_PROJECT_ID must be at least 5 characters long."),

    FIREBASE_CLIENT_EMAIL: z.string({ message: "FIREBASE_CLIENT_EMAIL is required and must be a string." })
        .email("FIREBASE_CLIENT_EMAIL must be a valid email string."),

    FIREBASE_PRIVATE_KEY: z.string({ message: "FIREBASE_PRIVATE_KEY is required and must be a string." })
        .refine((val) => val.includes("-----BEGIN PRIVATE KEY-----"), {
            message: "FIREBASE_PRIVATE_KEY must include '-----BEGIN PRIVATE KEY-----'.",
        }),
});

export const env = envSchema.parse(process.env);
