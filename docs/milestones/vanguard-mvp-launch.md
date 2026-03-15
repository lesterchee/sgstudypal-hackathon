# Vanguard MVP Launch — Local JSON RAG Architecture

**Date:** 2026-03-03  
**Author:** Legal Architect Agent  
**Status:** ✅ Shipped — Build Green

---

## Milestone Summary

This milestone documents the **Vanguard MVP architectural pivot** from a planned
external Vector DB (Pinecone / pgvector) to a fully **local JSON RAG** approach
for statutory clause retrieval in the sg-divorce Trigger.dev eligibility worker.

---

## Problem Statement

The previous `queryVectorDB()` function in `apps/sg-divorce/src/trigger/legal-assessment.ts`
was a hardcoded stub returning 5 generic Women's Charter clauses unconditionally.
The original plan required a live Pinecone or pgvector endpoint, introducing:

- External network dependency (latency + cost + failure risk inside Trigger.dev workers)
- Non-deterministic clause selection (semantic drift across embedding model versions)
- Hallucination risk from Vector DB returning irrelevant chunks
- Operational complexity: managing embeddings pipeline, index updates, API keys

---

## Architectural Decision: Local JSON RAG

### What Changed

| Layer | Before | After |
|---|---|---|
| Clause source | Hardcoded stub array + Pinecone stub | `womens-charter-core.json` (bundled) |
| Selection method | None (all 5 random static clauses) | Tag-based deterministic filter |
| Network calls | Would require Pinecone/pgvector call in Step 2 | **Zero** — in-process |
| External dependencies | Pinecone client, pgvector adapter | **None** |
| Trigger.dev Step 2 label | `RAG_QUERY` (stub) | `RAG_QUERY` (live, local) |

### New Files

- **`apps/sg-divorce/src/lib/womens-charter-core.json`** — 27-clause statutory knowledge base
- **`apps/sg-divorce/src/trigger/legal-assessment.ts`** — Refactored trigger worker

### Knowledge Base Coverage (`womens-charter-core.json`)

| Topic | Clauses |
|---|---|
| Eligibility gate (s94, s95) | 2 |
| Divorce by Mutual Agreement (DMA, s95A) | 4 |
| Grounds: adultery, unreasonable behaviour, desertion | 3 |
| Separation (3-year with consent, 4-year no consent) | 3 |
| Asset division (s112 + matrimonial asset definition) | 3 |
| CPF division (SA closure 2025, nominations, refund rule) | 3 |
| HDB MOP (5-year rule, pre-MOP transfer constraints) | 2 |
| Maintenance (s113, s114, s118) | 3 |
| Children (s122 custody, s127 maintenance) | 2 |
| Procedure (simplified track, contested track) | 2 |
| **Total** | **27** |

### RAG Filter Logic (`filterRelevantClauses`)

1. Converts decrypted grievance text to uppercase for signal token detection.
2. Always adds `eligibility_gate` tag (baseline s94/s95 rules always injected).
3. Detects: `DMA`, `MUTUAL AGREEMENT`, `ADULTERY`, `UNREASONABLE`, `BEHAVIOUR`,
   `DESERTION`, `4 YEAR`/`4-YEAR`, `3 YEAR`/`3-YEAR`, `HDB`, `MOP`, `FLAT`,
   `CPF`, `MAINTENANCE`, `ALIMONY`, `CHILD`, `CUSTODY`, `ACCESS`.
4. Filters JSON for clauses whose `tags[]` intersect the active tag set.
5. De-duplicates, prioritises `eligibility_gate` clauses first, and returns top 5.

---

## Build Verification

```
npx turbo run build --filter=sg-divorce
```

```
✓ Compiled successfully in 1009.7ms
✓ Finished TypeScript in 1925.0ms
Tasks: 2 successful, 2 total
Time:  5.043s
```

Zero TypeScript errors. `resolveJsonModule: true` was already set in `tsconfig.json`.

---

## Vector DB Dependency Removal

No references to `queryVectorDB`, `Pinecone`, or `pgvector` remain in
`apps/sg-divorce/src/trigger/`. Verified by grep during implementation.

---

## Constraints Preserved

- `PlaybookProgress` schema unchanged — `playbook-viewer.tsx` UI unaffected.
- `@repo/types` and `firestore.rules` untouched.
- `GhostCrypto` decrypt → encrypt envelope intact.
- UPL guardrail (`ASSET_CONCEALMENT_STRATEGY`) detection logic unchanged.

---

## Next Steps (Post-Vanguard)

- [ ] Integrate `womens-charter-core.json` into a scheduled monthly review
      process to pick up legislative amendments.
- [ ] Add a secondary filter pass using Gemini Flash to re-rank the top 5
      clauses for edge cases with multiple overlapping grounds.
- [ ] Monitor Trigger.dev run logs for Step 2 clause selection distribution
      across real sessions.
