# ABox Cursor Engineering Rules

You are working on ABox, an AI creator publishing platform.

Your job is to generate code that is clean, production-ready, maintainable, scalable, and suitable for a high-quality startup codebase.

Always optimize for:
- product velocity
- code clarity
- maintainability
- scalability
- reliability
- security
- developer experience

Never optimize for:
- cleverness
- unnecessary abstraction
- premature complexity
- hacky shortcuts

---

## 1. Engineering Standard

Write code as if:
- it will be reviewed by senior engineers
- it will be extended by future teammates
- it may become the foundation of a large product
- it must be understandable in 6 months

The code must feel:
- intentional
- minimal
- structured
- readable
- testable

Do not generate messy MVP code.

---

## 2. Product Context

ABox is an AI creator publishing platform focused on:

- creation (창작)
- sharing (공유)
- remix (재창작)
- monetization (수익화)
- community (커뮤니티)

Initial scope is image-first.

Core MVP features:
- authentication
- content upload
- public feed
- creator profile
- remix relationship
- content detail pages

Future features:
- remix tree
- notifications
- collections
- search
- monetization
- moderation
- ranking
- analytics

---

## 3. Technology Stack

Use the following stack unless explicitly told otherwise:

- Next.js App Router
- TypeScript with strict mode
- Tailwind CSS
- Supabase (PostgreSQL, Auth, Storage)
- Vercel

Prefer:
- Server Components
- Route Handlers / Server Actions
- small reusable components
- typed service-layer APIs

Avoid adding new dependencies unless clearly justified.

---

## 4. Architecture

Always follow this layered architecture:

UI Layer
→ Application / Service Layer
→ Data Access Layer
→ External Services / Database

Rules:
- UI components must never directly contain business logic
- UI components must never directly query the database
- business logic belongs in services
- database access belongs in dedicated data access modules or service internals
- external provider logic must be isolated

Prefer this folder structure:

- app/
- components/
- features/
- services/
- lib/
- types/
- hooks/

If a feature grows, organize by feature module.

Example:
- features/content/
- features/remix/
- features/profile/

---

## 5. Separation of Concerns

Strictly separate:
- UI rendering
- domain logic
- validation
- persistence
- authorization
- side effects

Do not mix all of these in a single file.

Prefer:
- route/page handles request and composition
- service handles domain workflow
- lib handles infrastructure
- types define contracts

---

## 6. TypeScript Rules

Use strict TypeScript.

Never use:
- any
- ts-ignore
- unsafe casts without explanation

Prefer:
- explicit return types for exported functions
- shared domain types
- discriminated unions for states
- narrow, composable interfaces

All shared types should live in `/types` or feature-local type files.

Always model important entities explicitly.

Examples:
- User
- Content
- RemixRelation
- FeedItem
- UploadPayload
- ServiceResult

---

## 7. React / Next.js Rules

Prefer Server Components by default.

Use Client Components only when necessary for:
- interactivity
- browser APIs
- local state
- event handlers

Do not mark components as client unless required.

Avoid unnecessary:
- useEffect
- useMemo
- useCallback

Do not fetch data on the client if server fetching is sufficient.

Prefer:
- server-side composition
- streaming-friendly patterns
- stable props
- stateless presentational components

Pages should be thin and focused.

---

## 8. UI Standards

UI should be:
- clean
- simple
- consistent
- accessible
- composable

Use Tailwind utility classes cleanly.

Avoid:
- large unreadable class strings without grouping
- duplicated UI patterns
- inconsistent spacing or typography
- deeply nested JSX

Extract reusable UI primitives when patterns repeat.

Prefer:
- ContentCard
- UserAvatar
- EmptyState
- SectionHeader
- RemixBadge

All interactive elements must have sensible states:
- loading
- empty
- error
- success

---

## 9. Naming Conventions

Use consistent naming:

Files:
- kebab-case

React components:
- PascalCase

Variables and functions:
- camelCase

Types / interfaces:
- PascalCase

Constants:
- SCREAMING_SNAKE_CASE when truly constant

Services:
- content-service.ts
- remix-service.ts
- profile-service.ts

Avoid vague names like:
- data
- item
- temp
- thing
- helper

Names should be domain-specific.

---

## 10. Service Layer Rules

All business workflows must go through services.

Examples:
- createContent
- remixContent
- getFeed
- getProfileByUsername
- toggleLike

Services should:
- validate assumptions
- enforce authorization
- handle transactions if needed
- return structured results
- isolate domain behavior

Prefer returning typed results over throwing for expected user-facing failures.

Example shape:
- success: true / false
- data
- errorCode
- message

---

## 11. Database Rules

Database access must be centralized and intentional.

Never:
- scatter Supabase queries throughout components
- duplicate the same query logic in multiple files
- rely on implicit database behavior without documenting it

Prefer:
- one database client utility
- one clear query path per domain operation
- typed mapping between DB rows and domain models

Design schema and code for:
- future indexing
- pagination
- access control
- auditability

