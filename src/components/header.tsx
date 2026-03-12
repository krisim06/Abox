import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          ABox
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                href="/upload"
                className="rounded-lg bg-black px-3.5 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
              >
                Upload
              </Link>
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
