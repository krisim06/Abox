# ABox Agent Guide

## Project Summary

ABox is an AI creator publishing platform.

It is not primarily an AI generation product.
It is a publishing, remix, discovery, and creator-platform product.

The product starts image-first.

Core loop:

- creation (창작)
- sharing (공유)
- remix (재창작)
- monetization (수익화)
- community (커뮤니티)

---

## Product Strategy

ABox should begin as a creator tool and publishing platform first.

Priority order:

1. creator utility
2. publishing
3. remix
4. discovery
5. community
6. monetization

Do not build unnecessary platform features too early.

---

## MVP Scope

The MVP should include:

- authentication
- content upload
- content detail page
- public feed
- creator profile
- remix flow
- parent-child remix relationship

Do not include yet unless explicitly requested:

- payments
- advanced recommendation systems
- internal AI generation
- complex social graph systems
- real-time notifications
- admin dashboards

---

## Remix Philosophy

The initial remix experience should be simple for users, but the data model must support future expansion.

User-facing MVP:

- remix this content
- prefill prompt/model/seed
- save as new content

Internal requirement:

- preserve parent-child relationship
- enable future remix tree / lineage graph

Always protect future support for:

- fork systems
- derived content lineage
- attribution
- remix discovery

---

## Engineering Philosophy

Build the smallest version that is:

- real
- clean
- extensible
- production-sound

Avoid:

- fragile shortcuts
- architecture drift
- mixing concerns
- fake abstractions

The codebase should feel like a real startup product, not a demo app.

---

## Implementation Priorities

When building, prioritize in this order:

1. correctness
2. clarity
3. maintainability
4. speed
5. extensibility

Do not sacrifice correctness for speed in core flows.

---

## Required Workflow

Before implementation:

1. read `/docs/prd.md`
2. read `/docs/schema.md`
3. read `/docs/architecture.md` if present
4. inspect related existing files
5. propose a short implementation plan

Implementation:

- work incrementally
- keep changes scoped
- follow layered architecture
- preserve consistency

After implementation:

- verify types
- verify imports
- verify no architecture violations
- verify edge cases for the changed flow

---

## Architecture Rules

Preferred high-level structure:

- app/ for routing and page composition
- components/ for reusable UI
- features/ for feature-scoped modules
- services/ for business workflows
- lib/ for infrastructure
- types/ for contracts and domain models

UI should not directly access the database.

Business logic belongs in services.

---

## Data and Access Rules

Assume user input is untrusted.

Always think about:

- ownership
- authorization
- validation
- file safety
- pagination
- future indexing
- service boundaries

When changing schema-sensitive logic, consider:

- foreign keys
- indexes
- constraints
- row-level security
- migration safety

---

## Quality Bar

All code should be good enough that:

- another engineer can onboard quickly
- future features can be added without rewrites
- the code would not be embarrassing in a strong startup code review

The standard is:
clean, minimal, structured, production-ready.

---

## What Good Looks Like

Good output from the agent includes:

- clear file boundaries
- strong typing
- minimal but solid abstractions
- explicit error handling
- sensible naming
- simple UI composition
- room for future growth

Bad output includes:

- giant files
- logic mixed into pages
- duplicated queries
- weak typing
- unsafe assumptions
- “just make it work” code

---

## Final Rule

Always build as a pragmatic product engineer.

That means:

- move fast
- but protect the codebase
- choose simple solutions
- but don’t create future traps
- ship real product quality