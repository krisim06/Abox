import { createClient } from "@/lib/supabase/server";
import type { User } from "@/types";
import { mapDbUser } from "@/lib/mappers";
import type { DbUser } from "@/types";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();

  // Step 1) Resolve authenticated Supabase user from session/cookies.
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  // Step 2) Resolve public profile row used by app domain layer.
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (!profile) return null;

  // Step 3) Map DB row (snake_case) into domain shape (camelCase).
  return mapDbUser(profile as DbUser);
}
