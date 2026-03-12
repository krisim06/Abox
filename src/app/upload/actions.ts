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
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be signed in to publish content" };
  }

  const title = getStringField(formData, "title");
  const prompt = getStringField(formData, "prompt");
  const model = getStringField(formData, "model");
  const seed = getStringField(formData, "seed");
  const imageUrl = getStringField(formData, "imageUrl");
  const parentContentId = getStringField(formData, "parentContentId");

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

  redirect(`/content/${result.data.id}`);
}
