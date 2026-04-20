# Security

## 1. Security goals

ABox must protect:
- user identity/session
- private content and metadata
- future private knowledge documents
- generation job ownership
- secrets/provider credentials

## 2. Auth posture

- Keep Supabase Auth as the primary identity system
- Do not trust client-provided `user_id`
- Derive ownership from authenticated session on the server
- Do not rewrite working profile creation logic unless broken

## 3. RLS posture

### Contents
- owner can read/write own pending/generated content
- future public visibility must be explicit

### Generation jobs
- owner can read own jobs
- status updates should come from trusted server/worker paths

### Knowledge documents
- `system`: controlled by the application
- `public`: readable where intended
- `private`: owner only

### Knowledge chunks
- access must inherit from parent document visibility

## 4. Storage posture

- prefer private buckets by default unless a public asset model is explicitly intended
- use signed URLs where appropriate
- do not allow clients to write arbitrary ownership metadata

## 5. Secrets

Keep in environment variables:
- Supabase service keys
- generation provider keys
- embedding provider keys
- internal webhook/shared secrets if used

Never expose server secrets to client bundles.

## 6. AI-specific concerns

- validate prompt input length and shape
- add sensible request limits
- classify/reject obviously disallowed generation requests if required
- log failure categories without leaking sensitive values unnecessarily

## 7. Logging and debugging

Log:
- request IDs
- job IDs
- failure categories
- status transition failures

Avoid logging:
- secrets
- raw private document bodies in careless ways
- excessive personally sensitive data

## 8. Near-term checklist

- verify RLS on job tables
- verify document visibility enforcement
- verify create routes derive user from session
- verify storage access policy is intentional
- verify service-role operations are isolated to server-only contexts
