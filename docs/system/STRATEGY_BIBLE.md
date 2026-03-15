# SGLEGALAIENGINE — Product Strategy & Positioning Bible

> **Version**: 1.0
> **Date**: 2026-03-03 (B2C Student Pivot Amendment)
> **Authored by**: Claude (Opus 4.6) — Strategic Consultant, in collaboration with Orchestrator
> **Audience**: Gemini (Production LLM & Build Architect), Anti Gravity (Coding Agent)
> **Classification**: Strategic — All agents must align to this document
> **Status**: APPROVED by Orchestrator

-----

## PURPOSE OF THIS DOCUMENT

This is the strategic north star for every build decision across SGLEGALAIENGINE. Before writing code, scaffolding a component, or designing a user flow, every agent must check their work against this document. If a build decision conflicts with the positioning defined here, the positioning wins. No exceptions.

-----

## 1. CORE PRODUCT IDENTITY

### What We Are

**A legal preparation tool.** We help people in Singapore understand their legal situation, prepare their information, and walk into a lawyer’s office ready — so they spend less time explaining and more time on strategy.

### What We Are NOT

- We are NOT a lawyer replacement.
- We are NOT a legal advice platform.
- We are NOT a legal document generator (yet).
- We do NOT provide legal opinions, predictions of court outcomes, or recommended courses of action.

### The Internal Mental Model

Think: **“The best AI paralegal in Singapore.”**

We do what a good paralegal does — gather facts, organize information, explain legal context, identify relevant statutes, flag complexity, and prepare the client for a productive conversation with their lawyer. We do this faster, cheaper, and at scale.

### The External Positioning

Never use the word “paralegal” in any user-facing copy. Paralegals in Singapore are regulated professionals who work under lawyer supervision. Our external language is:

- ✅ “Legal preparation tool”
- ✅ “Understand your situation before you see a lawyer”
- ✅ “Save time and legal fees by arriving prepared”
- ✅ “Legal information platform”
- ✅ “Know your rights, then talk to a professional”
- ❌ “AI paralegal”
- ❌ “AI lawyer”
- ❌ “Legal advice”
- ❌ “We recommend” / “You should” / “Your best option is”
- ❌ “Skip the lawyer” / “No lawyer needed”

### The One-Line Pitch

> “We help Singaporeans understand their legal situation — clearly, privately, and for free — so they can make informed decisions and get better outcomes with their lawyers.”

-----

## 2. PRODUCT POSITIONING: WHY THIS WINS

### The Stakeholder Alignment

|Stakeholder |What They Get |Why They Support Us |
|----------------------------------------|----------------------------------------------------------------|------------------------------------------------------------|
|**The User** (person in legal situation)|Clarity, context, reduced anxiety, lower legal fees |They understand their situation before spending money |
|**The Lawyer** (referral partner) |Pre-screened, prepared clients who waste less intake time |Better-qualified leads, higher conversion, less hand-holding|
|**The Regulator** (Law Society, SAL) |A tool that drives people TO lawyers, not away from them |We reinforce the legal profession, not undermine it |
|**The Orchestrator** (Lester) |A defensible, low-liability business with multiple revenue paths|Clean regulatory position, partner-friendly, scalable |

### The Critical Insight

Every other legal AI startup positions as “replace your lawyer.” They attract regulatory scrutiny, they can’t partner with firms, and they carry enormous liability for every wrong answer.

We position as “prepare for your lawyer.” Lawyers become our distribution channel, the Law Society is neutral-to-supportive, and our liability threshold is dramatically lower because every output ends with “discuss this with a qualified lawyer.”

**This is not a compromise. This is a strategic advantage.**

-----

## 3. UX PRINCIPLES (Derived from Positioning)

### Principle 1: Value First, Trust Second, Data Third

The user must receive value before we ask for trust, and trust before we ask for sensitive data.

