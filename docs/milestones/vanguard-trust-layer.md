# Milestone: Vanguard Trust Layer

**Date:** 2026-03-03  
**Commit:** `feat(sg-divorce): scaffold landing page and trust layer`  
**Status:** ✅ Built & deployed to `main` → Vercel production triggered

---

## Overview

This milestone introduces the **public acquisition funnel** and the **Ghost Data Protocol trust page** for sgdivorce.ai. Together they form the _Vanguard Trust Layer_ — the two-page foundation that converts first-time visitors into eligibility-check completions.

---

## Architecture

### Active App-Router Directory
```
apps/sg-divorce/app/           ← resolved by Next.js at build time
├── layout.tsx                 (copied from src/app/ — Geist fonts + SessionProvider shell)
├── globals.css                (Tailwind v4 @import + CSS custom properties)
├── page.tsx                   ← NEW: Vanguard landing page (Server Component)
├── how-we-protect-your-data/
│   └── page.tsx               ← NEW: Ghost Data Protocol trust page (Server Component)
└── test-handshake/            (existing dev diagnostic — untouched)
```

> **Root vs src**: Next.js resolves the root-level `app/` before `src/app/` when both exist. All new public pages are written to `app/` accordingly.

---

## Landing Page (`/`) — Copy Strategy

| Section | Purpose | Key Copy |
|---|---|---|
| **Nav** | Orientation + top CTA | "Start Free Check" |
| **Hero** | Capture attention + anxiety-relief | "Understand your divorce options in Singapore — free, private, no legal jargon" |
| **How It Works** | Reduce friction, build trust | 3-step numbered grid |
| **Trust Badge** | Address #1 user objection (privacy) | "100% Private. Your data never leaves your browser unencrypted." + link to Ghost Data Protocol |
| **Footer** | Legal compliance | "Legal information, not legal advice." |

**SEO Metadata:**
- Title: `Free Divorce Eligibility Check — Singapore 2026`
- Description targets keywords: `divorce Singapore`, `DMA Singapore`, `eligibility check`

**CTA:** Primary button links to `/eligibility-scanner` (route to be scaffolded in next milestone).

---

## Trust Layer (`/how-we-protect-your-data`) — Ghost Data Protocol

Four plain-language sections, numbered for readability:

1. **Device-side encryption** — AES-256 before transmission
2. **AI processing window** — plaintext exists only during the Gemini call; discarded immediately after
3. **No plaintext at rest** — Firestore only receives encrypted ciphertext
4. **No data selling** — explicit commercial commitment with a bullet checklist

---

## Verification

```
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /how-we-protect-your-data
└ ○ /test-handshake

Tasks:    2 successful, 2 total
Time:     4.89s
TypeScript: 0 errors
```

---

## Next Milestone

Scaffold `/eligibility-scanner` — the multi-step intake form that feeds the legal eligibility engine.
