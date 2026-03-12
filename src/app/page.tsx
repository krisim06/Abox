import Link from "next/link";
import { getFeed } from "@/services/content-service";
import { ContentGrid } from "@/components/content-grid";
import { EmptyState } from "@/components/empty-state";

interface HomePageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const feed = await getFeed(page, 21);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Explore</h1>
        <p className="mt-1 text-gray-500">
          Discover AI-generated artworks from the community
        </p>
      </div>

      {feed.items.length === 0 ? (
        <EmptyState
          title="No content yet"
          description="Be the first to share your AI creation"
          action={
            <Link
              href="/upload"
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Upload your first work
            </Link>
          }
        />
      ) : (
        <>
          <ContentGrid items={feed.items} />

          {(page > 1 || feed.hasMore) && (
            <div className="mt-8 flex items-center justify-center gap-4">
              {page > 1 && (
                <Link
                  href={`/?page=${page - 1}`}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              {feed.hasMore && (
                <Link
                  href={`/?page=${page + 1}`}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
