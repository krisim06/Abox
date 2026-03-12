import { createClient } from "@/lib/supabase/server";
import { mapDbUser } from "@/lib/mappers";
import type { ProfileData } from "@/types";
import type { DbUser } from "@/types";

export async function getProfileByUsername(
  username: string
): Promise<ProfileData | null> {
  const supabase = await createClient();

  // Step 1) Resolve creator profile row by unique username.
  const { data: userRow, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !userRow) return null;

  // Step 2) Map DB row into app-level user shape.
  const user = mapDbUser(userRow as DbUser);

  // Step 3) Fetch published content count for profile summary metrics.
  const { count } = await supabase
    .from("contents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  return {
    user,
    contentCount: count ?? 0,
  };
}
