import Image from "next/image";
import Link from "next/link";
import type { ContentWithCreator } from "@/types";
import { UserAvatar } from "@/components/user-avatar";

interface ContentCardProps {
  content: ContentWithCreator;
}

export function ContentCard({ content }: ContentCardProps) {
  return (
    <Link
      href={`/content/${content.id}`}
      className="group block overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <Image
          src={content.imageUrl}
          alt={content.title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {content.parentContentId && (
          <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
            Remix
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="truncate text-sm font-semibold">{content.title}</h3>
        <div className="mt-1.5 flex items-center gap-1.5">
          <UserAvatar
            username={content.creator.username}
            avatarUrl={content.creator.avatarUrl}
            size="sm"
          />
          <span className="truncate text-xs text-gray-500">
            {content.creator.username}
          </span>
        </div>
      </div>
    </Link>
  );
}
