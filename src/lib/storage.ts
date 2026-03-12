import { SupabaseClient } from "@supabase/supabase-js";

const BUCKET_NAME = "content-images";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function isValidStorageUrl(url: string): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return false;

  const expectedPrefix = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/`;
  return url.startsWith(expectedPrefix);
}

export interface UploadResult {
  path: string;
  publicUrl: string;
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "File type not supported. Use JPEG, PNG, WebP, or GIF.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "File too large. Maximum size is 10MB.";
  }
  return null;
}

export async function uploadContentImage(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<UploadResult> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const timestamp = Date.now();
  const path = `${userId}/${timestamp}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);

  return { path, publicUrl };
}
