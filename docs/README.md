# ABox Documentation Bundle

This bundle is a revised, AI-native documentation set for **ABox**, designed for an early-stage startup project that is evolving from a content upload app into an AI creation and sharing platform.

## What changed

The previous ABox direction centered on:

- authentication
- profile creation
- image upload
- content display
- likes/follows

The revised direction centers on:

- prompt-based creation
- async generation jobs
- AI orchestration
- retrieval-augmented context
- future personalization
- clean boundaries for scaling the product without rewriting the foundation

## Recommended reading order

1. `prd.md`
2. `architecture.md`
3. `schema.md`
4. `implementation-plan.md`
5. `ai-system.md`
6. `rag.md`
7. `evals.md`
8. `roadmap.md`
9. `rules.md`

## Supporting docs

- `api-contracts.md`
- `security.md`
- `ops.md`
- `adr/`

## Working assumptions

- Existing stack remains: **Next.js + Supabase + Tailwind + TypeScript**
- Working auth, storage, and base content flows should be preserved where possible
- Rewrites should be selective, not emotional
- MVP should stay lean, but the architecture should not look like a throwaway demo

## Current implementation posture

- Preserve the useful base
- Add async generation infrastructure first
- Add retrieval foundation second
- Connect retrieval into generation planning next
- Add evaluation/retry before full agent complexity