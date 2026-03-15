# Sprint 36 — Environment Security Audit & Injection
**Date**: 2026-03-09
**Timestamp**: 08:05:00+08:00

## Summary

Parsed raw API key snippets, formatted to Next.js standards, and injected into `apps/sg-tutor/.env.local`.

## Security Audit

- ✅ `.env.local` listed in root `.gitignore` (line 7)
- ✅ No app-level `.gitignore` needed (inherits from root)
- ✅ Backend AI keys (`DASHSCOPE_API_KEY`, `GEMINI_API_KEY`) have **no** `NEXT_PUBLIC_` prefix
- ✅ Firebase client vars use `NEXT_PUBLIC_FIREBASE_` prefix

## Variables Injected

| Key | Type | Prefix |
|---|---|---|
| `DASHSCOPE_API_KEY` | Backend AI | None |
| `GEMINI_API_KEY` | Backend AI | None |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Client | `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Client | `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Client | `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Client | `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Client | `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Client | `NEXT_PUBLIC_` |
