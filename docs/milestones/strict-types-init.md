# Strict Types Init — Multi-Tenant SaaS

**Date:** 2026-03-08
**Commit:** see below

## Summary

Defined the core multi-tenant SaaS database interfaces in the shared types package to enforce strict contract boundaries between the frontend Configurator and backend Firestore.

## New File

**`packages/types/src/schemas/saas.ts`** — barrel-exported via `index.ts`

## Type Definitions

| Type | Purpose |
|------|---------|
| `SubscriptionTier` | `'beta' \| 'pro' \| 'enterprise'` |
| `LeadStatus` | `'Pending Checkout' \| 'Converted' \| 'Engaged' \| 'Escalated'` |
| `Organization` | Billing entity: company name, owner email, Stripe ID, subscription tier |
| `BotConfig` | Full configurator state: funnel, knowledge base, brand, appointment slots |
| `Lead` | Captured user data: name, email, phone, outlet, time, offer intent, status |

## Architectural Notes

- Zero circular dependencies — `saas.ts` imports nothing from the monorepo
- No changes to `/packages/types/package.json` (package uses direct TS source imports)
- `apps/hairspa-bot` does not import from `@repo/types` yet — will be wired in a future payload

## Verification

- `npx turbo run build --filter=hairspa-bot` — zero TS errors, FULL TURBO ✅
