import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getProfileByUsername } from "@/services/profile-service";
import { getContentsByUserId } from "@/services/content-service";
import { UserAvatar } from "@/components/user-avatar";
import { EmptyState } from "@/components/empty-state";
import type { ContentWithCreator } from "@/types";
import type { Metadata } from "next";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  if (!profile) {
    return { title: "Not Found — ABox" };
  }

  return {
    title: `${profile.user.username} — ABox`,
    description: profile.user.bio || `${profile.user.username}'s profile on ABox`,
  };
}

export default async function ProfilePage({
  params,
  searchParams,
}: ProfilePageProps) {
  const { username } = await params;
  const resolvedSearchParams = await searchParams;
  const profile = await getProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  const page = Math.max(1, parseInt(resolvedSearchParams.page ?? "1", 10) || 1);
  const contents = await getContentsByUserId(profile.user.id, page, 12);

  const contentItems: ContentWithCreator[] = contents.items.map((c) => ({
    ...c,
    creator: {
      id: profile.user.id,
      username: profile.user.username,
      avatarUrl: profile.user.avatarUrl,
    },
  }));

  return (
    <div>
      <div className="flex items-start gap-6">
        <UserAvatar
          username={profile.user.username}
          avatarUrl={profile.user.avatarUrl}
          size="lg"
        />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{profile.user.username}</h1>
          {profile.user.bio && (
            <p className="mt-1 text-sm text-gray-600">{profile.user.bio}</p>
          )}
          <p className="mt-3 text-sm">
            <strong>{profile.contentCount}</strong>{" "}
            <span className="text-gray-500">works</span>
          </p>
        </div>
      </div>

      <div className="mt-10">
        {contentItems.length === 0 ? (
          <EmptyState
            title="No works yet"
            description={`${profile.user.username} hasn't published any works yet`}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {contentItems.map((content) => (
                <Link
                  key={content.id}
                  href={`/content/${content.id}`}
                  className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100"
                >
                  <Image
                    src={content.imageUrl}
                    alt={content.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                </Link>
              ))}
            </div>

            {(page > 1 || contents.hasMore) && (
              <div className="mt-8 flex items-center justify-center gap-4">
                {page > 1 && (
                  <Link
                    href={`/@${username}?page=${page - 1}`}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                  >
                    Previous
                  </Link>
                )}
                {contents.hasMore && (
                  <Link
                    href={`/@${username}?page=${page + 1}`}
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
    </div>
  );
}
