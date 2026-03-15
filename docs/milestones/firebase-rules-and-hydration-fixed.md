# Milestone: Firebase Rules & Layout Hydration Fixed

> **Date**: 2026-03-10
> **Scope**: `packages/core-engine/src/security/firestore.rules` + `apps/hairspa-bot` protected layout

## What Changed

### Firestore Security Rules
Added `bots` and `leads` collection rules to the shared `firestore.rules`:

| Collection | create | read/update/delete |
|-----------|--------|-------------------|
| `bots/{botId}` | `auth.uid == request.resource.data.orgId` | `auth.uid == resource.data.orgId` |
| `leads/{leadId}` | Public (`allow create: if true`) | Authenticated only |

### Protected Layout
Confirmed **already clean** — no `<html>` or `<body>` tags present. Returns `<AuthProvider><AuthGuard>{children}</AuthGuard></AuthProvider>` only.

### Firebase Project Config
Created `firebase.json` at monorepo root pointing to `packages/core-engine/src/security/firestore.rules`.

## Deployment Status

> [!WARNING]
> Rules deployment requires `firebase use --add` to set the active project. Run:
> ```
> npx firebase-tools use --add
> npx firebase-tools deploy --only firestore:rules
> ```

## DoD Results

| Check | Result |
|-------|--------|
| TS errors (`tsc --noEmit`) | ✅ Zero |
| Build (`npm run build`) | ✅ Clean |
| Protected layout hydration | ✅ No nested document tags |
