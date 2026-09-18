"use client";

import { useRef } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUploadFile } from "../hooks";

export function FileUpload({
  value,
  onChange,
  accept = "image/jpeg,image/png,image/webp,image/gif",
  previewClassName,
  label = "Upload",
}: {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  previewClassName?: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadFile();
  const isImage = accept.includes("image");

  function handleSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    upload.mutate(file, {
      onSuccess: (result) => onChange(result.url),
    });
  }

  return (
    <div className="flex items-center gap-3">
      {value && isImage && (
        <div className={cn("relative overflow-hidden rounded-xl bg-muted", previewClassName)}>
          {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded, unconfigured domain */}
          <img src={value} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Remove file"
            className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-background/80 text-foreground"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      {value && !isImage && (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="truncate text-sm text-primary hover:underline"
        >
          View uploaded file
        </a>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleSelect}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={upload.isPending}
        onClick={() => inputRef.current?.click()}
      >
        {upload.isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload />}
        {value ? "Replace" : label}
      </Button>
    </div>
  );
}
