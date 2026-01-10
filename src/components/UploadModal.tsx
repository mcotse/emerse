"use client";

import { useCallback, useState } from "react";
import {
  compressImage,
  formatFileSize,
  CompressionResult,
} from "@/hooks/useImageCompression";

interface UploadFile {
  file: File;
  preview: string;
  progress: number;
  status: "pending" | "compressing" | "uploading" | "complete" | "error";
  error?: string;
  compressionResult?: CompressionResult;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: () => void;
}

export function UploadModal({
  isOpen,
  onClose,
  onUploadComplete,
}: UploadModalProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const uploadFiles: UploadFile[] = fileArray
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: "pending" as const,
      }));
    setFiles((prev) => [...prev, ...uploadFiles]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const file = prev[index];
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const uploadFiles = useCallback(async () => {
    for (let i = 0; i < files.length; i++) {
      const uploadFile = files[i];
      if (uploadFile.status !== "pending") continue;

      try {
        // Step 1: Compress the image
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "compressing" as const } : f
          )
        );

        const compressionResult = await compressImage(uploadFile.file, {
          maxSizeMB: 2,
          maxWidthOrHeight: 2048,
          onProgress: (progress) => {
            setFiles((prev) =>
              prev.map((f, idx) =>
                idx === i ? { ...f, progress: Math.round(progress * 50) } : f
              )
            );
          },
        });

        // Store compression result and switch to uploading
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: "uploading" as const,
                  compressionResult,
                  progress: 50,
                }
              : f
          )
        );

        // Step 2: Get presigned URL for the compressed file
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: compressionResult.compressed.name,
            contentType: compressionResult.compressed.type,
            fileSize: compressionResult.compressed.size,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get upload URL");
        }

        const { uploadUrl } = await response.json();

        // Step 3: Upload compressed file to S3
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            // Progress: 50-100% is upload (first 50% was compression)
            const uploadProgress = Math.round((e.loaded / e.total) * 50);
            setFiles((prev) =>
              prev.map((f, idx) =>
                idx === i ? { ...f, progress: 50 + uploadProgress } : f
              )
            );
          }
        });

        await new Promise<void>((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error("Upload failed"));
            }
          };
          xhr.onerror = () => reject(new Error("Upload failed"));
          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", compressionResult.compressed.type);
          xhr.send(compressionResult.compressed);
        });

        // Mark as complete
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "complete" as const, progress: 100 } : f
          )
        );
      } catch (error) {
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: "error" as const,
                  error: error instanceof Error ? error.message : "Upload failed",
                }
              : f
          )
        );
      }
    }

    onUploadComplete?.();
  }, [files, onUploadComplete]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addFiles(e.target.files);
      }
    },
    [addFiles]
  );

  const isUploading = files.some(
    (f) => f.status === "uploading" || f.status === "compressing"
  );
  const canUpload = files.some((f) => f.status === "pending");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Upload Photos</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Drop zone */}
        <div
          className={`m-4 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            isDragging
              ? "border-black bg-gray-50 dark:border-white dark:bg-gray-800"
              : "border-gray-300 dark:border-gray-600"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <UploadIcon className="mx-auto h-10 w-10 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Drag and drop photos here, or
          </p>
          <label className="mt-2 inline-block cursor-pointer rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200">
            Browse Files
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="max-h-60 overflow-y-auto border-t border-gray-200 px-4 py-2 dark:border-gray-700">
            {files.map((uploadFile, index) => (
              <div
                key={index}
                className="flex items-center gap-3 py-2"
              >
                <img
                  src={uploadFile.preview}
                  alt=""
                  className="h-12 w-12 rounded object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {uploadFile.file.name}
                  </p>
                  {uploadFile.status === "compressing" && (
                    <>
                      <p className="text-xs text-gray-500">Compressing...</p>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-full bg-black transition-all dark:bg-white"
                          style={{ width: `${uploadFile.progress}%` }}
                        />
                      </div>
                    </>
                  )}
                  {uploadFile.status === "uploading" && (
                    <>
                      <p className="text-xs text-gray-500">Uploading...</p>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-full bg-black transition-all dark:bg-white"
                          style={{ width: `${uploadFile.progress}%` }}
                        />
                      </div>
                    </>
                  )}
                  {uploadFile.status === "complete" && (
                    <p className="text-xs text-green-600">
                      Uploaded
                      {uploadFile.compressionResult &&
                        uploadFile.compressionResult.compressionRatio > 1 && (
                          <span className="ml-1 text-gray-500">
                            ({formatFileSize(uploadFile.compressionResult.originalSize)} →{" "}
                            {formatFileSize(uploadFile.compressionResult.compressedSize)})
                          </span>
                        )}
                    </p>
                  )}
                  {uploadFile.status === "error" && (
                    <p className="text-xs text-red-600">{uploadFile.error}</p>
                  )}
                </div>
                {uploadFile.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="Remove"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={uploadFiles}
            disabled={!canUpload || isUploading}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18 18 6M6 6l12 12"
      />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
      />
    </svg>
  );
}
