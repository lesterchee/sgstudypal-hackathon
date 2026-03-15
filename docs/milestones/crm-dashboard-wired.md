# CRM Dashboard Wired

**Date:** 2026-03-10
**Commit:** see below

## Summary

Built the Lead API backend and converted the static CRM HTML into an interactive Teleconsultant Dashboard with real-time Firestore status synchronization.

## Lead API — `api/leads/route.ts`

| Method | Purpose |
|--------|---------|
| `GET` | Fetch all leads from `leads` collection, ordered by `createdAt` desc |
| `PATCH` | Accept `{ leadId, updates }`, merge into specific lead document |

Both handlers use `getAdminDb()` singleton and wrap in try/catch with clean 500 responses.

## CRM Page — `crm/page.tsx`

### State

| State | Type | Purpose |
|-------|------|---------|
| `leads` | `Lead[]` | All leads fetched on mount |
| `isLoading` | `boolean` | Loading indicator |
| `searchTerm` | `string` | Filters across name/email/phone |
| `updatingId` | `string \| null` | Locks dropdowns during PATCH requests |

### Dynamic Data Derivation

| Function | Output |
|----------|--------|
| `getLeadPriority(lead)` | Hot / Warm / Cold badge based on data completeness |
| `getInfoStatus(lead)` | Ready to Contact / Incomplete Info badge |
| `parseContactPref(pref)` | Splits string → method (WhatsApp/Phone/Email/SMS), time, icon, color |
| `formatDate(ts)` | Unix → "Mar 8, 14:30" display |

### Interactivity

| Feature | Detail |
|---------|--------|
| Search | Real-time filter across name, email, phone |
| CRM Status dropdown | Optimistic update → PATCH `/api/leads` → `disabled` during request |
| Status Update dropdown | Same pattern — prevents race conditions |
| Remarks field | Local state on `onChange`, persists via `onBlur` |

### Adversarial Guards

- Dropdowns disabled (`disabled={isUpdating}`) during network requests
- Empty state message when no leads or no search results

## Verification

- `npx turbo run build --filter=hairspa-bot` — zero TS errors ✅
- Routes registered: `/api/leads` (dynamic), `/crm` (static) ✅
