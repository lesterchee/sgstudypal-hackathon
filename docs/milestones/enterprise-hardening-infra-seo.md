# Enterprise Hardening: Infrastructure & SEO Architecture

## Overview
This document summarizes the architectural decisions and execution steps taken to complete the Enterprise Hardening Missions. The mission was divided into two distinct threads:

1. **Thread 1: Trigger.dev Cache Invalidation (Backend Infrastructure)**
2. **Thread 2: Programmatic SEO Architecture (Frontend Growth)**

## Thread 1: Trigger.dev Cache Invalidation

### Purpose
To ensure that any changes in Singapore Statutes (e.g., Employment Act) automatically trigger an event to flush the Gemini Context Cache. This maintains high confidence in the AI model's legal citations by strictly using the most up-to-date legislative texts.

### Implementation
- **Workspace:** Created a new package `@repo/workflows` dedicated to background jobs, cron tasks, and workflow orchestration.
- **Component (`statute-hash-checker.ts`):** 
  - Simulates a scheduled Inngest/Trigger.dev task.
  - Fetches the target URL (e.g., AGC Singapore Statutes Online).
  - Hashes the retrieved DOM content using SHA-256.
  - Compares the generated hash against the last known hash stored in Firestore.
  - Triggers a `Flush Gemini Context Cache` event conceptually upon mismatch, ensuring the next AI inference relies on a fresh vector/context ingestion.

## Thread 2: Programmatic SEO Architecture

### Purpose
To capture high-intent Google Search traffic dynamically without relying heavily on paid Meta Ads. By systematically publishing and surfacing structured legal guides, the sgdivorce.ai and sgpropertylaw.ai platforms can rank generically for long-tail keywords.

### Implementation
- **UI Component (`GuideLayout.tsx`):** 
  - Added to `@repo/ui-legal` to enforce consistent, accessible, and responsive typography layout (via Tailwind Typography) across all generated guides in the monorepo.
- **Dynamic Routing (`/guides/[slug]/page.tsx`):** 
  - Scaffolded dynamic Next.js App Router paths for both `sg-divorce` and `sg-propertylaw` applications.
  - **`generateMetadata`:** Implemented programmatic metadata generation to emit perfect SEO tags, including OpenGraph data, Canonical URLs, and Twitter cards specific to each guide slug. 

## Build Stability
To enforce strictly typed boundaries, both threads were run against a rigorous `npx turbo build`. Temporary `use client` serialization issues within shared UI hooks were resolved locally. The final monorepo state successfully compiles with all dependencies dynamically linked.
