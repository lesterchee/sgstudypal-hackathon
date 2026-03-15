# Core Engine Abstraction: The Great Pivot to Fitness SaaS

## Executive Summary
This document serves as the Persistence Protocol for our major strategic pivot from legacy legal application verticals to a high-retention, B2B2C SaaS platform built for Personal Trainers and their clients. The core objective was to abstract a clean multi-tenant model without destroying the technical moats of the original stack: Strict Turborepo architecture, the Ghost Data Protocol, and Trigger.dev stateful execution.

## The New Architecture
The system has seamlessly morphed to support **Trainers** and **Clients**, tracking **SessionPackages** and **FitnessLogs**. We built upon heavily tested foundations to achieve this:

1. **Bare-bones Next.js Clients**: Scaffolding two distinct Next.js apps — `pt-dashboard` (for Trainers) and `client-pwa` (for Clients) — sharing common utility and UI packages across the Turborepo.
2. **Ghost Data Continuity**: The `Ghost Data Protocol` remains active, functioning securely within the abstract `packages/core-engine` package (restructured from the legacy `legal-engine`). This preserves AES-256-GCM encryption for all sensitive logging operations.
3. **Stateful Trigger.dev Workers**: The workflow and async task configuration persists via generic schema mappings, retaining native support for the `@trigger.dev/sdk`.
4. **Multi-Tenant Security Rules**: Reconfigured `firestore.rules` natively scopes database access, authenticating trainers securely against their designated clients, all while tightly binding the Ghost Data primitives via Optimistic Concurrency Control natively at the DB level.

## Validation 
- Purged 8 separate rigid legacy scanning monolithic apps to create space for scalable primitives. 
- Passed the Master Pipeline: `npx turbo run build` yields **Zero TypeScript Errors**. 
- Successfully unified `@repo/core-engine` and `@repo/ui-chat` for seamless B2B component ingestion.

---

## Incident Log: Deprecation of Legacy Applications
During the Great Purge, the following 8 legacy verticals were permanently deleted from the codebase (`apps/`) along with any domain-specific vector context/RAG logic files (`mom-ep.md`, etc.):

1. `sg-divorce`
2. `sg-fairwork`
3. `sg-grant`
4. `sg-import`
5. `sg-propertylaw`
6. `sg-visa`
7. `sg-wills`
8. `student-rag`

This deprecation permanently removes hardcoded prompt logic related to these domains from the workspace. All remaining UI tools (such as `ChatInterface`) have been cleansed of domain-specific hooks and now consume clean, domain-agnostic props routing from `@repo/core-engine`.
