# Milestone 0: Student RAG — Architecture & Infrastructure Foundation

> **Status**: 🔄 IN PROGRESS
> **Date**: 2026-03-03
> **Owner**: Anti Gravity (Coding Agent)
> **Authorised by**: STRATEGY_BIBLE.md § 9 (Order 2) & § 13

---

## Objective

Establish the foundational monorepo scaffold for the B2C Law Student Assistant. This milestone delivers a buildable, deployable Next.js application shell with the correct Turborepo wiring, a domain-appropriate IRAC system prompt, and the documented architectural blueprint for the full RAG pipeline.

No vector DB or PDF ingestion is in scope for Milestone 0. The goal is a clean, zero-TS-error app that proves the build pipeline is sound and defines the work ahead.

---

## Technical Scope

| Layer | Technology | Status |
|-------|-----------|--------|
| Frontend | Next.js 16 App Router (`apps/student-rag`) | ✅ Scaffolded |
| Chat UI | `@repo/ui-chat` (shared package) | ✅ Wired |
| Streaming API | Vercel AI SDK v6 + `@ai-sdk/google` | ✅ Scaffolded |
| LLM (Phase 0) | Gemini 2.5 Pro (IRAC generation) | ✅ Wired |
| LLM (Phase 1) | Claude Max (IRAC generation with RAG context) | ⏸️ Pending Vector DB |
| PDF Ingestion | Trigger.dev + Gemini Ultra | 🔲 Not started |
| Vector DB | TBD (Pinecone / Vertex AI Search) | 🔲 Not started |
| Storage | Firebase Storage (PDF upload landing) | 🔲 Not started |

---

## Definition of Done

- [x] `apps/student-rag` scaffolded with zero TypeScript errors
- [x] `npx turbo run build --filter=student-rag` passes cleanly
- [x] IRAC system prompt injected into `/api/chat/route.ts`
- [x] `@repo/ui-chat` wired to chat endpoint
- [x] Milestone 0 documentation created
- [ ] Committed and pushed to `main`

---

## Full RAG Pipeline (Target Architecture)

```
Next.js Edge Client
  → Firebase Storage (PDF upload)
    → Trigger.dev (durable task queue)
      → Gemini Ultra (PDF parsing + structured extraction)
        → text-embedding-004 (chunking + embedding)
          → Vector DB (semantic retrieval)
            → Claude Max (IRAC generation with retrieved context)
              → Streamed response to student
```

### Pipeline Stage Notes

| Stage | Notes |
|-------|-------|
| **PDF Upload** | Student uploads SGCA/SGHC case PDF or statute extract via drag-and-drop UI |
| **Trigger.dev** | Durable job ensures PDF processing survives cold starts; idempotent on re-upload |
| **Gemini Ultra** | Extracts structured content: facts, issues, holdings, ratio decidendi, obiter |
| **Embedding** | `text-embedding-004` at 256-token chunks with 20-token overlap for dense retrieval |
| **Vector DB** | Per-student namespace isolation; case citations as metadata for citation grounding |
| **Claude Max** | Receives retrieved chunks + student query; generates strict IRAC-formatted response |
| **Zero UPL** | All output framed as academic study material; no legal advice disclaimer required |

---

## Incident Log

| Date | Incident | Resolution | Agent |
|------|----------|------------|-------|
| —    | —        | —          | —     |

---

*This document is the living record for Milestone 0. Update status fields and the Incident Log as work progresses.*
