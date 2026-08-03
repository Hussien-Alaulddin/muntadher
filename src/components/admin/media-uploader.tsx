"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlusIcon, Loader2Icon, Trash2Icon, UploadIcon } from "lucide-react";
import { AdminApiError } from "@/lib/admin-api";
import { acceptAttribute, isVideoUrl, type MediaKind } from "@/lib/media-kinds";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function looksPrivateStoredUrl(url: string) {
  return (
    url.includes("purchase-receipts/") ||
    url.includes("course-lessons/") ||
    url.includes("course-attachments/") ||
    url.includes("products/files/") ||
    url.includes("-private/") ||
    url.startsWith("/api/media/local?")
  );
}

function readImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      URL.revokeObjectURL(url);
      resolve({ width, height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("تعذّر قراءة أبعاد الصورة"));
    };
    img.src = url;
  });
}

async function uploadMediaFile(
  file: File,
  options: { folder: string; accept: MediaKind; replaceUrl?: string },
) {
  const body = new FormData();
  body.append("file", file);
  body.append("folder", options.folder);
  body.append("accept", options.accept);
  if (options.replaceUrl) body.append("replaceUrl", options.replaceUrl);

  const res = await fetch("/api/admin/upload", {
    method: "POST",
    body,
    credentials: "same-origin",
  });

  const data = (await res.json().catch(() => ({}))) as {
    message?: string;
    url?: string;
    previewUrl?: string;
    warning?: string;
  };

  if (!res.ok || !data.url) {
    throw new AdminApiError(data.message ?? `خطأ ${res.status}`, res.status);
  }

  return data as { url: string; previewUrl?: string; warning?: string };
}

async function deleteMediaFile(url: string) {
  const res = await fetch("/api/admin/upload", {
    method: "DELETE",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const data = (await res.json().catch(() => ({}))) as { message?: string };
  if (!res.ok) {
    throw new AdminApiError(data.message ?? `خطأ ${res.status}`, res.status);
  }
}

export function MediaUploader({
  label,
  value,
  onChange,
  disabled,
  hint,
  required,
  folder = "general",
  accept = "both",
  fixedSize,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  hint?: string;
  required?: boolean;
  folder?: string;
  accept?: MediaKind;
  /** إن وُجد: يُرفض الرفع إن لم تطابق الصورة النسبة/المقاس */
  fixedSize?: { width: number; height: number; tolerance?: number };
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  /** معاينة موقّتة للملفات الخاصة (لا تُحفظ في النموذج) */
  const [previewOverride, setPreviewOverride] = useState<string | null>(null);

  useEffect(() => {
    const current = value.trim();
    if (!current || !looksPrivateStoredUrl(current)) {
      setPreviewOverride(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/admin/media-preview?url=${encodeURIComponent(current)}`,
          { credentials: "same-origin" },
        );
        const data = (await res.json().catch(() => ({}))) as {
          previewUrl?: string;
        };
        if (!cancelled && res.ok && data.previewUrl) {
          setPreviewOverride(data.previewUrl);
        }
      } catch {
        /* المعاينة اختيارية */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [value]);

  async function assertFixedSize(file: File) {
    if (!fixedSize || !file.type.startsWith("image/")) return;

    const dimensions = await readImageSize(file);
    const expectedRatio = fixedSize.width / fixedSize.height;
    const actualRatio = dimensions.width / dimensions.height;
    const tol = fixedSize.tolerance ?? 0.02;
    const ratioOk =
      Math.abs(actualRatio - expectedRatio) <= expectedRatio * tol;
    const exact =
      dimensions.width === fixedSize.width &&
      dimensions.height === fixedSize.height;

    if (!ratioOk) {
      throw new AdminApiError(
        `المقاس المطلوب ${fixedSize.width} × ${fixedSize.height} بكسل. الصورة الحالية ${dimensions.width} × ${dimensions.height}.`,
        400,
      );
    }

    if (!exact) {
      setWarning(
        `النسبة صحيحة، لكن المقاس المثالي ${fixedSize.width} × ${fixedSize.height}. الحالي ${dimensions.width} × ${dimensions.height}.`,
      );
    }
  }

  async function onFileChange(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    setWarning(null);
    try {
      await assertFixedSize(file);
      const result = await uploadMediaFile(file, {
        folder,
        accept,
        replaceUrl: value.trim() || undefined,
      });
      onChange(result.url);
      setPreviewOverride(result.previewUrl ?? null);
      if (result.warning) setWarning(result.warning);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "تعذّر الرفع");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function onRemove() {
    const current = value.trim();
    setDeleting(true);
    setError(null);
    try {
      if (current) await deleteMediaFile(current);
      onChange("");
      setPreviewOverride(null);
      setWarning(null);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "تعذّر الحذف");
    } finally {
      setDeleting(false);
    }
  }

  const preview = (previewOverride || value).trim();
  const video = preview ? isVideoUrl(preview) || isVideoUrl(value) : false;
  const busy = uploading || deleting;

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>

      <div className="overflow-hidden rounded-xl border bg-muted/20">
        <div
          className={cn(
            "flex items-center justify-center bg-muted/40",
            fixedSize ? "w-full" : "min-h-36",
          )}
          style={
            fixedSize
              ? { aspectRatio: `${fixedSize.width} / ${fixedSize.height}` }
              : undefined
          }
        >
          {preview ? (
            video ? (
              <video
                src={preview}
                controls
                className="size-full max-h-full w-full object-contain"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt=""
                className="size-full max-h-full w-full object-contain"
              />
            )
          ) : (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-muted-foreground">
              <ImagePlusIcon className="size-8 opacity-60" />
              <p className="text-xs">لا توجد وسائط بعد</p>
            </div>
          )}
        </div>

        <div className="space-y-2 border-t p-3">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || busy}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <UploadIcon />
              )}
              {uploading ? "جاري الرفع…" : "رفع ملف"}
            </Button>
            {preview ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={disabled || busy}
                onClick={() => void onRemove()}
              >
                {deleting ? (
                  <Loader2Icon className="animate-spin" />
                ) : (
                  <Trash2Icon />
                )}
                {deleting ? "جاري الحذف…" : "إزالة"}
              </Button>
            ) : null}
          </div>

          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={acceptAttribute(accept)}
            disabled={disabled || busy}
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {fixedSize && !hint ? (
        <p className="text-xs text-muted-foreground">
          المقاس المطلوب: {fixedSize.width} × {fixedSize.height} بكسل
          (نسبة {fixedSize.width}:{fixedSize.height}).
        </p>
      ) : null}
      {warning ? (
        <p className="text-xs text-amber-700">{warning}</p>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