```
Step 1: FREE value (eligibility assessment, legal context) ← No PII required
Step 2: Build trust (explain privacy, show credentials) ← No PII required
Step 3: Optional deeper analysis (requires some personal data) ← Ghost Data Protocol
Step 4: Lawyer referral (natural next step, not upsell) ← Revenue event
```

**Build Implication**: The eligibility scanner’s first 2 steps must require ZERO personally identifiable information. Only ask for sensitive data (financial details, HDB info, CPF) AFTER the user has already received preliminary value.

### Principle 2: Every Output Is Preparation, Not Conclusion

No screen, no result, no generated text should feel like a final answer. Everything should feel like it’s preparing the user for a productive next step.

**Build Implications**:

- Result pages end with “Here’s what to discuss with your lawyer” — not “Here’s your answer.”
- Complexity scores above threshold trigger: “Your situation has factors that benefit from professional guidance.”
- Language is always conditional: “Based on what you’ve shared, the relevant statutory framework is…” — never “You qualify for…” or “You should file for…”
- Every assessment includes a “What to bring to your lawyer” checklist generated from the user’s inputs.

### Principle 3: Clinical Compassion

Users are in crisis (divorce, job loss, legal disputes). The tone is warm but professional. Think: the best nurse you’ve ever had — competent, calm, empathetic, but never overstepping into the doctor’s role.

**Build Implications**:

- No exclamation marks in results or assessments.
- No celebratory language (“Great news! You qualify!”).
- No catastrophizing (“Warning: your situation is extremely complex”).
- Measured, calm, factual: “Based on the information provided, here is the relevant legal framework for your situation.”
- This is already encoded in the Clinical Compassion Protocol system prompt in `@repo/legal-engine`. All user-facing LLM outputs must route through this prompt.

### Principle 4: Transparency Is a Feature

Our Ghost Data Protocol is a competitive advantage, not just an implementation detail. Make it visible.

**Build Implications**:

- Every app gets a `/how-we-protect-your-data` page explaining encryption in plain language.
- The eligibility scanner shows a brief privacy note before collecting any data: “Your information is encrypted before it leaves your device. We cannot read your personal details.”
- Results pages include a small “🔒 Your data is encrypted” indicator.
- The PDPA consent modal (already built in M8) is prominent, not buried.

-----

## 4. LANGUAGE RULES (For All LLM-Generated Content)

### Hard Rules — Violations Are Build-Blocking Bugs

|Rule |Correct |Incorrect |
|----------------------|-------------------------------------------------------------|-----------------------------|
|Never prescribe action|“Individuals in this situation may consider…” |“You should file for…” |
|Never predict outcomes|“The statutory framework provides for…” |“You will likely receive…” |
|Never claim expertise |“Based on the Women’s Charter, Section 95(3)…” |“In our legal opinion…” |
|Always cite statutes |“Under Section 95(3)(a) of the Women’s Charter…” |“The law says you can…” |
|Always disclaim |End every assessment with disclaimer |Omit disclaimer for brevity |
|Never use “advice” |“Legal information” / “Legal context” |“Our advice” / “We advise” |
|Refer to lawyers |“We recommend discussing this with a qualified family lawyer”|“We recommend filing for DMA”|

### The Mandatory Disclaimer

Every assessment output must include this (or a domain-appropriate variant):

> “This is legal information, not legal advice. It is based on publicly available Singapore statutes and is intended to help you understand your situation. For advice specific to your circumstances, please consult a qualified lawyer. The Law Society of Singapore maintains a directory of practitioners at lawsociety.org.sg.”

**Build Implication**: This disclaimer must be a shared component in `@repo/ui-legal`, not hardcoded per-app. It should be impossible to render an assessment result without this component.


-----

## 5. GO-TO-MARKET STRATEGY

### Phase 1: Pre-Launch (NOW → Launch Day)

**Spend: $0. Sweat equity only.**

Build SEO-optimized guide pages on sg-divorce that rank for high-intent Singapore divorce queries. These are the top of funnel. Each guide ends with a CTA to the free eligibility scanner.

Priority guide pages:

