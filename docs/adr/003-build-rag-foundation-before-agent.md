# ADR 003 — Build RAG foundation before complex agent workflows

## Status
Accepted

## Context
ABox aims to become more intelligent over time, but jumping directly to large agent frameworks would create complexity before the foundations are reliable.

## Decision
Build retrieval and planning foundations before adding complex autonomous agent behavior.

## Why
- retrieval improves real product quality sooner
- easier to test and evaluate
- less architectural risk than speculative agent systems
- better fit for MVP scope

## Consequences
- AI workflow stays shallow at first
- document/chunk/embedding infrastructure becomes a priority
- future agent features will have a cleaner base to build on
