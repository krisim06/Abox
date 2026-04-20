# Implementation Plan

## 1. Objective

Evolve the existing ABox codebase into a clean AI MVP without rebuilding foundations that already work.

## 2. Current reusable foundations

Likely reusable from the existing project:
- Next.js app structure
- Supabase project/config
- auth flow
- user profile creation trigger
- storage bucket configuration
- existing `users`, `contents`, `likes`, `follows`
- content detail page patterns
- shared UI primitives

## 3. Keep / refactor / delete posture

### Keep
- auth integration
- Supabase client setup
- profile trigger if stable
- storage primitives
- useful detail page patterns
- reusable styles/components

### Refactor
- create flow
- contents data model
- API routes
- any upload-only assumptions
- content detail page if it assumes only uploads
- any mixed UI/business logic

### Delete or postpone
- duplicate experimental code
- dead upload-only paths that fight the new direction
- speculative agent frameworks
- speculative personalization infrastructure before core job flow works

## 4. Phase plan

### Phase 0 — Audit and alignment
Deliverables:
- review current routes and key tables
- identify keep/refactor/delete list
- confirm migration strategy

Exit criteria:
- no uncertainty around what code remains foundational

### Phase 1 — Async generation foundation
Deliverables:
- `generation_jobs` table
- content status lifecycle
- prompt submission API
- service layer for job creation
- content placeholder or generation-linked content creation

Exit criteria:
- user can submit a prompt and a durable generation job is created cleanly

### Phase 2 — Retrieval foundation
Deliverables:
- `knowledge_documents`
- `knowledge_chunks`
- embedding abstraction
- chunking logic
- semantic retrieval
- seed docs for style/policy/templates

Exit criteria:
- retrieval can return useful chunks for a test query

### Phase 3 — Generation planning
Deliverables:
- request analysis
- retrieval hook
- plan builder
- revised prompt / generation plan persistence
- clean handoff from plan to job execution

Exit criteria:
- generation request is no longer a raw prompt passthrough

### Phase 4 — Evaluation and retry
Deliverables:
- result evaluator
- basic rubric
- one retry policy
- error/failure categorization

Exit criteria:
- generation quality and failure modes are at least minimally observable

### Phase 5 — Personalization foundation
Deliverables:
- taste signals from likes/history
- user taste profile model
- retrieval-aware generation hooks

Exit criteria:
- user-specific context can affect generation in a controlled way

## 5. Recommended implementation order inside the repo

1. Migrations
2. Shared types
3. DB modules
4. Service/orchestrator modules
5. Thin API routes
6. UI adaptation
7. Tests / manual validation
8. Docs update

## 6. Risks and mitigations

### Risk: old upload assumptions leak everywhere
Mitigation:
- refactor create flow around generation jobs first

### Risk: auth gets rewritten accidentally
Mitigation:
- explicitly protect working auth paths

### Risk: retrieval gets bolted into route handlers
Mitigation:
- define retrieval layer before connecting it

### Risk: evaluation never gets added
Mitigation:
- keep `evals.md` current and treat it as part of product quality, not a future nice-to-have

## 7. What success looks like

ABox should feel like:
- one coherent product
- one coherent schema
- one coherent workflow

Not:
- old upload app + new AI code glued on top.
