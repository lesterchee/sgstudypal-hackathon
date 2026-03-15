# Sprint 11: Ghost State Conversion

**Completed:** 2026-03-06T14:49:00+08:00

## Deliverables

| File | Status | Description |
|------|--------|-------------|
| `hooks/use-ghost-state.ts` | ✅ NEW | Ghost state hook: `questionsMastered` counter, modal trigger at count 1, dismiss/upgrade callbacks |
| `components/ui/auth-upgrade-modal.tsx` | ✅ NEW | Conversion modal: celebratory header, Google CTA, 2-step dismiss with cache-loss warning |
| `lib/firebase/auth-link.ts` | ✅ NEW | `upgradeAnonymousUser()` — `linkWithPopup(GoogleAuthProvider)`, Firestore profile update, 4 error codes |

## DoD

- `npx tsc --noEmit` → **0 errors**
