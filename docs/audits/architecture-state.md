# Architecture State Audit

**Date:** 2026-03-10
**Purpose:** Map the current Next.js app directory structure and shared types to ensure accurate component scaffolding for the Portal and CRM routes.

## 1. Directory Tree: Primary Application (`apps/hairspa-bot/src/app`)

```text
apps/hairspa-bot/src/app
├── api
│   ├── bots
│   │   └── route.ts
│   └── chat
│       └── route.ts
├── globals.css
├── layout.tsx
└── page.tsx
```

## 2. Directory Tree: Shared Types (`packages/types/src`)

```text
packages/types/src
├── env.d.ts
├── env.ts
├── index.ts
└── schemas
    ├── fitness-schema.ts
    ├── saas.ts
    └── user.ts
```

## 3. TypeScript Interfaces (`packages/types/src/schemas/saas.ts`)

### `BotConfig`

```typescript
export interface BotConfig {
    id: string;
    orgId: string;
    botName: string;
    regularPrice: string;
    flashOffer: string;
    coreObjective: string;
    fomoMessage: string;
    guidedFunnel: {
        secureOfferText: string;
        secureOfferVariations: string[];
        commitPayUrl: string;
        questionText: string;
        bookLaterText: string;
    };
    appointmentSlots: string[]; // e.g., ["10am - 12pm", "12pm - 4pm", "4pm - 8pm"]
    appointmentDays: string[]; // e.g., ["Monday", "Tuesday", ...]
    knowledgeBase: {
        businessFacts: string;
        youtubeLinks: string[];
        supportPhone: string;
        supportEmail: string;
    };
    brandSettings: {
        primaryColor: string;
        logoUrl?: string;
    };
    updatedAt: number; // Unix timestamp
}
```

### `Lead`

```typescript
export interface Lead {
    id: string;
    botId: string;
    orgId: string;
    name?: string;
    email?: string;
    phone?: string;
    preferredOutlet?: string;
    preferredDay?: string;
    preferredTime?: string;
    offerIntent?: "flash" | "regular";
    contactPreference?: string;
    status: LeadStatus;
    createdAt: number; // Unix timestamp
}
```
