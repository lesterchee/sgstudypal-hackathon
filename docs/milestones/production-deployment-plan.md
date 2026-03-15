# Production Deployment Plan

## Overview
This document outlines the deployment strategy for the sgdivorce.ai monorepo applications, ensuring optimized edge performance for the Legal Engine and proper domain linking via Hostinger.

## Application Targets (Vercel)

Each application in the monorepo is deployed as an individual Vercel project targeting specific domains. The Vercel configurations explicitly target the **Edge Runtime** for all `/api/legal-engine/*` routes to ensure minimal latency for the Logic-First framework.

| Application App | Vercel Project Name | Primary Target Domain          |
|-----------------|---------------------|--------------------------------|
| `sg-divorce`    | `sg-divorce`        | `divorce.sgdivorce.ai`         |
| `sg-wills`      | `sg-wills`          | `wills.sgdivorce.ai`           |
| `sg-fairwork`   | `sg-fairwork`       | `fairwork.sgdivorce.ai`        |
| `sg-propertylaw`| `sg-propertylaw`    | `propertylaw.sgdivorce.ai`     |

## Hostinger DNS Records

To route traffic securely from the Hostinger managed root domain `sgdivorce.ai` to the respective Vercel deployments, configure the following DNS records in the Hostinger control panel.

### CNAME Records

| Type  | Name (Subdomain) | Target (Points To)           | TTL    |
|-------|------------------|------------------------------|--------|
| CNAME | `divorce`        | `cname.vercel-dns.com`       | 3600   |
| CNAME | `wills`          | `cname.vercel-dns.com`       | 3600   |
| CNAME | `fairwork`       | `cname.vercel-dns.com`       | 3600   |
| CNAME | `propertylaw`    | `cname.vercel-dns.com`       | 3600   |

> **Note:** Allow up to 24-48 hours for full DNS propagation, though Vercel usually generates SSL certificates within minutes once the CNAMEs resolve correctly.

## Environment Variables

A normalized set of environment variables must be applied across all 4 Vercel projects to ensure consistency in the persistence and security layers. See `.env.example` at the monorepo root for details.

Highlights:
- `GHOST_CRYPTO_KEY`: Required by the Ghost Data Encoder for PII manipulation.
- `FIREBASE_ADMIN_CREDENTIALS`: Required for accessing the shared Firebase project database.

## Edge Runtime Execution

Each app directory contains a `vercel.json` specifically configured to map:
```json
{
  "functions": {
    "api/legal-engine/**/*": {
      "runtime": "edge"
    }
  }
}
```
This isolates the agentic evaluation engine to Vercel's global edge network, decoupling the Heavy-Compute layer from standard static site delivery.
