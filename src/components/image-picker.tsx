"use client";

import type { RefObject } from "react";

interface ImagePickerProps {
  previewUrl: string | null;
  uploading: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  label?: string;
}

export function ImagePicker({
  previewUrl,
  uploading,
  fileInputRef,
  onImageChange,
  onReset,
  label = "Image",
}: ImagePickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      <div className="mt-1">
        {/* If a file is selected, show preview + reset action. */}
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
              onClick={onReset}
              disabled={uploading}
              className="mt-2 text-sm text-gray-500 hover:text-black disabled:opacity-50"
            >
              Change image
            </button>
          </div>
        ) : (
          <>
            {/* Otherwise render the upload dropzone/select affordance. */}
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
              onChange={onImageChange}
              className="hidden"
            />
          </label>
          </>
        )}
        {uploading && (
          <p className="mt-2 text-sm text-gray-500">Uploading image...</p>
        )}
      </div>
    </div>
  );
}
