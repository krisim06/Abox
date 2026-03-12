"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Middleware appends ?redirect=... for protected route access attempts.
  const redirectTo = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Browser client is required for interactive auth session updates.
    const supabase = createClient();

    // Step 1) Credential-based sign-in against Supabase Auth.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // Step 2) Return user to intended page (or home fallback) and re-render data.
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          placeholder="Your password"
          autoComplete="current-password"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm text-gray-500">
            Sign in to your ABox account
          </p>
        </div>

        {/* useSearchParams requires suspense in App Router client rendering. */}
        <Suspense fallback={<div className="h-48" />}>
          <SignInForm />
        </Suspense>

        <p className="text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-black hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
