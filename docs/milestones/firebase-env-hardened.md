# Milestone: Firebase Env Hardened

> **Date**: 2026-03-10
> **Scope**: `apps/hairspa-bot` — Firebase Client + Admin SDK initialization

## What Changed

### Client SDK (`src/lib/firebase/client.ts`)
- Added fail-loud guards for `NEXT_PUBLIC_FIREBASE_API_KEY` and `NEXT_PUBLIC_FIREBASE_PROJECT_ID` inside `getClientApp()`.
- Injected deployment verification log: prints **Project ID only**.

### Admin SDK (`src/lib/firebase/admin.ts`)
- **Refactored** from single `FIREBASE_SERVICE_ACCOUNT` JSON blob to three individual env vars:
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`
- Each var has a strict existence check that throws at runtime if missing.
- Private key is parsed with `.replace(/\\n/g, '\n')` for Vercel string compatibility.
- Deployment verification log prints **Project ID only**.

### Env Template (`.env.local.example`)
- Expanded to list all Firebase Client and Admin vars alongside existing `ALIBABA_API_KEY`.

## Adversarial EDD Results

| Check | Result |
|-------|--------|
| `console.log` leaks API keys? | ❌ No — only `PROJECT_ID` is logged |
| `console.log` leaks private key? | ❌ No — only `projectId` local var is logged |
| Private key newline parsing? | ✅ `.replace(/\\n/g, '\n')` applied |
| TS errors (`tsc --noEmit`) | ✅ Zero |
| Build (`npm run build`) | ✅ Clean |

## Vercel Action Required

Replace the old `FIREBASE_SERVICE_ACCOUNT` env var with:

```
FIREBASE_PROJECT_ID=<from service account JSON → project_id>
FIREBASE_CLIENT_EMAIL=<from service account JSON → client_email>
FIREBASE_PRIVATE_KEY=<from service account JSON → private_key>
```
