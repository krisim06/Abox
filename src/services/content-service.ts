import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { mapDbContent } from "@/lib/mappers";
import { isValidStorageUrl } from "@/lib/storage";
import type { Content, ServiceResult, PaginatedResult, ContentWithCreator } from "@/types";
import type { DbContent, DbUser } from "@/types";

interface CreateContentInput {
  userId: string;
  title: string;
  imageUrl: string;
  prompt: string;
  model: string;
  seed?: string;
  parentContentId?: string;
}

export async function createContent(
  input: CreateContentInput
): Promise<ServiceResult<Content>> {
  const supabase = await createClient();

  // Normalize early so all downstream checks use consistent values.
  const title = input.title.trim();
  const prompt = input.prompt.trim();
  const model = input.model.trim();

  // Guard rails for required publishing metadata.
  if (!title || title.length > 200) {
    return { success: false, error: "Title is required and must be under 200 characters" };
  }
  if (!prompt) {
    return { success: false, error: "Prompt is required" };
  }
  if (!model) {
    return { success: false, error: "Model is required" };
  }
  if (!input.imageUrl) {
    return { success: false, error: "Image is required" };
  }
  if (!isValidStorageUrl(input.imageUrl)) {
    return { success: false, error: "Invalid image URL" };
  }

  // Remix safety: parent must exist when parentContentId is provided.
  if (input.parentContentId) {
    const { data: parent } = await supabase
      .from("contents")
      .select("id")
      .eq("id", input.parentContentId)
      .single();

    if (!parent) {
      return { success: false, error: "Parent content not found", errorCode: "PARENT_NOT_FOUND" };
    }
  }

  // Single insert path for both original uploads and remixes.
  const { data, error } = await supabase
    .from("contents")
    .insert({
      user_id: input.userId,
      title,
      image_url: input.imageUrl,
      prompt,
      model,
      seed: input.seed?.trim() || null,
      parent_content_id: input.parentContentId || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create content:", error);
    return { success: false, error: "Failed to create content" };
  }

  return { success: true, data: mapDbContent(data as DbContent) };
}

export const getContentById = cache(async function getContentById(
  id: string
): Promise<ContentWithCreator | null> {
  const supabase = await createClient();

  // Join creator fields in one query to avoid extra round trips.
  const { data, error } = await supabase
    .from("contents")
    .select(`
      *,
      users!contents_user_id_fkey (
        id,
        username,
        avatar_url
      )
    `)
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const content = mapDbContent(data as DbContent);
  const creator = data.users as unknown as DbUser;

  return {
    ...content,
    creator: {
      id: creator.id,
      username: creator.username,
      avatarUrl: creator.avatar_url,
    },
  };
});

export async function getFeed(
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResult<ContentWithCreator>> {
  const supabase = await createClient();
  // Offset pagination keeps query shape simple for MVP feed browsing.
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from("contents")
    .select(
      `
      *,
      users!contents_user_id_fkey (
        id,
        username,
        avatar_url
      )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Failed to fetch feed:", error);
    return { items: [], total: 0, page, limit, hasMore: false };
  }

  const items: ContentWithCreator[] = (data ?? []).map((row) => {
    const content = mapDbContent(row as unknown as DbContent);
    const creator = row.users as unknown as DbUser;
    return {
      ...content,
      creator: {
        id: creator.id,
        username: creator.username,
        avatarUrl: creator.avatar_url,
      },
    };
  });

  const total = count ?? 0;

  return {
    items,
    total,
    page,
    limit,
    hasMore: offset + limit < total,
  };
}

export async function getContentsByUserId(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResult<Content>> {
  const supabase = await createClient();
  // Reuse the same pagination contract as feed for UI consistency.
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from("contents")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Failed to fetch user contents:", error);
    return { items: [], total: 0, page, limit, hasMore: false };
  }

  const items = (data ?? []).map((row) => mapDbContent(row as DbContent));
  const total = count ?? 0;

  return {
    items,
    total,
    page,
    limit,
    hasMore: offset + limit < total,
  };
}

export async function getRemixes(
  contentId: string,
  limit: number = 10
): Promise<ContentWithCreator[]> {
  const supabase = await createClient();

  // Remix list is defined by parent -> child relation.
  const { data, error } = await supabase
    .from("contents")
    .select(
      `
      *,
      users!contents_user_id_fkey (
        id,
        username,
        avatar_url
      )
    `
    )
    .eq("parent_content_id", contentId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row) => {
    const content = mapDbContent(row as unknown as DbContent);
    const creator = row.users as unknown as DbUser;
    return {
      ...content,
      creator: {
        id: creator.id,
        username: creator.username,
        avatarUrl: creator.avatar_url,
      },
    };
  });
}
