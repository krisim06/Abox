import { createClient } from "@/lib/supabase/server";
import type { User } from "@/types";
import { mapDbUser } from "@/lib/mappers";
import type { DbUser } from "@/types";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (!profile) return null;

  return mapDbUser(profile as DbUser);
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}
