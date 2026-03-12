# ABox Architecture

## Product Type

ABox is an AI creator publishing platform.
It is not an AI model company.
It is a creator-platform product centered around publishing and remix relationships.

---

## Initial Scope

Initial content type:
- image

Initial core domains:
- auth
- content
- remix
- profile
- feed

---

## System Layers

### UI Layer
Responsible for:
- page composition
- rendering
- user interactions

Examples:
- pages
- layouts
- reusable presentational components

### Service Layer
Responsible for:
- business workflows
- authorization checks
- validation orchestration
- domain logic

Examples:
- createContent
- getFeed
- remixContent
- getProfileByUsername

### Data Layer
Responsible for:
- database access
- storage access
- row-to-domain mapping

Examples:
- Supabase client
- storage utilities
- DB query modules

---

## Core Entities

### User
A creator account on the platform.

### Content
A published AI-generated work with metadata.

Key fields:
- title
- prompt
- model
- seed
- imageUrl
- creatorId
- parentContentId
- createdAt

### RemixRelation
A parent-child relationship between two content items.

This supports:
- remix flow
- attribution
- future lineage tree
- future fork system

---

## Design Principles

- keep the MVP narrow
- preserve future extensibility
- avoid premature complexity
- prevent architecture drift
- keep UI free of database logic
- make service boundaries explicit

---

## Current Infrastructure

Frontend:
- Next.js App Router
- Tailwind CSS
- TypeScript

Backend:
- Next.js Route Handlers / Server Actions

Database:
- Supabase PostgreSQL

Storage:
- Supabase Storage

Hosting:
- Vercel

---

## Future-Ready Design Requirements

Even in MVP, do not block future support for:
- pagination
- search
- moderation
- analytics
- notifications
- monetization
- storage migration
- feed ranking
- remix trees

---

## Important Constraints

- all user input is untrusted
- content ownership must be enforced
- upload paths must be deterministic
- database access must remain centralized
- UI must stay free of direct database logic
- media upload logic must support future validation and moderation