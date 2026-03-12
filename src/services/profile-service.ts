import { createClient } from "@/lib/supabase/server";
import { mapDbUser } from "@/lib/mappers";
import type { ProfileData } from "@/types";
import type { DbUser } from "@/types";

export async function getProfileByUsername(
  username: string
): Promise<ProfileData | null> {
  const supabase = await createClient();

  const { data: userRow, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !userRow) return null;

  const user = mapDbUser(userRow as DbUser);

  const [contentCount, followerCount, followingCount] = await Promise.all([
    supabase
      .from("contents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count }) => count ?? 0),
    supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", user.id)
      .then(({ count }) => count ?? 0),
    supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("follower_id", user.id)
      .then(({ count }) => count ?? 0),
  ]);

  return {
    user,
    contentCount,
    followerCount,
    followingCount,
  };
}
