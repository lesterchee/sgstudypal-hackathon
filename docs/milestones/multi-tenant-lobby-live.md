# Multi-Tenant Lobby Live

**Date:** 2026-03-10
**Commit:** see below

## Summary

Transformed the application into a true multi-tenant SaaS with a central lobby dashboard, dynamic `[botId]` route segments, and tenant-scoped API queries.

## Architecture

```
src/app/
├── page.tsx                          ← PUBLIC (chat widget)
├── login/page.tsx                    ← PUBLIC (login → /dashboard)
├── api/bots/route.ts                 ← GET ?botId=xxx | POST (create/update)
├── api/chat/route.ts                 ← POST ?botId=xxx
├── api/leads/route.ts                ← GET ?botId=xxx | PATCH
└── (protected)/
    ├── layout.tsx                    ← AuthProvider + AuthGuard
    ├── dashboard/page.tsx            ← Bot grid + Create New AI Bot ← NEW
    ├── portal/[botId]/page.tsx       ← Bot configurator (dynamic)
    └── crm/[botId]/page.tsx          ← Lead recovery CRM (dynamic)
```

## New Files

| File | Purpose |
|------|---------|
| `(protected)/dashboard/page.tsx` | Lobby page with bot grid (fetched via `where('orgId', '==', uid)`), "Create New AI Bot" button, empty state |

## Modified Files

| File | Change |
|------|--------|
| `(protected)/portal/[botId]/page.tsx` | Accepts `params: Promise<{ botId }>` via `use()`, loads existing config on mount, passes botId to save, injects real botId into embed snippet |
| `(protected)/crm/[botId]/page.tsx` | Accepts `params: Promise<{ botId }>` via `use()`, fetches leads scoped to botId |
| `api/bots/route.ts` | Added `GET ?botId=xxx` handler for loading a single BotConfig |
| `api/leads/route.ts` | Added botId query param filtering to `GET` handler |
| `login/page.tsx` | Redirect changed from `/portal` to `/dashboard` |

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| `use(params)` instead of direct destructure | Next.js 15+ passes `params` as a Promise — `React.use()` is the correct unwrap |
| Firestore client SDK for dashboard | Bot creation writes directly from the browser; no API roundtrip needed |
| Lazy Firebase client (`getClientAuth/Db/App`) | Prevents `auth/invalid-api-key` during Next.js build-time static generation |
| `where('botId', '==', botId)` in leads API | Ensures tenant isolation — CRM only shows leads for the specific bot |

## Verification

- `npx turbo run build --filter=hairspa-bot` — zero TS errors ✅
- Routes: `/dashboard` (static), `/portal/[botId]` (dynamic), `/crm/[botId]` (dynamic) ✅
- Public routes unaffected: `/`, `/login`, `/api/*` ✅
