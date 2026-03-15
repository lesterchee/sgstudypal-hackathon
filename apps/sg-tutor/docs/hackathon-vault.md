# The Hackathon Vault
**V1.2 Post-Hackathon Restoration Ledger**

> ⚠️ **Quick Find Command**: Run this to instantly locate all hidden seams:
> ```bash
> grep -rn "TODO: V1.2" apps/sg-tutor/
> ```

This document serves as a permanent ledger of all UI features, authentication bypasses, and billing gates that were temporarily hidden, mocked, or altered to streamline the `sg-tutor` application for the Gemini Live Agent Challenge demo.

---

## 1. UI Pruning (Navigation & Dashboards)
The following gamification and secondary features were hidden to keep the demo focused strictly on the AI Tutor (`/live`) and primary triage workflows.

- [ ] **`apps/sg-tutor/components/layout/Sidebar.tsx`**
  - **Action**: Restore the `Stickers` (My Badges) and `Accomplishments` options in the `NAV_ITEMS` array.
  - **Tag**: `/* TODO: V1.2 Post-Hackathon ... */`

- [ ] **`apps/sg-tutor/app/dashboard/layout.tsx`**
  - **Action**: Restore the `My Accomplishments` and `My Stickers` options in the mobile/dashboard wrapper `NAV_ITEMS` array.
  - **Tag**: `/* TODO: V1.2 Post-Hackathon ... */`

- [ ] **`apps/sg-tutor/app/dashboard/page.tsx`**
  - **Action**: Restore the secondary quick link action cards for `My Accomplishments` and `My Stickers` on the main triage dashboard.
  - **Tag**: `{/* TODO: V1.2 Post-Hackathon ... */}`

---

## 2. Auth & Onboarding Bypasses
To provide zero-friction access for Devpost judges, the standard student onboarding wizard was bypassed.

- [ ] **`apps/sg-tutor/app/login/page.tsx`**
  - **Action**: Remove the high-visibility `"✨ Log in as Devpost Judge"` button.
  - **Action**: Remove the `handleJudgeLogin` function that hardcodes the `signInWithEmailAndPassword` execution for `judge@devpost.com` / `geminilive2026`.
  - **Tag**: Look for `// Purpose: Sprint 162 — Hackathon Judge Login Bypass.`

---

## 3. Billing Gates & Stripe Subscriptions
At the time of the hackathon freeze, the core Stripe webhooks were active, but strict frontend UI gates (`isSubscribed` checks or `<Paywall />` wrappers) had not yet been fully enforced on the `/live` route.

- [ ] **Dashboard & Live Wrappers (`PremiumWrapper.tsx` equivalent)**
  - **Action**: Implement and enable frontend subscription checks for the `/live` and `/dashboard` routes to properly gate the premium features.
  - **Note**: The `/live` bundle is currently fully accessible to any authenticated user (including the Judge Guest account and Ghost Users).
