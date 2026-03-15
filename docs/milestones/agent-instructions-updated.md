# Agent Instructions Updated — v2 Compressed Architecture

> **Date**: 2026-03-11
> **Status**: ✅ COMPLETE
> **Triggered by**: Agent Orchestrator directive

---

## Summary

Replaced the Anti Gravity global system prompt (`.cursorrules`) from the v1 multi-line format to the v2 compressed architecture.

## Key Changes in v2

| Aspect | v1 | v2 |
|--------|----|----|
| Role | Agent Orchestrator & Systems Architect | Agent Orchestrator |
| Integration Contract | Not enforced | Mandatory — data/cookie handoff contracts before complex logic |
| Conditional Execution | Not tiered | Risk-tiered — explicit GO for core infra, auto-execute for UI/CRUD |
| Network Boundary Audit | Not enforced | Mandatory — Adversarial EDD must audit network boundaries, state, cookies |
| Env Var Sync | Not flagged | All env var syncs flagged pre-deployment |
| Doc-Sync | Separate line | Inlined with DoD & Docs |
| Routing Protocol | Explicit routing tiers | Removed (handled externally) |

## Verification

- **DoD**: `turbo run build` — 6/6 tasks successful, zero TS errors, exit code 0.

## Files Modified

- `.cursorrules` — Full replacement (v1 → v2)
