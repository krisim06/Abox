"use client";

import { useActionState, useCallback, useRef, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { uploadAction, type UploadState } from "@/app/upload/actions";
import { createClient } from "@/lib/supabase/client";
import { validateImageFile, uploadContentImage } from "@/lib/storage";

interface ParentContent {
  id: string;
  title: string;
  imageUrl: string;
  prompt: string;
  model: string;
  seed: string | null;
  creatorUsername: string;
}

const initialState: UploadState = { error: null };

export default function RemixPage() {
  const { id } = useParams<{ id: string }>();
  const [state, formAction, isPending] = useActionState(uploadAction, initialState);
  const [parent, setParent] = useState<ParentContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const revokePreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl]);

  function handleReset() {
    revokePreview();
    setPreviewUrl(null);
    setImageUrl(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  useEffect(() => {
    async function fetchParent() {
      const supabase = createClient();
      const { data } = await supabase
        .from("contents")
        .select(`
          id,
          title,
          image_url,
          prompt,
          model,
          seed,
          users!contents_user_id_fkey (username)
        `)
        .eq("id", id)
        .single();

      if (data) {
        const users = data.users as unknown as { username: string };
        setParent({
          id: data.id,
          title: data.title,
          imageUrl: data.image_url,
          prompt: data.prompt,
          model: data.model,
          seed: data.seed,
          creatorUsername: users.username,
        });
      }
      setLoading(false);
    }
    fetchParent();
  }, [id]);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const validationError = validateImageFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    revokePreview();
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUploadError("You must be signed in");
        return;
      }

      const result = await uploadContentImage(supabase, user.id, file);
      setImageUrl(result.publicUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
      revokePreview();
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!parent) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h2 className="text-lg font-semibold">Content not found</h2>
        <p className="mt-1 text-sm text-gray-500">
          The content you want to remix doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="mt-4 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Back to feed
        </Link>
      </div>
    );
  }

  const displayError = uploadError || state.error;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold">Remix</h1>
      <p className="mt-1 text-sm text-gray-500">
        Remixing{" "}
        <Link
          href={`/content/${parent.id}`}
          className="font-medium text-black hover:underline"
        >
          {parent.title}
        </Link>{" "}
        by {parent.creatorUsername}
      </p>

      <div className="mt-4 flex items-center gap-3 rounded-lg border border-gray-200 p-3">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
          <Image
            src={parent.imageUrl}
            alt={parent.title}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{parent.title}</p>
          <p className="truncate text-xs text-gray-500">
            {parent.model}{parent.seed ? ` · seed: ${parent.seed}` : ""}
          </p>
        </div>
      </div>

      <form action={formAction} className="mt-8 space-y-5">
        <input type="hidden" name="imageUrl" value={imageUrl ?? ""} />
        <input type="hidden" name="parentContentId" value={parent.id} />

        <div>
          <label className="block text-sm font-medium">New Image</label>
          <div className="mt-1">
            {previewUrl ? (
              <div>
                <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-lg border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={uploading}
                  className="mt-2 text-sm text-gray-500 hover:text-black disabled:opacity-50"
                >
                  Change image
                </button>
              </div>
            ) : (
              <label className="flex aspect-square w-full max-w-xs cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Click to upload</p>
                  <p className="mt-1 text-xs text-gray-400">
                    JPEG, PNG, WebP, GIF up to 10MB
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
            {uploading && (
              <p className="mt-2 text-sm text-gray-500">Uploading image...</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={200}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            placeholder="Give your remix a title"
          />
        </div>

        <div>
          <label htmlFor="prompt" className="block text-sm font-medium">
            Prompt
          </label>
          <textarea
            id="prompt"
            name="prompt"
            required
            rows={3}
            defaultValue={parent.prompt}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="model" className="block text-sm font-medium">
              Model
            </label>
            <input
              id="model"
              name="model"
              type="text"
              required
              defaultValue={parent.model}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
          <div>
            <label htmlFor="seed" className="block text-sm font-medium">
              Seed <span className="text-gray-400">(optional)</span>
            </label>
            <input
              id="seed"
              name="seed"
              type="text"
              defaultValue={parent.seed ?? ""}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
        </div>

        {displayError && (
          <p className="text-sm text-red-600">{displayError}</p>
        )}

        <button
          type="submit"
          disabled={isPending || uploading || !imageUrl}
          className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Publishing remix..." : "Publish remix"}
        </button>
      </form>
    </div>
  );
}
