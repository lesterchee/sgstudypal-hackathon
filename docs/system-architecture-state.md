# SG-Tutor System Architecture State

**Generated:** 2026-03-06T14:58:00+08:00 — Sprint 15 Global Audit

---

## 1. AI Routing Logic

| Model | Provider | Location | Purpose |
|-------|----------|----------|---------|
| Qwen-VL-Max | Alibaba (`@ai-sdk/alibaba`) | `app/api/chat/route.ts` | Primary Socratic tutor (multimodal text+image) |
| Gemini 2.0 Flash | Google REST API | `lib/ai/ocr-pipeline.ts` | OCR extraction — structured text + diagram descriptions |
| N/A (prompt-only) | — | `lib/ai/prompt-router.ts` | 7 base branches + 3 runtime modifiers (no model call) |

### Prompt Router Branches (prompt-router.ts)

| Priority | Branch | Trigger | Sprint |
|----------|--------|---------|--------|
| 1 | Parent Co-Educator | `isParentMode === true` | 1 |
| 2 | English (Subjectivity Trap) | `subject === 'english'` | 5 |
| 3 | Science (CER Backwards) | `subject === 'science'` | 6 |
| 4 | Chinese (SG Localization) | `subject ∈ {chinese, mt}` | 7 |
| 5 | P1-P2 Simplified | `gradeLevel ∈ {P1, P2}` | 1 |
| 6 | P3-P5 Model Method | `gradeLevel ∈ {P3-P5}` | 1 |
| 7 | P6 Algebra + Bar | `gradeLevel === 'P6'` | 1 |

| Modifier | Trigger | Sprint |
|----------|---------|--------|
| Vault Mode | `tutorMode === 'vault'` | 9 |
| Helper Mode | `tutorMode === 'helper'` | 9 |
| 3-Strike Frustration | `failedAttempts >= 3` | 9 |

---

## 2. UI State Machine

| State | Trigger | Location | Sprint |
|-------|---------|----------|--------|
| Zen Mode | P1-P3 + `!isParentMode` | `dashboard/page.tsx` | 1 |
| Parent Mode | `isParentMode` toggle | `dashboard/page.tsx` | 1 |
| Vault Mode | Segmented control | `dashboard/page.tsx` | 9 |
| Helper Mode | Segmented control | `dashboard/page.tsx` | 9 |
| Challenge Mode | P3 → P6 question detection | `dashboard/page.tsx` | 2 |
| Grade Promotion | `needsGradePromotion` flag | `dashboard/layout.tsx` | 3 |
| Auth Upgrade | `questionsMastered === 1` | `auth-upgrade-modal.tsx` | 11 |
| OCR Review | Image upload → review → confirm | `ocr-verifier.tsx` | 5 |
| Image Rejected | `status: "image_rejected"` in chat | `chat-bubble.tsx` | 6 |
| Socratic Loading | AI processing | `socratic-loader.tsx` | 9 |

---

## 3. File Inventory

### App Routes (16 files)
```
app/
├── api/auth/qr/route.ts          (Sprint 8: JWT QR)
├── api/chat/route.ts             (Sprint 1+10: Socratic chat + OCR middleware)
├── api/mastery/route.ts          (Pre-sprint: mastery API)
├── api/papers/route.ts           (Pre-sprint: papers list)
├── api/papers/[filename]/route.ts (Pre-sprint: paper download)
├── dashboard/page.tsx            (Sprint 1+2+9: main dashboard)
├── dashboard/layout.tsx          (Sprint 3: grade promotion modal)
├── dashboard/chat/page.tsx       (Pre-sprint: chat page)
├── dashboard/chat/components/PopularTopicsGrid.tsx
├── dashboard/accomplishments/page.tsx
├── dashboard/level-up/page.tsx
├── dashboard/stickers/page.tsx
├── vault/paper/[id]/page.tsx     (Sprint 12: PDF viewer)
├── login/page.tsx
├── layout.tsx
└── page.tsx
```

### Components (9 files)
```
components/
├── ui/auth-upgrade-modal.tsx     (Sprint 11)
├── ui/chat-bubble.tsx            (Sprint 6)
├── ui/chinese-text.tsx           (Sprint 4)
├── ui/math-model.tsx             (Sprint 4)
├── ui/ocr-verifier.tsx           (Sprint 5)
├── ui/socratic-loader.tsx        (Sprint 9)
├── layout/Sidebar.tsx            (Pre-sprint)
├── providers/AuthProvider.tsx    (Pre-sprint)
└── PdfViewer.tsx                 (Pre-sprint)
```

### Lib (16 files)
```
lib/
├── ai/ocr-pipeline.ts           (Sprint 10)
├── ai/prompt-router.ts          (Sprint 1+5+6+7+9)
├── ai/sentiment.ts              (Sprint 4)
├── ai/sentiment-types.ts        (Sprint 4)
├── ai/vision-bouncer.ts         (Sprint 2+6)
├── ai/vision-bouncer-types.ts   (Sprint 2+6)
├── firebase/auth-link.ts        (Sprint 11)
├── firebase/client.ts           (Pre-sprint)
├── firebase/rag-query.ts        (Sprint 3+12)
├── firebase/rag-types.ts        (Sprint 3+12)
├── firebase/upload.ts           (Sprint 2)
├── firebase-admin.ts            (Pre-sprint)
├── firebase.ts                  (Pre-sprint)
├── constants/syllabus.ts        (Pre-sprint)
├── image-utils.ts               (Sprint 8)
└── moe/dictionary.ts            (Pre-sprint)
```

### Jobs (4 files)
```
jobs/
├── generate-morning-practice.ts  (Pre-sprint)
├── image-cleanup.ts              (Sprint 8)
├── scrape-test-papers.ts         (Pre-sprint)
└── weekly-report.ts              (Sprint 9)
```

### Hooks (1 file)
```
hooks/
└── use-ghost-state.ts            (Sprint 11)
```

### Config (1 file)
```
config/
└── moe-dictionary.json           (Sprint 1+7)
```

---

## 4. Technical Debt Identified

### Critical: Duplicate Type Definitions
| Type | Files | Action |
|------|-------|--------|
| `GradeLevel` | `prompt-router.ts`, `rag-types.ts`, `chinese-text.tsx`, `page.tsx` | Consolidate into shared location |

### Moderate: Missing // Purpose: Headers
**30 files** lack the `// Purpose:` documentation header. These must be added in Sprint 16.

### Low: Hardcoded Auth
| File | Issue |
|------|-------|
| `app/api/chat/route.ts` | `FALLBACK_USER_ID = "guest-p6-student"` — hardcoded, flagged for auth wiring |

---

## 5. Firebase / Infra Status

| Service | Status | Files |
|---------|--------|-------|
| Firebase Auth (Client) | ✅ Wired | `AuthProvider.tsx`, `auth-link.ts`, `firebase.ts` |
| Firebase Auth (Admin) | ✅ Wired | `firebase-admin.ts` |
| Firestore (Client) | ✅ Wired | `upload.ts`, `vision-bouncer.ts` |
| Firestore (Admin) | ✅ Wired | `route.ts`, `image-cleanup.ts`, `weekly-report.ts` |
| Firebase Storage | ✅ Wired | `upload.ts`, `image-cleanup.ts` |
| Cloud Functions | ✅ Isolated | `functions/src/index.ts` (excluded from main tsconfig) |
| Vector DB | ⚠️ Stub | `rag-query.ts` — `executeVectorSearch()` returns `[]` |
| Gemini Flash | ✅ REST API | `ocr-pipeline.ts` |
| Qwen-VL-Max | ✅ Alibaba SDK | `route.ts` |
