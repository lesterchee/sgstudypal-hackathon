# Sprint 39 — The Infinite Loading Heal
**Date**: 2026-03-09
**Timestamp**: 08:18:00+08:00
**Milestone**: sprint-39-infinite-loading-heal

## Summary
Repaired an infinite loading state trap within the Dashboard UI's live Firebase Auth listener. When an unauthenticated user visited a protected route, the `loadingAuth` state remained `true` while the Next.js router attempted to push them to `/login`, occasionally resulting in an unresolved layout state and a perpetual spinner.

## Execute the Fix
**File**: `apps/sg-tutor/app/dashboard/layout.tsx`

Explicitly injected `setLoadingAuth(false)` into the `else` (no user) block of the `onAuthStateChanged` callback, ensuring the UI hydration resolves completely before or immediately upon routing to the fallback login screen.

```diff
-            } else {
-                router.push("/login");
-            }
+            } else {
+                setSession(null);
+                setLoadingAuth(false);
+                router.push("/login");
+            }
```

## DoD Verification
`npx tsc --noEmit` executed successfully with **zero TypeScript errors**. Fix committed to `main`.
