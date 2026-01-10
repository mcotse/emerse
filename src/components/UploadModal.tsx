"use client";

import { useCallback, useState, useMemo } from "react";
import {
  compressImage,
  formatFileSize,
  CompressionResult,
} from "@/hooks/useImageCompression";

interface UploadFile {
  id: string;
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
  onUploadComplete?: (uploadedCount: number) => void;
  maxConcurrentUploads?: number;
  maxFileSizeMB?: number;
}

const MAX_FILE_SIZE_DEFAULT = 50; // 50MB max per file
const MAX_CONCURRENT_DEFAULT = 3;

export function UploadModal({
  isOpen,
  onClose,
  onUploadComplete,
  maxConcurrentUploads = MAX_CONCURRENT_DEFAULT,
  maxFileSizeMB = MAX_FILE_SIZE_DEFAULT,
}: UploadModalProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Generate unique ID for each file
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Stats
  const stats = useMemo(() => {
    const pending = files.filter((f) => f.status === "pending").length;
    const processing = files.filter(
      (f) => f.status === "compressing" || f.status === "uploading"
    ).length;
    const complete = files.filter((f) => f.status === "complete").length;
    const errored = files.filter((f) => f.status === "error").length;
    const total = files.length;
    return { pending, processing, complete, errored, total };
  }, [files]);

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const maxSizeBytes = maxFileSizeMB * 1024 * 1024;

      const uploadFiles: UploadFile[] = fileArray
        .filter((f) => f.type.startsWith("image/"))
        .map((file) => {
          const isOversize = file.size > maxSizeBytes;
          return {
            id: generateId(),
            file,
            preview: URL.createObjectURL(file),
            progress: 0,
            status: isOversize ? ("error" as const) : ("pending" as const),
            error: isOversize
              ? `File exceeds ${maxFileSizeMB}MB limit`
              : undefined,
          };
        });

      setFiles((prev) => [...prev, ...uploadFiles]);
    },
    [maxFileSizeMB]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
  }, [files]);

  const clearCompleted = useCallback(() => {
    setFiles((prev) => {
      prev.filter((f) => f.status === "complete").forEach((f) => {
        URL.revokeObjectURL(f.preview);
      });
      return prev.filter((f) => f.status !== "complete");
    });
  }, []);

  const retryFailed = useCallback(() => {
    setFiles((prev) =>
      prev.map((f) =>
        f.status === "error" && !f.error?.includes("limit")
          ? { ...f, status: "pending" as const, error: undefined, progress: 0 }
          : f
      )
    );
  }, []);

  const updateFile = useCallback(
    (id: string, updates: Partial<UploadFile>) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
      );
    },
    []
  );

  const uploadSingleFile = useCallback(
    async (uploadFile: UploadFile) => {
      try {
        // Step 1: Compress the image
        updateFile(uploadFile.id, { status: "compressing" });

        const compressionResult = await compressImage(uploadFile.file, {
          maxSizeMB: 2,
          maxWidthOrHeight: 2048,
          onProgress: (progress) => {
            updateFile(uploadFile.id, {
              progress: Math.round(progress * 50),
            });
          },
        });

        // Store compression result and switch to uploading
        updateFile(uploadFile.id, {
          status: "uploading",
          compressionResult,
          progress: 50,
        });

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
            const uploadProgress = Math.round((e.loaded / e.total) * 50);
            updateFile(uploadFile.id, {
              progress: 50 + uploadProgress,
            });
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
          xhr.onerror = () => reject(new Error("Network error"));
          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", compressionResult.compressed.type);
          xhr.send(compressionResult.compressed);
        });

        // Mark as complete
        updateFile(uploadFile.id, { status: "complete", progress: 100 });
        return true;
      } catch (error) {
        updateFile(uploadFile.id, {
          status: "error",
          error: error instanceof Error ? error.message : "Upload failed",
        });
        return false;
      }
    },
    [updateFile]
  );

  const uploadFiles = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) return;

    let uploadedCount = 0;

    // Process files in batches for concurrent uploads
    for (let i = 0; i < pendingFiles.length; i += maxConcurrentUploads) {
      const batch = pendingFiles.slice(i, i + maxConcurrentUploads);
      const results = await Promise.all(
        batch.map((file) => uploadSingleFile(file))
      );
      uploadedCount += results.filter(Boolean).length;
    }

    onUploadComplete?.(uploadedCount);
  }, [files, maxConcurrentUploads, uploadSingleFile, onUploadComplete]);

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
        // Reset input so same files can be selected again
        e.target.value = "";
      }
    },
    [addFiles]
  );

  const isUploading = stats.processing > 0;
  const canUpload = stats.pending > 0;
  const hasFiles = files.length > 0;

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div>
            <h2 id="upload-modal-title" className="text-lg font-semibold">
              Upload Photos
            </h2>
            {hasFiles && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {stats.complete}/{stats.total} uploaded
                {stats.errored > 0 && ` · ${stats.errored} failed`}
                {stats.processing > 0 && ` · ${stats.processing} in progress`}
              </p>
            )}
          </div>
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
              ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <UploadIcon
            className={`mx-auto h-10 w-10 ${
              isDragging ? "text-blue-500" : "text-gray-400"
            }`}
          />
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
          <p className="mt-2 text-xs text-gray-400">
            Max {maxFileSizeMB}MB per file · Concurrent uploads: {maxConcurrentUploads}
          </p>
        </div>

        {/* File list */}
        {hasFiles && (
          <>
            {/* Quick actions */}
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2 dark:border-gray-700">
              <span className="text-xs text-gray-500">
                {stats.total} file{stats.total !== 1 ? "s" : ""} selected
              </span>
              <div className="flex gap-2">
                {stats.errored > 0 && (
                  <button
                    type="button"
                    onClick={retryFailed}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Retry failed
                  </button>
                )}
                {stats.complete > 0 && (
                  <button
                    type="button"
                    onClick={clearCompleted}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  >
                    Clear completed
                  </button>
                )}
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Clear all
                </button>
              </div>
            </div>

            {/* File list */}
            <div className="max-h-60 overflow-y-auto border-t border-gray-200 px-4 py-2 dark:border-gray-700">
              {files.map((uploadFile) => (
                <div
                  key={uploadFile.id}
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
                    <p className="text-xs text-gray-500">
                      {formatFileSize(uploadFile.file.size)}
                    </p>
                    {uploadFile.status === "compressing" && (
                      <>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                            <div
                              className="h-full bg-yellow-500 transition-all"
                              style={{ width: `${uploadFile.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            Compressing
                          </span>
                        </div>
                      </>
                    )}
                    {uploadFile.status === "uploading" && (
                      <>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                            <div
                              className="h-full bg-blue-500 transition-all"
                              style={{ width: `${uploadFile.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {uploadFile.progress}%
                          </span>
                        </div>
                      </>
                    )}
                    {uploadFile.status === "complete" && (
                      <p className="flex items-center gap-1 text-xs text-green-600">
                        <CheckIcon className="h-3 w-3" />
                        Uploaded
                        {uploadFile.compressionResult &&
                          uploadFile.compressionResult.compressionRatio > 1 && (
                            <span className="ml-1 text-gray-500">
                              (saved{" "}
                              {Math.round(
                                (1 -
                                  uploadFile.compressionResult.compressedSize /
                                    uploadFile.compressionResult.originalSize) *
                                  100
                              )}
                              %)
                            </span>
                          )}
                      </p>
                    )}
                    {uploadFile.status === "error" && (
                      <p className="flex items-center gap-1 text-xs text-red-600">
                        <ErrorIcon className="h-3 w-3" />
                        {uploadFile.error}
                      </p>
                    )}
                  </div>
                  {uploadFile.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => removeFile(uploadFile.id)}
                      className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label="Remove"
                    >
                      <CloseIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {stats.complete > 0 ? "Done" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={uploadFiles}
            disabled={!canUpload || isUploading}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            {isUploading
              ? `Uploading ${stats.processing}...`
              : canUpload
                ? `Upload ${stats.pending}`
                : "Upload"}
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

function CheckIcon({ className }: { className?: string }) {
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
        d="m4.5 12.75 6 6 9-13.5"
      />
    </svg>
  );
}

function ErrorIcon({ className }: { className?: string }) {
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
        d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
      />
    </svg>
  );
}