Be mindful of:
- N+1 queries
- repeated fetches
- over-fetching columns
- weak filtering

Whenever creating or changing schema-related logic, also consider:
- indexes
- constraints
- foreign keys
- cascading strategy
- row-level security implications

---

## 12. Validation Rules

Treat all input as untrusted.

Validate:
- form input
- params
- search params
- uploaded metadata
- service inputs

Prefer explicit validation schemas.

Sanitize user-controlled text where relevant.

Never trust:
- client input
- hidden fields
- route params
- uploaded metadata

---

## 13. Authentication and Authorization

Authentication and authorization are separate concerns.

Always verify:
- who the user is
- what the user is allowed to do

Do not assume the authenticated user owns a resource.

Check authorization in service-layer workflows.

Examples:
- only owner can edit/delete content
- only authenticated users can like/remix/upload
- private resources must not leak through route handlers

---

## 14. Security Rules

Security is mandatory even in MVP.

Never:
- expose secrets
- hardcode API keys
- trust raw file uploads blindly
- leak internal errors to users

Always use environment variables for secrets.

Be careful with:
- upload validation
- content ownership checks
- SSR data leakage
- over-permissive API routes
- unsafe redirects
- user-generated text rendering

Prefer secure defaults.

---

## 15. Upload and Media Rules

Uploads are a core product path.

For media uploads:
- validate file type
- validate file size
- fail safely
- store stable metadata
- generate predictable storage paths
- keep ownership association

Never assume uploaded files are valid.

Design upload logic so it can later support:
- image optimization
- moderation
- CDN migration
- storage provider migration
- asynchronous processing

---

## 16. Error Handling Rules

Handle errors deliberately.

Do not silently swallow errors.

Distinguish between:
- user errors
- validation errors
- authorization errors
- infrastructure errors
- unexpected system errors

Return user-friendly messages to UI.

Log internal details separately.

Expected failures should be handled gracefully.
Unexpected failures should be observable.

---

## 17. Logging and Observability

Critical flows must be observable.

Important events to log:
- sign up / sign in failures
- upload attempts
- content creation failures
- remix creation
- authorization failures
- storage failures
- unexpected exceptions

Logs should help answer:
- what happened
- to whom
- when
- in which feature
- with what outcome

Do not log secrets or sensitive private data.

Design code so analytics and monitoring can be added later without major rewrites.

---

## 18. Performance Rules

Optimize for practical performance.

Avoid:
- unnecessary client-side fetching
- excessive re-renders
- oversized payloads
- duplicated data requests
- unbounded queries

Prefer:
- pagination
- selective field queries
- memoization only when justified
- server-rendered data
- image optimization-aware design

Build APIs and services assuming feed and profile pages will eventually scale.

---

## 19. Scalability Rules

Even in MVP, avoid decisions that force a rewrite later.

Design with future support for:
- pagination
- ranking
- search
- moderation
- analytics
- notifications
- feature flags
- caching
- background jobs

Do not build those systems yet unless asked.
Just avoid blocking them.

---

## 20. Maintainability Rules

Keep files reasonably small and focused.

As a guideline:
- one file should have one clear responsibility
- avoid giant components
- avoid giant service files
- break down repeated patterns

If logic becomes complicated:
- extract helper functions
- extract domain modules
- add targeted comments for why

Prefer boring, understandable code.

---

## 21. Testing Readiness

Code should be testable even if tests are not written yet.

Prefer:
- pure functions where possible
- dependency boundaries
- predictable service interfaces
- small units of logic

Avoid:
- deeply coupled code
- hidden side effects
- logic embedded in JSX

When writing complex logic, structure it so unit tests can be added later with minimal changes.

---

## 22. Comments and Documentation

Use comments sparingly.

Comments should explain:
- why a decision exists
- non-obvious constraints
- important tradeoffs

Do not comment obvious code.

When implementing a non-trivial feature, keep docs aligned if relevant.

---

## 23. Git / Change Discipline

When making changes:
- preserve existing architecture consistency
- do not rewrite unrelated code
- do not introduce broad churn without reason
- implement incrementally

Prefer small, reviewable changes.

If a requested feature is large:
1. make a plan
2. identify affected files
3. implement in steps
4. verify types and imports

---

## 24. AI Agent Execution Rules

Before implementing:
1. read relevant docs in `/docs`
2. inspect existing patterns in the codebase
3. propose a concise plan
4. implement step-by-step

After implementing:
1. check for type consistency
2. check for import cleanliness
3. check for architecture violations
4. check for obvious edge cases

Do not produce large speculative rewrites.

If something is ambiguous, choose the simplest production-sound approach.

---

## 25. Senior Engineer Rule

Act like a pragmatic senior engineer.

That means:
- protect codebase quality
- do not overengineer
- do not underengineer critical paths
- make tradeoffs explicit
- keep MVP speed high without creating hidden chaos
- leave the codebase better than you found it

Every implementation should balance:
- speed today
- flexibility tomorrow
- clarity for future teammates

Generate code that a strong startup engineering team would accept.