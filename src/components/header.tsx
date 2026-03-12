import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

export async function Header() {
  // Server-side user resolution so navigation reflects auth state on first render.
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          ABox
        </Link>

        <div className="flex items-center gap-4">
          {/* Auth-aware navigation: creator actions when signed in, entry actions otherwise. */}
          {user ? (
            <>
              {/* Primary creator action kept visible in global nav. */}
              <Link
                href="/upload"
                className="rounded-lg bg-black px-3.5 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
              >
                Upload
              </Link>
              {/* Profile shortcut reinforces identity + creator ownership. */}
              <Link
                href={`/@${user.username}`}
                className="text-sm font-medium text-gray-700 hover:text-black"
              >
                {user.username}
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-sm font-medium text-gray-700 hover:text-black"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="rounded-lg bg-black px-3.5 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
