"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createContent } from "@/services/content-service";

export interface UploadState {
  error: string | null;
}

function getStringField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function uploadAction(
  _prevState: UploadState,
  formData: FormData
): Promise<UploadState> {
  // Step 1) Authorize: only signed-in creators can publish.
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be signed in to publish content" };
  }

  // Step 2) Normalize form access in one place (safe string extraction).
  const title = getStringField(formData, "title");
  const prompt = getStringField(formData, "prompt");
  const model = getStringField(formData, "model");
  const seed = getStringField(formData, "seed");
  const imageUrl = getStringField(formData, "imageUrl");
  const parentContentId = getStringField(formData, "parentContentId");

  // Step 3) Delegate validation + persistence to service layer.
  const result = await createContent({
    userId: user.id,
    title,
    imageUrl,
    prompt,
    model,
    seed: seed || undefined,
    parentContentId: parentContentId || undefined,
  });

  if (!result.success) {
    return { error: result.error };
  }

  // Step 4) On success, move to the canonical content detail page.
  redirect(`/content/${result.data.id}`);
}
