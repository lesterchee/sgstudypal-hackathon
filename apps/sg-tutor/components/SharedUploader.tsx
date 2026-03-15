// Purpose: Sprint 143 — Shared file uploader component used by both
// homework-help and live-tutor pages. Writes filenames to localStorage
// for cross-page sync with the Tutor Gwen AI context.
"use client";

import { useState, useRef, useCallback, useEffect, type DragEvent, type ChangeEvent } from "react";
import { Upload, X, ImageIcon } from "lucide-react";

const UploadIcon = Upload as any;
const XIcon = X as any;
const ImageIconComponent = ImageIcon as any;

export interface PendingImage {
  name: string;
  dataUrl: string;
}

interface SharedUploaderProps {
  /** Purpose: External state — the parent controls the image list. */
  images: PendingImage[];
  /** Purpose: Callback when images change (add/remove). */
  onImagesChange: (images: PendingImage[]) => void;
  /** Purpose: Optional compact mode for sidebar rendering. */
  compact?: boolean;
}

export function SharedUploader({ images, onImagesChange, compact = false }: SharedUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null!);

  // Purpose: Sprint 145/147 — STRICT PURGE. Keep localStorage in perfect sync.
  // When images are removed, aggressively wipe both name list and base64 data.
  useEffect(() => {
    if (images.length > 0) {
      localStorage.setItem("pendingHomework", images.map((f) => f.name).join(", "));
      // Purpose: Sprint 147 — Store the most recent image's base64 data URL
      // for the Live Tutor WebSocket to inject as an inline image payload.
      localStorage.setItem("pendingHomeworkBase64", images[images.length - 1].dataUrl);
    } else {
      localStorage.removeItem("pendingHomework");
      localStorage.removeItem("pendingHomeworkBase64");
    }
  }, [images]);

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        const updated = [
          ...images,
          { name: file.name, dataUrl: reader.result as string },
        ];
        // Purpose: Sprint 133 — Persist for Live Tutor cross-page bridge.
        localStorage.setItem("pendingHomework", updated.map((f) => f.name).join(", "));
        // Purpose: Sprint 147 — Store latest base64 for WebSocket image injection.
        localStorage.setItem("pendingHomeworkBase64", reader.result as string);
        onImagesChange(updated);
      };
      reader.readAsDataURL(file);
    },
    [images, onImagesChange]
  );

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) Array.from(files).forEach(processFile);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    Array.from(e.dataTransfer.files).forEach(processFile);
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    if (updated.length > 0) {
      localStorage.setItem("pendingHomework", updated.map((f) => f.name).join(", "));
      localStorage.setItem("pendingHomeworkBase64", updated[updated.length - 1].dataUrl);
    } else {
      localStorage.removeItem("pendingHomework");
      localStorage.removeItem("pendingHomeworkBase64");
    }
    onImagesChange(updated);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 ${
          compact ? "p-4" : "p-6"
        } ${
          isDragging
            ? "border-violet-500 bg-violet-500/10"
            : "border-gray-700 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800"
        }`}
      >
        <div className="flex flex-col items-center text-center">
          <UploadIcon
            size={compact ? 20 : 28}
            className="text-gray-500 mb-2"
          />
          <p className={`font-medium text-gray-400 ${compact ? "text-xs" : "text-sm"}`}>
            {isDragging ? "Drop to upload" : "Drop images or click to upload"}
          </p>
          <p className="text-[10px] text-gray-600 mt-1">PNG, JPG up to 5MB</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Thumbnail strip */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, idx) => (
            <div
              key={`${img.name}-${idx}`}
              className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-700 bg-gray-800"
            >
              <img
                src={img.dataUrl}
                alt={img.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(idx);
                }}
                className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XIcon size={10} className="text-white" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5">
                <p className="text-[8px] text-gray-300 truncate">{img.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
