# Architecture

## 1. Architecture intent

ABox should evolve from a content upload app into an AI-native product without throwing away working foundations. The architecture should support:

- fast MVP delivery
- clean system boundaries
- async generation workflows
- retrieval-augmented generation later
- future personalization
- future tool-based orchestration without an early framework explosion

## 2. Current retained stack

- **Next.js App Router**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **Supabase Auth**
- **Supabase Postgres**
- **Supabase Storage**

This stack remains a good fit for the MVP because it gives:

- fast product iteration
- one operational backend surface
- SQL flexibility
- RLS support
- storage and auth integration
- a simple deployment story

## 3. Architectural principles

1. Preserve working auth and storage
2. Keep route handlers thin
3. Move business logic into service/orchestration modules
4. Keep persistence logic in DB-focused modules
5. Treat generation as an async workflow, not a blocking page action
6. Keep AI-specific logic isolated from UI
7. Build future-compatible tool boundaries without premature MCP infrastructure

## 4. High-level system

```text
User
  -> Next.js UI
  -> Route Handler / API boundary
  -> Application Service / Orchestrator
  -> DB + Storage + Job execution
  -> Content detail / status views
```

Extended future shape:

```text
User
  -> Next.js UI
  -> API Route
  -> Orchestrator
      -> Retrieval layer
      -> Planning layer
      -> Job creation layer
      -> Evaluation layer
  -> Supabase Postgres / Storage
  -> Worker / generation runtime
```

## 5. System layers

### 5.1 UI layer

Responsibilities:

- forms
- user interactions
- loading / status display
- rendering content pages

Must not contain:

- generation orchestration logic
- direct business rules
- data mutation sprawl

### 5.2 Route/API layer

Responsibilities:

- auth/session boundary
- request parsing
- request validation handoff
- calling service/orchestrator
- returning stable response shapes

Must remain thin.

### 5.3 Service / orchestration layer

Responsibilities:

- validating domain-level intent
- coordinating content creation and job creation
- calling retrieval in later phases
- deciding next system action

This is the “application brain,” but not the model itself.

### 5.4 Persistence layer

Responsibilities:

- database queries
- insert/update/select helpers
- transaction-friendly boundaries
- storage persistence helpers

### 5.5 AI layer

Responsibilities:

- request analysis
- retrieval interfaces
- generation plan construction
- future evaluation/retry

This layer should stay separate from transport and UI.

## 6. Primary MVP flow

### Create flow

1. Authenticated user submits prompt
2. API route passes request to service layer
3. Service validates request
4. Content placeholder is created or prepared
5. Generation job is created with `queued` status
6. UI receives content/job identifiers and status
7. Worker or later execution layer processes the job
8. Content status is updated when generation completes or fails

### Read flow

1. User opens content page
2. UI fetches content record and related job/result state
3. Asset and metadata are rendered

## 7. Async generation jobs

Generation must be asynchronous because:

- generation can be slow
- failures need explicit handling
- retries need a durable state model
- status must be observable

This means the architecture must treat generation as a job pipeline rather than a normal request/response function.

## 8. Retrieval foundation

Retrieval is not the first runtime dependency of MVP generation, but it must fit naturally into the architecture.

The insertion point is:

```text
Request -> Analyze -> Retrieve context -> Build plan -> Create/execute job
```

The retrieval layer owns:

- document storage model
- chunking rules
- embedding abstraction
- semantic search

The orchestrator decides when to call retrieval.

## 9. Tool boundary posture

ABox should not add a full MCP server on day one. However, tool boundaries should already be explicit enough that they can later map cleanly to MCP-style interfaces.

Examples:

- get user profile
- retrieve style guides
- create generation job
- save generated asset
- evaluate result

## 10. Observability

At minimum, ABox should log and track:

- job creation success/failure
- job status transitions
- generation error categories
- retrieval requests and empty results
- key latency points

## 11. Security posture

- Auth remains in Supabase
- RLS should govern user-owned records
- visibility rules for knowledge documents must be explicit
- route handlers should never trust client-provided ownership values
- private retrieval should remain permission-aware

## 12. Suggested code organization

```text
src/
  app/
    api/
  lib/
    supabase/
    db/
    ai/
    tools/
    types/
```

Guidance:

- `db/` for persistence logic
- `ai/` for retrieval/planning/evaluation logic
- `tools/` for external or tool-like boundaries
- `types/` for shared domain types

Adapt to the existing project if it already has acceptable organization.

## 13. Scale path

### Now

- single web app + database + storage
- async generation jobs
- clean module boundaries

### Next

- RAG document/chunk foundation
- generation planning
- evaluator + retry
- user taste memory

### Later

- richer workers
- multi-modal generation
- more advanced tool orchestration
- MCP-compatible or MCP-backed integrations if justified

## 14. Architectural non-goals

Not doing yet:

- microservices for the sake of it
- distributed agent frameworks
- speculative infra layers
- abstract plugin systems with no clear use

## 15. Summary decision

ABox should be built like a serious startup product:

- lean now
- structured enough to grow
- careful with rewrites
- explicit in data and workflow boundaries

