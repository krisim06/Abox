import type { ContentWithCreator } from "@/types";
import { ContentCard } from "@/components/content-card";

interface ContentGridProps {
  items: ContentWithCreator[];
}

export function ContentGrid({ items }: ContentGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((content) => (
        <ContentCard key={content.id} content={content} />
      ))}
    </div>
  );
}
