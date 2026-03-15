# Chat State Bridge — Audit Report

**Date:** 2026-03-13
**Status:** ✅ No Fix Required — Pipeline Already Wired

## Audit Findings

The `botId` state bridge from the public Chat Widget to the LLM API route is **fully functional**. No code changes were needed.

### Pipeline Flow

| Stage | File | Mechanism |
|-------|------|-----------|
| **1. URL Capture** | `app/page.tsx:71-72` | `useSearchParams().get("botId")` reads from `/?botId=xxx` |
| **2. Transport Injection** | `app/page.tsx:75-83` | `DefaultChatTransport({ api: /api/chat?botId=... })` passes botId as a URL query param on every chat request |
| **3. Backend Extraction** | `api/chat/route.ts:163-164` | `url.searchParams.get("botId")` extracts from incoming request URL |
| **4. Firestore Fetch** | `api/chat/route.ts:191-233` | Uses `botId` to fetch `bots/{botId}` doc. Falls back to `FALLBACK_CONFIG` on error, returns `404` if doc missing |
| **5. Prompt Build** | `api/chat/route.ts:271` | `buildSystemPrompt(config)` uses fetched merchant config |

### Defense in Depth (Already Present)
- **Missing botId:** Falls back to fetching the first document in the `bots` collection (MVP mode).
- **Invalid botId:** Returns `404 Bot not found` gracefully.
- **Firebase failure:** Catches errors and falls back to `FALLBACK_CONFIG` defaults.
- **Subscription check:** Blocks chat with `403` if `isActive === false`.
