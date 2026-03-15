# Sprint 12: Granular RAG & PDF Viewer

**Completed:** 2026-03-06T14:51:00+08:00

## Deliverables

| File | Status | Description |
|------|--------|-------------|
| `app/vault/paper/[id]/page.tsx` | ✅ NEW | PDF viewer: iframe + question sidebar + RAG context panel |
| `lib/firebase/rag-types.ts` | ✅ MODIFIED | `questionId` field added to `RAGQueryParams` |
| `lib/firebase/rag-query.ts` | ✅ MODIFIED | `queryQuestionChunk()`: mandatory questionId, topK=1, context window protection |

## DoD

- `npx tsc --noEmit` → **0 errors**
