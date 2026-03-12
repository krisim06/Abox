import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getContentById, getRemixes } from "@/services/content-service";
import { UserAvatar } from "@/components/user-avatar";
import { ContentGrid } from "@/components/content-grid";
import type { Metadata } from "next";

interface ContentPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ContentPageProps): Promise<Metadata> {
  const { id } = await params;
  // Reuse domain fetch so page metadata stays consistent with rendered content.
  const content = await getContentById(id);

  if (!content) {
    return { title: "Not Found — ABox" };
  }

  return {
    title: `${content.title} — ABox`,
    description: content.prompt.slice(0, 160),
  };
}

export default async function ContentPage({ params }: ContentPageProps) {
  const { id } = await params;
  // Step 1) Load the primary content record.
  const content = await getContentById(id);

  if (!content) {
    notFound();
  }

  // Step 2) Load children for remix discovery on the same page.
  const remixes = await getRemixes(content.id);

  // Step 3) If this is a remix, resolve parent for attribution context.
  let parentContent = null;
  if (content.parentContentId) {
    parentContent = await getContentById(content.parentContentId);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="relative aspect-square w-full bg-gray-100 sm:aspect-[4/3]">
          <Image
            src={content.imageUrl}
            alt={content.title}
            fill
            className="object-contain"
            priority
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>

        <div className="space-y-5 p-6">
          <div>
            <h1 className="text-2xl font-bold">{content.title}</h1>
            {/* Show lineage only when this content is derived from a parent. */}
            {content.parentContentId && parentContent && (
              <p className="mt-1 text-sm text-gray-500">
                Remixed from{" "}
                <Link
                  href={`/content/${parentContent.id}`}
                  className="font-medium text-black hover:underline"
                >
                  {parentContent.title}
                </Link>
                {" "}by {parentContent.creator.username}
              </p>
            )}
          </div>

          <Link
            href={`/@${content.creator.username}`}
            className="flex items-center gap-2 hover:opacity-80"
          >
            <UserAvatar
              username={content.creator.username}
              avatarUrl={content.creator.avatarUrl}
              size="md"
            />
            <span className="text-sm font-medium">
              {content.creator.username}
            </span>
          </Link>

          <div className="space-y-3 rounded-lg bg-gray-50 p-4">
            {/* Keep generation metadata visible for reproducibility/remix utility. */}
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Prompt
              </dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm">
                {content.prompt}
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Model
                </dt>
                <dd className="mt-1 text-sm">{content.model}</dd>
              </div>
              {content.seed && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Seed
                  </dt>
                  <dd className="mt-1 font-mono text-sm">{content.seed}</dd>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
            {/* Primary CTA for the core product loop: create remix from this source. */}
            <Link
              href={`/remix/${content.id}`}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Remix this work
            </Link>
            <time className="ml-auto text-xs text-gray-400">
              {new Date(content.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </time>
          </div>
        </div>
      </div>

      {remixes.length > 0 && (
        <>
          {/* Render only when there are derived works to discover. */}
          <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">
            Remixes ({remixes.length})
          </h2>
          <ContentGrid items={remixes} />
          </section>
        </>
      )}
    </div>
  );
}
