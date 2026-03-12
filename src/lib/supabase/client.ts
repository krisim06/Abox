"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // Browser-side Supabase client for interactive auth/storage actions.
  // Uses public env vars intended to be exposed to the frontend.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
