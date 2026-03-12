"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { uploadAction, type UploadState } from "@/app/upload/actions";
import { useImageUpload } from "@/hooks/use-image-upload";
import { ImagePicker } from "@/components/image-picker";
import type { ContentWithCreator } from "@/types";

interface RemixFormProps {
  parent: ContentWithCreator;
}

const initialState: UploadState = { error: null };

export function RemixForm({ parent }: RemixFormProps) {
  // Reuse upload server action so remix and original upload share one persistence path.
  const [state, formAction, isPending] = useActionState(uploadAction, initialState);
  const upload = useImageUpload();

  // Merge client upload errors and server action errors into one display channel.
  const displayError = upload.error || state.error;

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
        by {parent.creator.username}
      </p>

      <div className="mt-4 flex items-center gap-3 rounded-lg border border-gray-200 p-3">
        {/* Source snapshot helps users verify what they are remixing. */}
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
            {parent.model}
            {parent.seed ? ` · seed: ${parent.seed}` : ""}
          </p>
        </div>
      </div>

      <form action={formAction} className="mt-8 space-y-5">
        {/* Hidden fields connect client upload state to the server action payload. */}
        <input type="hidden" name="imageUrl" value={upload.imageUrl ?? ""} />
        {/* Parent id preserves remix lineage in contents.parent_content_id. */}
        <input type="hidden" name="parentContentId" value={parent.id} />

        <ImagePicker
          previewUrl={upload.previewUrl}
          uploading={upload.uploading}
          fileInputRef={upload.fileInputRef}
          onImageChange={upload.handleImageChange}
          onReset={upload.handleReset}
          label="New Image"
        />

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
          {/* Prefill source generation context so remixing starts from parent intent. */}
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
            {/* Model/seed are seeded from parent but remain editable. */}
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
          disabled={isPending || upload.uploading || !upload.imageUrl}
          className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {/* Prevent submit before image upload completes and URL is available. */}
          {isPending ? "Publishing remix..." : "Publish remix"}
        </button>
      </form>
    </div>
  );
}
