# ABox

ABox is an AI creator publishing platform.

Core loop: creation, sharing, remix, monetization, community.

## Stack

- **Next.js 16** (App Router)
- **TypeScript** (strict mode)
- **Tailwind CSS v4**
- **Supabase** (PostgreSQL, Auth, Storage)
- **Vercel** (deployment)

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project

### Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy the environment file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

4. Run the database migration in your Supabase SQL editor:

```
supabase/migrations/00001_initial_schema.sql
```

5. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/            # Routes and page composition
├── components/     # Reusable UI components
├── features/       # Feature-scoped modules (future)
├── hooks/          # Custom React hooks (future)
├── lib/            # Infrastructure (Supabase client, auth, storage, mappers)
├── services/       # Business logic and domain workflows
└── types/          # Domain models and service contracts
```

## Architecture

- **UI Layer** — pages, layouts, components
- **Service Layer** — business workflows, validation, authorization
- **Data Layer** — Supabase client, storage, DB query modules

UI never directly accesses the database. Business logic lives in services.
