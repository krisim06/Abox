"use client";

import { useActionState } from "react";
import { uploadAction, type UploadState } from "./actions";
import { useImageUpload } from "@/hooks/use-image-upload";
import { ImagePicker } from "@/components/image-picker";

const initialState: UploadState = { error: null };

export default function UploadPage() {
  const [state, formAction, isPending] = useActionState(uploadAction, initialState);
  const upload = useImageUpload();

  const displayError = upload.error || state.error;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold">Upload your creation</h1>
      <p className="mt-1 text-sm text-gray-500">
        Share your AI-generated artwork with the community
      </p>

      <form action={formAction} className="mt-8 space-y-5">
        <input type="hidden" name="imageUrl" value={upload.imageUrl ?? ""} />

        <ImagePicker
          previewUrl={upload.previewUrl}
          uploading={upload.uploading}
          fileInputRef={upload.fileInputRef}
          onImageChange={upload.handleImageChange}
          onReset={upload.handleReset}
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
            placeholder="Give your work a title"
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
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            placeholder="The prompt used to generate this image"
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
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="e.g. Midjourney v6"
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
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="e.g. 12345"
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
          {isPending ? "Publishing..." : "Publish"}
        </button>
      </form>
    </div>
  );
}
