# Auto-Scroll Fix

**Date:** 2026-03-08
**Commit:** see below

## Summary

Added automatic scroll-to-bottom behavior so the chat container always follows new messages and streaming responses.

## Implementation

- `useRef<HTMLDivElement>` — invisible anchor `<div>` placed at the absolute bottom of the scrollable messages container (below Quick Replies)
- `useEffect([messages])` — fires `scrollIntoView({ behavior: "smooth" })` whenever the `messages` array updates (new message or stream chunk)

## Verification

- `npx turbo run build --filter=hairspa-bot` — zero TS errors ✅
