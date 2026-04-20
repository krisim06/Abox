import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Service-role Supabase client.
//
// This client bypasses Row Level Security and is reserved for **trusted
// server paths only** — workers, webhooks, finalization routes. It must
// never be reached from the browser bundle or from user-facing API routes
// that act on behalf of an untrusted caller.
//
// The service-role key is kept out of any NEXT_PUBLIC_* variable so Next.js
// will refuse to inline it into the client bundle.

export class MissingServiceRoleKeyError extends Error {
  constructor() {
    super(
      "SUPABASE_SERVICE_ROLE_KEY is not set; trusted server paths cannot run."
    );
    this.name = "MissingServiceRoleKeyError";
  }
}

let cached: SupabaseClient | null = null;

export function createServiceRoleClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!key) throw new MissingServiceRoleKeyError();

  // No cookie/session handling: this client is explicitly not a user
  // context. Persisting a session here would be a subtle security footgun.
  cached = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return cached;
}
