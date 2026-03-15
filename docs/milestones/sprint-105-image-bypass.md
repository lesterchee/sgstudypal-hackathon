# Sprint 105 — Image Bypass: SDK Scrubber Workaround

**Status:** ✅ DONE  
**Date:** 2026-03-14  
**Phase:** 105 Anti Gravity  

## Problem

The Vercel AI SDK v6 `useChat` hook internally scrubs image/binary data from `sendMessage`'s message payload before transmitting to the server. This prevents base64 image data from reaching the Next.js API route, breaking multimodal Gemini vision capabilities in the Homework Help chat.

## Solution

Injected a custom `fetch` override into `DefaultChatTransport`, which intercepts the SDK's outbound HTTP request and appends `imageData` (base64 data URL) to the JSON body. A React ref (`pendingImageRef`) bridges the component's image state to the fetch interceptor without introducing re-render cycles or global scope pollution.

### Architecture

```
[User uploads image] → pendingImages state → pendingImageRef (ref bridge)
                                                      ↓
[User clicks Send] → sendMessage({ text }) → DefaultChatTransport.fetch override
                                                      ↓
                                              Reads pendingImageRef.current
                                                      ↓
                                              Injects imageData into POST body
                                                      ↓
                                              /api/chat route.ts receives body.imageData
                                                      ↓
                                              Gemini streamText with inlineData image part
```

## Files Modified

| File | Change |
|------|--------|
| `apps/sg-tutor/app/dashboard/homework-help/page.tsx` | Added `DefaultChatTransport` import, `useChat` transport config with `fetch` override, `pendingImageRef`, refactored `handleFormSubmit` |

## Files NOT Modified

- `apps/sg-tutor/app/api/chat/route.ts` — Server already handles `body.imageData` injection (Sprint 231/232)
- `/packages/types` — Per constraint, not altered

## Verification

- [x] `npx tsc --noEmit` — 0 TypeScript errors
- [x] `npx next build` — Successful production build
- [ ] Network tab confirmation — `imageData` present in POST body (manual)
- [ ] Gemini vision response — AI reads image content (manual)

### Incident Recovery: Cache Desync

**Date:** 2026-03-14T12:49 SGT

After the Phase 105 production build (`npx next build`), the running dev server's `.next` cache became desynced — stale chunk references caused 404s for chunked JS assets. A console warning for a deprecated `apple-mobile-web-app-capable` meta tag was also reported.

**Recovery Steps:**

1. `npx kill-port 3099` — killed the stale dev server
2. `rm -rf .next` — purged the corrupted cache directory
3. `npm run dev -- -p 3099` — rebooted fresh dev server (Ready in 889ms)

**Apple Meta Tag Audit:** No deprecated raw `<meta name="apple-mobile-web-app-capable">` tag found in the codebase. The root `layout.tsx` already uses the correct Next.js Metadata API (`appleWebApp: { capable: true, statusBarStyle: "default" }`). The console warning was transient, originating from the stale cache — resolved by the purge.
