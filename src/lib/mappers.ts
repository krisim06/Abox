import type { DbUser, DbContent, User, Content } from "@/types";

export function mapDbUser(row: DbUser): User {
  return {
    id: row.id,
    username: row.username,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
  };
}

export function mapDbContent(row: DbContent): Content {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    imageUrl: row.image_url,
    prompt: row.prompt,
    model: row.model,
    seed: row.seed,
    parentContentId: row.parent_content_id,
    createdAt: row.created_at,
  };
}
