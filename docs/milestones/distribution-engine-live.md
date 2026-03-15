# Distribution Engine Live

**Date:** 2026-03-10
**Commit:** see below

## Summary

Built a distributable Vanilla JS embed script, wired the chat widget to broadcast its expanded/collapsed state to the parent window, and added a copy-paste embed code UI to the Client Portal.

## New File — `public/embed.js`

| Feature | Detail |
|---------|--------|
| IIFE wrapper | Prevents global scope pollution |
| `data-bot-id` | Reads bot ID from the script tag attribute |
| `iframe` injection | Points to `/?botId=BOT_ID`, fixed bottom-right, `z-index: 999999` |
| Initial size | 100×100px (FAB collapsed state) |
| `postMessage` listener | Resizes to 400×85vh on `COMMITPAY_RESIZE { isExpanded: true }`, shrinks back on false |
| Pointer safety | Collapsed iframe doesn't block host site interaction |

## Modified — `page.tsx`

| Change | Detail |
|--------|--------|
| `useSearchParams` | Reads `botId` from URL for embed-mode |
| `DefaultChatTransport` | AI SDK v5 compat — passes custom `api` URL with botId |
| `Suspense` boundary | Wraps HomeInner to satisfy Next.js prerendering requirement |
| `postMessage` broadcast | Sends `{ type: "COMMITPAY_RESIZE", isExpanded }` to parent on toggle |

## Modified — `route.ts`

| Change | Detail |
|--------|--------|
| Read `botId` from URL | `new URL(req.url).searchParams.get("botId")` instead of request body |

## Modified — `portal/page.tsx`

| Change | Detail |
|--------|--------|
| Section 8: Distribution | Read-only textarea with embed snippet + "Copy to Clipboard" button |

## Verification

- `npx turbo run build --filter=hairspa-bot` — zero TS errors ✅
- All routes registered ✅
- Suspense boundary requirement satisfied ✅
