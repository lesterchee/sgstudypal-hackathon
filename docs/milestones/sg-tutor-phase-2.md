# SG Tutor Phase 2: Multimodal Chat Interface

**Date:** 2026-03-05  
**App:** `apps/sg-tutor`  
**Build Status:** ✅ ZERO TypeScript Errors

## Executive Summary

Phase 2 constructs the full Multimodal Chat Interface, local PDF serving infrastructure, and Socratic API Route with Vercel AI SDK Tool Calling for silent data extraction. Build verified clean on Next.js 14.2.35.

## Architecture

### API Routes Built

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/papers` | GET | Lists all `.pdf` files in `_data/papers/` with metadata extracted from filenames |
| `/api/papers/[filename]` | GET | Serves individual PDFs as binary with `Content-Type: application/pdf`. Path traversal guarded. |
| `/api/chat` | POST | Socratic streaming chat using Gemini 1.5 Pro + `log_student_mastery` tool calling |

### Tool Calling Architecture

The `log_student_mastery` tool is defined using the AI SDK v6 `tool()` helper with:
- **`inputSchema`**: Zod-validated `{ concept: string, mastery_level: 'low' | 'medium' | 'high' }`
- **`execute`**: Runs server-side only inside `streamText()` — the raw JSON payload never leaks into the frontend text stream
- **Response**: `toUIMessageStreamResponse()` for v6-compatible UI message streaming

### Frontend Pages

| Route | Type | Description |
|-------|------|-------------|
| `/dashboard` | Client | Dynamically lists available papers from `/api/papers`, selectable chips, PdfViewer integration |
| `/dashboard/chat` | Client | Multimodal chat with `useChat` hook, drag-and-drop image upload, violet-themed premium UI |

### Dependencies Installed
- `ai@^6.0.108` — Vercel AI SDK core
- `@ai-sdk/react` — `useChat` hook (v6 pattern: `sendMessage` with `parts`)
- `@ai-sdk/google` — Gemini 1.5 Pro provider (vision-capable)
- `zod` — Tool parameter schema validation

### Mocked Variables
- **`GOOGLE_GENERATIVE_AI_API_KEY`**: Required in `.env.local` for Gemini calls to work at runtime
- **GCP Bucket Upload**: Remains mocked from Phase 1 — local fallback storage active

## Self-Healing Log

The AI SDK v6 introduced breaking changes from earlier versions:
1. `useChat` → returns `sendMessage` (not `handleSubmit`/`input`/`handleInputChange`)
2. `UIMessage` → uses `parts` array (not `content` string or `experimental_attachments`)
3. `tool()` → requires `inputSchema` (not `parameters`)
4. `streamText` → uses `toUIMessageStreamResponse()` (not `toDataStreamResponse()`)

All type errors were autonomously resolved during build verification.

## Next Steps
- Provision `GOOGLE_GENERATIVE_AI_API_KEY` in `.env.local` for live Gemini inference
- Persist `log_student_mastery` tool output to Firestore for learning analytics
- Expand PDF serving with actual scraping targets
