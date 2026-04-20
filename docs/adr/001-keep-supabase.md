# ADR 001 — Keep Supabase as the backend foundation

## Status
Accepted

## Context
ABox already uses Supabase for auth, database, and storage. The project also already solved important auth/profile issues through existing patterns.

## Decision
Keep Supabase as the backend foundation for the MVP.

## Why
- working auth should not be rewritten casually
- Postgres gives enough flexibility for content + jobs + retrieval tables
- Storage is already integrated
- RLS is useful for user-owned content and future private retrieval
- operational simplicity matters for a startup MVP

## Consequences
- move faster in the short term
- keep one coherent backend surface
- revisit only if product constraints clearly outgrow it
