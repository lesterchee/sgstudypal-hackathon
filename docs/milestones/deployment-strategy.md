# Milestone: 2-Week Deployment Strategy (The Tracer Bullet)

## Objective
To mitigate exponential technical debt and Vercel Edge configuration risks, the monorepo will utilize a "Tracer Bullet" deployment model. We will prove the end-to-end architecture on a single Vanguard App before executing the Orchestrator Multiplier. The domain pipeline is strictly optimized for Phase 4 Client-Side RPA (deterministic DOM injection).

## Phase 1: The Vanguard App (`sgdivorceai`)
- **Target:** Deploy `sgdivorceai` as the sole production prototype.
- **Validation Gates:** 1. `.env.local` keys successfully injected into Vercel.
  2. Trigger.dev durable execution bypasses Vercel Edge timeouts natively.
  3. Gemini 1.5 Pro outputs the strict `Portal_Ready_JSON` schema matching the `Government_Portal_Mapper`.

## Phase 2: The Orchestrator Multiplier (The "Next 6")
- Once the Vanguard App is validated, clone the architectural template to the highly deterministic RPA targets:
  - `sgwills` (Core Prosumer)
  - `sgfairwork` (TADM Portal RPA)
  - `sgpropertylaw` (Core Prosumer)
  - `sgclaims` (SCT Portal RPA)
  - `sggrant` (BGP Portal RPA - Enterprise B2B)
  - `sgtrademark` (IPOS Portal RPA - SMB B2B)

## The Landbank Reserve (Do Not Build)
- The following domains are secured but architecturally paused to maintain focus: `sgvisa`, `sgcontracts`, `sgimport`, `sgprobate`.

## Incident Log
- **[2026-03-01] STRATEGY REVISION:** Swapped `sggrant` and `sgtrademark` into the Next 6 to maximize Phase 4 RPA utilization. `sgvisa` and `sgcontracts` moved to landbank reserve.
