"use client";

import { useCallback, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { validateImageFile, uploadContentImage } from "@/lib/storage";

export interface ImageUploadState {
  imageUrl: string | null;
  previewUrl: string | null;
  uploading: boolean;
  error: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleReset: () => void;
}

export function useImageUpload(): ImageUploadState {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const revokePreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl]);

  function handleReset() {
    // Clean up local object URL to prevent browser memory leaks.
    revokePreview();
    setPreviewUrl(null);
    setImageUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    // Fast client-side guard before doing any upload request.
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Show immediate preview while the actual upload runs.
    revokePreview();
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be signed in to upload");
        return;
      }

      // Upload into deterministic user-scoped storage path and keep public URL.
      const result = await uploadContentImage(supabase, user.id, file);
      setImageUrl(result.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      revokePreview();
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  }

  return {
    imageUrl,
    previewUrl,
    uploading,
    error,
    fileInputRef,
    handleImageChange,
    handleReset,
  };
}
