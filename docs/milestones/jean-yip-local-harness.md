# Milestone: Jean Yip Local Harness — DashScope via OpenAI-Compatible Endpoint

> **Date**: 2026-03-04T19:46+08:00
> **Workspace**: `apps/hairspa-bot`
> **Status**: ✅ GREEN — Build passes, zero TS errors

---

## Incident Log

### What Changed

| Step | Action | Outcome |
|------|--------|---------|
| 1. Dependency Install | `npm install ai @ai-sdk/openai -w hairspa-bot` | `@ai-sdk/openai@^3.0.39`, `ai` bumped to `^6.0.108` |
| 2. Env Config | Created `apps/hairspa-bot/.env.local` | `DASHSCOPE_API_KEY` injected |
| 3. API Route | Overwrote `src/app/api/chat/route.ts` | `createOpenAI` → DashScope `baseURL`, model `qwen-max`, full XML system prompt, `toUIMessageStreamResponse()` |
| 4. Frontend UI | Overwrote `src/app/page.tsx` | Raw `useChat` from `@ai-sdk/react`, v6 API (`sendMessage`, `status`, `parts`), Tailwind chat bubbles |
| 5. Build | `npx turbo run build --filter=hairspa-bot` | ✅ 0 TS errors, 3/3 tasks successful |

### Key Technical Decisions

1. **`@ai-sdk/openai` over `@ai-sdk/alibaba`**: The user requested the OpenAI-compatible DashScope endpoint (`dashscope-intl.aliyuncs.com/compatible-mode/v1`). `createOpenAI` with a custom `baseURL` is the canonical approach.

2. **AI SDK v6 API Migration**: The `ai@^6.0.108` and `@ai-sdk/react` packages have a fundamentally different `useChat` API compared to v3/v4:
   - `sendMessage({ text })` replaces `handleSubmit` + controlled `input`
   - `status` (`ready | submitted | streaming | error`) replaces `isLoading`
   - `message.parts` (array of `TextUIPart`) replaces `message.content`
   - `toUIMessageStreamResponse()` replaces `toTextStreamResponse()`

3. **Uncontrolled Input Pattern**: Since v6 `useChat` no longer provides `input`/`handleInputChange`, we use `form.elements.namedItem()` with manual reset — simpler and avoids unnecessary re-renders.

### System Prompt

Full XML SPIN-framework prompt with 4 Universal Laws:
- Offer Integrity & Boundaries
- Safety, Empathy & De-escalation
- Objection Handling
- Communication & Identity Control

Critical directive: auto-close with Stripe link after Name + Phone + Outlet collected, or after 8 turns.

### Files Modified

- `apps/hairspa-bot/package.json` — added `@ai-sdk/openai`
- `apps/hairspa-bot/.env.local` — `DASHSCOPE_API_KEY`
- `apps/hairspa-bot/src/app/api/chat/route.ts` — full rewrite
- `apps/hairspa-bot/src/app/page.tsx` — full rewrite

---

## Debugging Report: 401 `invalid_api_key` from DashScope

> **Date**: 2026-03-04T20:20+08:00
> **Severity**: P1 — Complete AI endpoint failure
> **Resolution**: ✅ Fixed

### Root Cause

The `turbo.json` pipeline configuration had **no `globalEnv` array**. When Turborepo spawns the `dev` or `build` task for `hairspa-bot`, it does not automatically inherit all parent process environment variables — only those explicitly declared in `globalEnv` (or per-task `env`) are passed through. As a result, `process.env.DASHSCOPE_API_KEY` resolved to `undefined` inside the Next.js runtime, and the `createOpenAI` provider sent an empty string as the API key to the DashScope endpoint, triggering the `401 invalid_api_key` response.

### What Was Fixed

| File | Change | Purpose |
|------|--------|---------|
| `turbo.json` | Added `"globalEnv": ["DASHSCOPE_API_KEY"]` | Ensures Turborepo passes the key to all workspace tasks |
| `src/app/api/chat/route.ts` | Added `console.log("DIAGNOSTIC - Key loaded in memory:", !!process.env.DASHSCOPE_API_KEY)` | Server-side proof that the key is present at runtime (logs `true`/`false`, never the actual key) |

### What Was Verified

- `.env.local` is correctly placed at `apps/hairspa-bot/.env.local` (not the Turborepo root)
- `createOpenAI` provider already had explicit `apiKey: process.env.DASHSCOPE_API_KEY ?? ""` — no change needed
- `baseURL` correctly points to `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` (international endpoint)
- `npx turbo run build --filter=hairspa-bot` — **0 TS errors**, 3/3 tasks successful, exit code 0
- Build output confirms: `Environments: .env.local` — Next.js is loading the env file

### Lesson Learned

Turborepo's environment variable isolation is a silent killer. An API key can be physically present in `.env.local` and correctly referenced in code, but if Turborepo's pipeline config doesn't know about it, the variable never reaches the runtime. Always declare server-side secrets in `turbo.json` `globalEnv`.

