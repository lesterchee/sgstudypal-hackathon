# Incident: Service Worker `TypeError: Failed to fetch`

**Date:** 2026-03-14  
**Severity:** Medium (dev-only)  
**Status:** Resolved

## Symptoms

- Next.js dev server returned broken asset URLs (JS/CSS chunks)
- Browser console showed: `TypeError: Failed to fetch` from a registered Service Worker
- Pages loaded with missing styles and broken interactivity
- Hot Module Replacement (HMR) failed silently

## Root Cause

A previously registered Service Worker (likely from a PWA experiment or `next-pwa`) intercepted fetch requests for Next.js `/_next/static/` assets. When the `.next` build cache was cleared, the SW's cached asset manifest became stale — it attempted to serve assets that no longer existed, returning fetch failures instead of falling through to the network.

## Resolution

1. **Unregister the Service Worker:**
   - Chrome DevTools → Application → Service Workers → Unregister
   - Or programmatically: `navigator.serviceWorker.getRegistrations().then(r => r.forEach(sw => sw.unregister()))`

2. **Hard cache clear:**
   - Chrome DevTools → Application → Clear Storage → Clear Site Data
   - Or: `Cmd+Shift+Delete` → Clear cached images/files

3. **Nuke Next.js build cache:**
   ```bash
   rm -rf apps/sg-tutor/.next node_modules/.cache
   npm run dev
   ```

## Prevention

- Do not register Service Workers in development mode
- If using `next-pwa`, ensure `disable: process.env.NODE_ENV === 'development'` is set
- Add `rm -rf .next` to the dev startup script as a safety net
