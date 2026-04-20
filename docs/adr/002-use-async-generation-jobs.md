# ADR 002 — Use async generation jobs for AI creation

## Status
Accepted

## Context
Generation is slow, failure-prone, and not a clean fit for a synchronous page request.

## Decision
Model creation requests as durable async jobs.

## Why
- explicit lifecycle
- safer failure handling
- retry support
- observability
- cleaner UX around pending/running/completed states

## Consequences
- requires job table and status model
- pushes architecture toward cleaner service boundaries
- creates a stable place to attach evaluation and retries later
