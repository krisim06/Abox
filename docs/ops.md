# Operations

## 1. Purpose

This document explains how to run and maintain ABox locally during MVP development.

## 2. Core services

- Next.js app
- Supabase project
- Postgres schema/migrations
- Storage bucket(s)
- future generation worker / job processor

## 3. Environment variables

Expected categories:
- app URL
- Supabase URL/key
- Supabase service role key
- generation provider credentials
- embedding provider credentials
- optional logging/monitoring keys

Keep exact variable names aligned with the codebase.

## 4. Local development workflow

1. install dependencies
2. start local app
3. run/verify DB migrations
4. confirm auth works
5. confirm storage access works
6. test prompt submission flow
7. test job lifecycle transitions
8. seed retrieval docs when retrieval foundation is active

## 5. Migrations

Rules:
- make migrations additive when possible
- write clear migration names
- test on local/dev before pushing further
- do not combine unrelated schema changes in one migration

## 6. Seed data

Useful seed categories:
- one or two test users
- style guide documents
- policy documents
- prompt templates
- a small set of representative generated/uploaded contents

## 7. Job processing posture

In MVP development, job processing may start with:
- stubbed completion flow
- manual trigger
- simple worker
- provider callback or polling

The important part is:
- durable status model
- predictable failure handling

## 8. Troubleshooting checklist

### Prompt submit fails
- check auth session
- check route handler validation
- check DB insert permissions
- check content/job creation transaction path

### Job stuck in queued
- check worker/executor path
- check status update logic
- check provider credentials / stub path

### Retrieval returns nothing
- check document/chunk creation
- check embeddings availability
- check visibility filters
- check top-k settings

## 9. Release hygiene

Before merging major changes:
- run migrations cleanly
- test main happy path end-to-end
- verify docs changed with the code
- verify no dead experimental code remains