1. `/guides/divorce-by-mutual-agreement-singapore` — DMA is new (2024), underserved in search.
1. `/guides/hdb-flat-divorce-singapore` — #1 financial anxiety topic.
1. `/guides/cpf-split-divorce-2026` — Timely due to CPF SA closure changes.
1. `/guides/divorce-cost-singapore` — Pure commercial intent.
1. `/guides/eligibility-check-divorce-singapore` — Product page disguised as guide.

**Build Implication**: These are static Next.js pages in sg-divorce. No new infrastructure. Content follows UPL language rules above. Each page has structured data (FAQ schema, HowTo schema) for Google rich results.

### Phase 2: Launch Month

**Spend: ~$1,500/month Google Ads.**

Single campaign targeting Singapore. Ad groups mapped to guide pages. Keywords: “file for divorce Singapore,” “HDB flat divorce,” “DMA divorce Singapore,” “divorce cost Singapore.” Phrase match only. Conversion event: eligibility scanner completion.

**Build Implication**: GA4 conversion tracking must be wired to scanner completion event. Build a simple `/api/analytics/conversion` endpoint that fires on result page render.

### Phase 3: Post-Launch (Months 2-6)

**Spend: $1,500 Google Ads + $1,500 strategic (lawyer outreach, content, community).**

Double down on what works. Kill what doesn’t. Pursue lawyer referral partnerships actively. Target: 1 signed referral partner within 60 days of launch.

### Channel Priority

|Channel |Priority|Why |
|-----------------------|--------|--------------------------------------------------|
|Google Search (organic)|#1 |Users are researching. Intercept them. |
|Google Ads (paid) |#2 |Accelerate what organic does naturally. |
|Lawyer partnerships |#3 |Trust signal + revenue + distribution. |
|Community (HWZ, Reddit)|#4 |Build presence, not for direct acquisition. |
|Social media |NOT NOW |Nobody impulse-clicks a divorce tool on Instagram.|

-----

## 6. COMPETITIVE POSITIONING

### What Exists in Singapore Today

|Competitor |What They Do |Our Advantage |
|--------------------------------|--------------------------------------------|--------------------------------------------------------------|
|SingaporeLegalAdvice.com |Blog content, lawyer directory |We provide interactive assessment, not static articles |
|Law firm websites |Marketing-oriented, generic FAQs |We provide personalized, statute-cited preparation |
|Free legal clinics (Law Society)|In-person, limited availability |We’re available 24/7, private, no appointment needed |
|Generic AI (ChatGPT, etc.) |General-purpose, no Singapore specialization|We have a deterministic legal engine with statutory guardrails|

### Our Moat (in order of defensibility)

1. **Singapore-specific statutory engine** — No global player will build this for a 5.9M person market.
1. **Ghost Data Protocol** — Enterprise-grade privacy that most competitors can’t match.
1. **Lawyer partnerships** — Once signed, switching costs are high for both sides.
1. **SEO content authority** — First-mover on DMA, CPF SA closure, Platform Workers Bill content.
1. **Speed to market** — We ship while others plan.

-----

## 7. DATA STRATEGY

### Approved Data Sources (Legal, Free, No Scraping Risk)

|Source |URL |Content |Usage Rights |
|-------------------------|---------------------------|--------------------------------------------|-------------------------------------------------------|
|Singapore Statutes Online|sso.agc.gov.sg |All current legislation, historical versions|Free, explicit reproduction permission with attribution|
|LawNet OpenLaw |lawnet.sg (OpenLaw section)|Court judgments from 1965 |Free, open access |
|LawNet Free Resources |lawnet.sg (Free section) |Last 3 months of judgments |Free, rolling window |
|CommonLII |commonlii.org |Singapore case law from 2005+ |Open access legal information |
|Singapore Law Watch |singaporelawwatch.sg |Supreme Court judgments from 2000 |Free, published by SAL |
|Parliament Hansard |parliament.gov.sg |Parliamentary debates |Free, public record |
|HDB / CPF / MOM websites |.gov.sg domains |Policy documents, calculators, guides |Government public information |

