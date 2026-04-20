# Schema

## 1. Schema goals

The schema should:
- preserve useful existing tables
- support async generation workflows
- support future retrieval
- remain simple enough for MVP
- avoid destructive rewrites unless clearly necessary

## 2. Existing core tables to preserve

These are still useful and should remain part of the model:

- `users`
- `contents`
- `likes`
- `follows`

## 3. Revised data model posture

The key shift is this:

**Before:** content was primarily upload-oriented  
**Now:** content can also be generation-originated

That means `contents` becomes the main durable record for both:
- uploaded creative assets
- generated creative assets

## 4. Core tables

### 4.1 users
Purpose:
- user profile metadata linked to auth

Suggested posture:
- keep existing trigger-based profile creation if it works
- do not rebuild auth/user sync unless broken

Example fields:
- `id`
- `username`
- `bio`
- `avatar_url`
- `created_at`

### 4.2 contents
Purpose:
- durable content record for uploaded or generated assets

Recommended fields:
- `id`
- `user_id`
- `title`
- `prompt`
- `revised_prompt`
- `asset_type` (`image`, later `video`, `audio`)
- `status` (`queued`, `processing`, `completed`, `failed`)
- `image_url` or more general asset URL field
- `model_name`
- `seed`
- `parent_content_id`
- `safety_label`
- `quality_score`
- `created_at`

Notes:
- If an existing `contents` table already exists, extend it incrementally
- Avoid dropping old columns unless clearly obsolete

### 4.3 generation_jobs
Purpose:
- durable async execution record for creation requests

Recommended fields:
- `id`
- `user_id`
- `content_id`
- `job_type`
- `input_payload`
- `status`
- `error_message`
- `attempts`
- `created_at`
- `updated_at`

Recommended status set:
- `queued`
- `running`
- `completed`
- `failed`

### 4.4 likes
Purpose:
- user engagement signal
- later useful for taste modeling

### 4.5 follows
Purpose:
- creator graph / future feed relevance

## 5. Retrieval foundation tables

### 5.1 knowledge_documents
Purpose:
- store source documents for retrieval

Recommended fields:
- `id`
- `owner_user_id` (nullable if system-owned)
- `doc_type`
- `title`
- `body`
- `visibility` (`system`, `public`, `private`)
- `metadata`
- `created_at`
- `updated_at`

Initial `doc_type` recommendations:
- `style_guide`
- `policy`
- `prompt_template`

### 5.2 knowledge_chunks
Purpose:
- retrieval units derived from documents

Recommended fields:
- `id`
- `document_id`
- `chunk_index`
- `chunk_text`
- `embedding`
- `metadata`
- `created_at`

Notes:
- chunk-level embeddings live here
- document-level metadata stays in `knowledge_documents`

## 6. Deferred but expected tables

### 6.1 content_embeddings
Purpose:
- semantic search across generated/saved contents

Can wait until retrieval for content discovery becomes important.

Suggested fields:
- `content_id`
- `embedding`
- `source_text`
- `updated_at`

### 6.2 user_taste_profiles
Purpose:
- compact representation of user taste/preferences

Not required for first MVP, but design should leave space for it.

Suggested fields:
- `user_id`
- `summary`
- `embedding`
- `updated_at`

## 7. Relationships

```text
users 1---* contents
users 1---* generation_jobs
contents 1---* generation_jobs (usually one active or most recent primary job)
knowledge_documents 1---* knowledge_chunks
users 1---* knowledge_documents (for private docs if enabled)
```

## 8. Indexing guidance

### Required early
- `contents(user_id)`
- `contents(created_at desc)`
- `generation_jobs(user_id, created_at desc)`
- `generation_jobs(content_id)`
- `knowledge_chunks(document_id, chunk_index)`

### Add when embeddings are active
- vector index on `knowledge_chunks.embedding`
- vector index on `content_embeddings.embedding`

## 9. RLS / access model

### users
- user can read/update own profile
- public profile reads can be allowed if product needs it

### contents
- owners can fully manage own draft/pending/generated content
- public visibility rules can evolve later

### generation_jobs
- owner can read own jobs
- owner cannot spoof ownership

### knowledge_documents
- `system`: application-owned, readable where intended
- `public`: shared/readable
- `private`: only owner can read

### knowledge_chunks
- access should inherit from parent document visibility rules

## 10. Migration strategy

### Phase 1
- keep existing `users`, `contents`, `likes`, `follows`
- add/extend `contents` status-related fields only if missing
- add `generation_jobs`

### Phase 2
- add `knowledge_documents`
- add `knowledge_chunks`
- enable vector support if needed

### Phase 3
- add `content_embeddings`
- add `user_taste_profiles`

## 11. Design notes

- Prefer additive migrations
- Preserve current production/dev data where possible
- Keep generated asset metadata in `contents`
- Keep execution state in `generation_jobs`
- Keep retrieval source documents separate from user content
