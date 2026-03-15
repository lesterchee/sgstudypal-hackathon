# Milestone: LiveTutorCanvas — Hackathon Infrastructure

**Sprint:** 142–164  
**Date:** 2026-03-12  
**Status:** ✅ Complete

## Summary

Full real-time AI tutoring infrastructure in `apps/sg-tutor`: WebRTC media capture, Gemini Multimodal Live WebSocket state machine, full-screen LiveTutorCanvas UI, client-side media encoding, authenticated token handoff, setup payload with MOE P6 Math tutor persona, and AI tool calling for gamification/CRM. Navigational clutter pruned for the Hackathon demo, and a fast-track Devpost Judge login bypass was added to the auth flow to eliminate onboarding friction.

## Architecture Decision: WebSocket Security

**Solution (Sprint 151):** Authenticated `/api/live/token` Route Handler — protected by Edge middleware. Server constructs `wss://` URL with `GEMINI_API_KEY`, returns it with a 5-minute expiry.

## Architecture Decision: Media Encoding Pipeline

**Video:** Offscreen `<canvas>` → JPEG (0.5 quality, 512px) at 1 FPS.  
**Audio:** `AudioContext(16kHz)` → Float32 → Int16 PCM → Base64.  
**Sequencing (Sprint 155):** Media pipelines deferred until `setupComplete` acknowledgment from Gemini.

## Architecture Decision: Setup Payload & Tool Calling

**Setup (Sprint 154):** `generateSetupMessage()` sends system instruction (MOE P6 Math Socratic tutor), Aoede voice, and two tool schemas on `ws.onopen`.

**Tools:**
- `submit_answer_and_attack` — triggered when student gives correct answer (gamification)
- `log_student_progress` — logs topic, breakthrough/struggle status, intervention (CRM)

**Handler (Sprint 156):** `onmessage` detects `serverContent.modelTurn.parts[].functionCall`, routes to registered callback or fallback switch.

## Files

| File | Purpose |
|------|---------|
| `hooks/useMediaDevices.ts` | WebRTC camera/mic hook |
| `hooks/useGeminiLive.ts` | WebSocket + media + setup + tool calls |
| `app/api/live/token/route.ts` | Authenticated token route (401 Rule) |
| `components/LiveTutorCanvas.tsx` | Full-screen `h-[100dvh]` UI |
| `app/live/page.tsx` | Page wrapper with `force-dynamic` |
| `lib/media/videoEncoder.ts` | Canvas → JPEG → Base64 |
| `lib/media/audioEncoder.ts` | AudioContext → PCM16 → Base64 |
| `lib/ai/liveSessionSetup.ts` | Setup payload + tool schemas |
| `middleware.ts` | Extended matcher: `'/api/live/:path*'` |
| `Sidebar.tsx` & `layout.tsx` | UI nav pruned for hackathon demo |
| `app/login/page.tsx` | Devpost Judge login bypass added |

## Verification

- `npx tsc --noEmit` — ✅ 0 errors
- `npm run build` — ✅ Exit code 0, `/live` at 5.46 kB

## Remaining Backlog

- [ ] Server-side WebSocket proxy (full API key isolation)
- [ ] Gemini response rendering (text + audio playback)
- [ ] AudioWorklet migration (replace deprecated ScriptProcessorNode)
- [ ] Wire tool calls to UI gamification and Firestore CRM logging