### Prohibited Data Sources

|Source |Why |
|----------------------------------|----------------------------------------------------------|
|LawNet (paid/subscription content)|Terms prohibit reproduction without SAL written permission|
|Singapore Law Reports (SLR) |Copyrighted by SAL, subscription-only |
|Any scraped personal data |PDPA violation |

### Data Architecture for RAG

Build a curated, domain-specific knowledge base per app:

**sg-divorce** (~50-100 documents):

- Full text of Women’s Charter (from SSO)
- 10-15 landmark Family Court decisions on ancillary matters, DMA, custody (from OpenLaw/CommonLII)
- HDB and CPF policy documents on divorce procedures (from .gov.sg)
- Parliamentary debates on 2024 Women’s Charter amendments (from Hansard)
- Family Justice Courts practice directions (publicly available)

Embed using `text-embedding-004`, store in selected vector DB. The edge is not volume — it’s curation and structured retrieval. 50 right documents beat 5,000 random ones.

-----

## 9. LAUNCH SEQUENCE (LOCKED)

|Order|Domain |Status |Notes |
|-----|--------------------------------------|---------------------------|--------------------------------------------------------------|
|**1**|B2B SME Suite: `sggrant.ai`, `sgvisa.ai`, `sgimport.ai`|🔄 PARALLEL ACTIVE |Conversational Flagships — shared Turborepo architecture. |
|**2**|B2C Law Student Assistant (IRAC RAG Engine)|🛠️ ACTIVE DEVELOPMENT |Academic tool — zero UPL risk. See Section 13. |
|**3**|B2B Legal Drafting SaaS (Family Law FJC 2024)|📐 ARCHITECTURE DESIGNED / ON DECK|Deterministic legal engine with statutory guardrails. |
|**4**|`sgfairwork.ai`, `sgwills.ai` |⏸️ PAUSED |Deprioritized pending revenue validation from Orders 1-3. |

**Validation Chain**:
- Order 1 (`sggrant`, `sgvisa`, `sgimport`) → validates B2B/non-legal-advice model with zero UPL risk
- Order 2 (Law Student IRAC Engine) → validates B2C/academic RAG pipeline with zero UPL risk
- Order 3 (Legal Drafting SaaS) → validates B2B/legal-drafting model with FJC 2024 compliance
- Order 4 (`sgfairwork`, `sgwills`) → resumes after revenue signal from Orders 1-3

-----

## 10. SUCCESS METRICS

### Pre-Launch (Now → Launch)

|Metric |Target |
|------------------------------|--------------------------------------|
|Admin SDK integrity test |GREEN |
|Eligibility scanner end-to-end|Functional with curated knowledge base|
|Beta test (1 real user) |Completed with feedback incorporated |
|Lawyer review |Accuracy validated by practitioner |
|Guide pages live |Minimum 2 published |
|Production deployment |Live on sgdivorce.ai |

### Post-Launch (Months 1-3)

|Metric |Target |
|---------------------------|--------------------------------|
|Monthly scanner completions|100+ |
|Organic traffic |500+ sessions/month |
|Lawyer referral partner |1 signed |
|Google Ads CPA |< $15 SGD per scanner completion|
|User feedback score |Net positive |

### Post-Launch (Months 4-6)

|Metric |Target |
|------------------------------|------------------------|
|Monthly scanner completions |500+ |
|Referral revenue |$1,000+ SGD/month |
|Organic traffic |2,000+ sessions/month |
|Referral partners |2-3 signed |
|Launch 2 (sgfairwork) decision|GO / NO-GO based on data|

-----

## 11. MASTER RULES FOR ALL AGENTS

1. **Every feature must serve the “preparation tool” positioning.** If it feels like legal advice, redesign it.
1. **Every user-facing output routes through the Clinical Compassion Protocol.** No exceptions.
1. **Every assessment ends with a lawyer referral path.** This is our revenue event and our regulatory shield.
1. **The disclaimer component is non-removable.** It ships on every result page across every app.
1. **Data comes from approved sources only.** See Section 8. No scraping LawNet. No fabricating citations.
1. **Guide content cites real statutes.** Every legal claim in marketing content references a specific section number from SSO.
1. **When in doubt, recommend a lawyer.** The confidence gating threshold errs toward “consult a professional” — never toward a definitive answer on ambiguous situations.
1. **Privacy is a feature, not a footnote.** Make Ghost Data Protocol visible to users. It builds trust.
1. **Ship what’s built, then build what’s new.** Do not start new domain apps until the current one has live users.

> **Rule 9 Exception**: The B2B SME Suite (`sggrant`, `sgvisa`, `sgimport`) utilizes a shared Turborepo architecture and may be scaffolded in parallel to maximize code reuse. This exception does NOT apply to legal-domain apps, which must follow sequential launch discipline.

-----

## 12. B2B CONVERSATIONAL ARCHITECTURE

> **Key Distinction**: Unlike legal domains, B2B domains (Grants, Visas, Imports) carry **ZERO UPL liability**. This fundamentally changes the permissible architecture.

### Architectural Split

| Dimension | Legal Apps (`sg-divorce`, `sg-fairwork`, `sg-wills`) | B2B Apps (`sg-grant`, `sg-visa`, `sg-import`) |
|-----------|------------------------------------------------------|-----------------------------------------------|
| Liability | UPL risk — strict guardrails required | Zero UPL liability |
| Chat Mode | Rigid multi-step scanner (intake form → background job → result) | Real-time streaming chat (open conversation) |
| LLM Pipeline | Trigger.dev durable execution (background RAG) | Vercel AI SDK streaming (`useChat` / `streamText`) |
| Tone | Clinical Compassion Protocol (stoic, non-prescriptive) | Friendly, actionable, direct |
| Data | Ghost Data Protocol (AES-256-GCM encrypted PII) | Standard Firestore (no PII encryption required) |

### Implementation Rule
B2B domain apps **MUST** utilize real-time streaming chat via the **Vercel AI SDK**, bypassing the rigid multi-step scanner and Trigger.dev background jobs used in legal domains. The shared `@repo/ui-chat` package provides the conversational UI primitives for all B2B apps.

-----

## 13. B2C LAW STUDENT ARCHITECTURE

> **Domain**: Law Student RAG (SGCA/SGHC Case Law & Statutes).
> **Liability Profile**: Zero UPL risk — this is an academic tool for law students, not legal advice for the public.

### Pipeline

```
Next.js Edge Client → Firebase Storage → Trigger.dev → Gemini Ultra (PDF Ingestion) → Vector DB → Claude Max (IRAC Generation)
```

### Architecture Notes

- **Ingestion**: Law students upload case PDFs and statute extracts via the Next.js client. Files land in Firebase Storage.
- **Processing**: Trigger.dev durable tasks orchestrate PDF parsing. Gemini Ultra extracts structured content (facts, issues, holdings, ratios) from raw PDFs.
- **Embedding**: Extracted content is chunked, embedded via `text-embedding-004`, and stored in the Vector DB for semantic retrieval.
- **Generation**: Claude Max receives retrieved context and generates IRAC-format analysis (Issue, Rule, Application, Conclusion) with full citation chains.
- **Zero UPL Risk**: Output is framed as academic study material. No legal advice disclaimers required — students are learning legal reasoning, not receiving counsel.

-----

## DOCUMENT INTEGRATION

This document is referenced by:

- `/docs/system/CLAUDE_CONTEXT.md` — Claude hot-swap context
- `/docs/system/LAUNCH_SEQUENCE.md` — Locked launch order
- `/docs/agentic-workforce-blueprint.md` — Agent fleet architecture

All agents (Gemini, Claude, Anti Gravity) must treat this document as authoritative for product decisions. Technical architecture decisions defer to `CLAUDE_CONTEXT.md`. Product and positioning decisions defer to this document.

-----

*End of Strategy Bible — This is the source of truth for what we’re building and why.*
