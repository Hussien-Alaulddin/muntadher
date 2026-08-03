"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import type { ProjectGalleryItem, ProjectMetaItem } from "@/lib/content";
import { PROJECT_CASE_IMAGE } from "@/lib/project-case-image";
import { MediaUploader } from "@/components/admin/media-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function normalizeMetaList(value: unknown): ProjectMetaItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const item = row as Record<string, unknown>;
      return {
        label: String(item.label ?? ""),
        value: String(item.value ?? ""),
      };
    })
    .filter((row): row is ProjectMetaItem => row !== null);
}

export function normalizeGalleryList(value: unknown): ProjectGalleryItem[] {
  if (!Array.isArray(value)) return [];
  const rows: ProjectGalleryItem[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object") continue;
    const item = row as Record<string, unknown>;
    const imageUrl =
      typeof item.imageUrl === "string" && item.imageUrl.trim()
        ? item.imageUrl.trim()
        : null;
    const caption =
      typeof item.caption === "string" && item.caption.trim()
        ? item.caption.trim()
        : null;
    rows.push({
      imageUrl,
      caption,
      layout: "full",
      aspect: "3240:1350",
    });
  }
  return rows;
}

export function cleanMetaList(value: unknown): ProjectMetaItem[] {
  return normalizeMetaList(value).filter(
    (row) => row.label.trim() || row.value.trim(),
  );
}

export function cleanGalleryList(value: unknown): ProjectGalleryItem[] {
  return normalizeGalleryList(value).filter(
    (row) => row.imageUrl || row.caption,
  );
}

export function MetaListEditor({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: unknown;
  onChange: (value: ProjectMetaItem[]) => void;
  disabled?: boolean;
}) {
  const rows = normalizeMetaList(value);

  function update(index: number, patch: Partial<ProjectMetaItem>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>{label}</Label>
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed px-3 py-4 text-sm text-muted-foreground">
          لا توجد بطاقات بعد. أضف بطاقة مثل «العام» و«2026».
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, index) => (
            <div
              key={index}
              className="grid gap-2 rounded-xl border bg-muted/20 p-3 sm:grid-cols-[1fr_1fr_auto]"
            >
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">العنوان</Label>
                <Input
                  value={row.label}
                  disabled={disabled}
                  placeholder="العام"
                  onChange={(e) => update(index, { label: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">القيمة</Label>
                <Input
                  value={row.value}
                  disabled={disabled}
                  placeholder="2026"
                  onChange={(e) => update(index, { value: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  disabled={disabled}
                  aria-label="حذف البطاقة"
                  onClick={() => onChange(rows.filter((_, i) => i !== index))}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => onChange([...rows, { label: "", value: "" }])}
      >
        <PlusIcon />
        إضافة بطاقة
      </Button>
    </div>
  );
}

export function GalleryListEditor({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: unknown;
  onChange: (value: ProjectGalleryItem[]) => void;
  disabled?: boolean;
}) {
  const rows = normalizeGalleryList(value);
  const caseSize = {
    width: PROJECT_CASE_IMAGE.width,
    height: PROJECT_CASE_IMAGE.height,
    tolerance: PROJECT_CASE_IMAGE.tolerance,
  };

  function update(index: number, patch: Partial<ProjectGalleryItem>) {
    onChange(
      rows.map((row, i) =>
        i === index
          ? {
              ...row,
              ...patch,
              layout: "full",
              aspect: "3240:1350",
            }
          : row,
      ),
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>{label}</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          {hint
            ? `${hint} — `
            : ""}
          صور متتالية بمقاس ثابت {PROJECT_CASE_IMAGE.label} بكسل، تُعرض ملتصقة
          بدون فواصل كما في بيهانس.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed px-3 py-4 text-sm text-muted-foreground">
          لا توجد صور بعد. اضغط «إضافة عنصر» ثم ارفع صورة بمقاس{" "}
          {PROJECT_CASE_IMAGE.label}.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div
              key={index}
              className="space-y-3 rounded-xl border bg-muted/20 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">صورة {index + 1}</p>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  disabled={disabled}
                  aria-label="حذف الصورة"
                  onClick={() => onChange(rows.filter((_, i) => i !== index))}
                >
                  <Trash2Icon />
                </Button>
              </div>

              <MediaUploader
                label={`صورة ${index + 1}`}
                value={row.imageUrl ?? ""}
                disabled={disabled}
                folder="galleries"
                accept="image"
                fixedSize={caseSize}
                onChange={(url) =>
                  update(index, {
                    imageUrl: url.trim() || null,
                  })
                }
              />

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  وصف مختصر (اختياري)
                </Label>
                <Input
                  value={row.caption ?? ""}
                  disabled={disabled}
                  placeholder="مثال: بطاقة العمل"
                  onChange={(e) =>
                    update(index, {
                      caption: e.target.value.trim() || null,
                    })
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() =>
          onChange([
            ...rows,
            {
              imageUrl: null,
              caption: null,
              layout: "full",
              aspect: "3240:1350",
            },
          ])
        }
      >
        <PlusIcon />
        إضافة عنصر
      </Button>
    </div>
  );
}

export type ProductFileRow = { name: string; url: string };

export function normalizeFilesList(value: unknown): ProductFileRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const item = row as Record<string, unknown>;
      return {
        name: String(item.name ?? ""),
        url: String(item.url ?? ""),
      };
    })
    .filter((row): row is ProductFileRow => row !== null);
}

export function cleanFilesList(value: unknown): ProductFileRow[] {
  return normalizeFilesList(value).filter(
    (row) => row.name.trim() && row.url.trim(),
  );
}

export function FilesListEditor({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: unknown;
  onChange: (value: ProductFileRow[]) => void;
  disabled?: boolean;
}) {
  const rows = normalizeFilesList(value);

  return (
    <div className="space-y-3">
      <div>
        <Label>{label}</Label>
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>

      {rows.length > 0 ? (
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div
              key={`file-${index}`}
              className="space-y-3 rounded-xl border bg-card p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">ملف {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={disabled}
                  onClick={() =>
                    onChange(rows.filter((_, i) => i !== index))
                  }
                >
                  <Trash2Icon />
                </Button>
              </div>
              <div className="space-y-2">
                <Label>اسم الملف</Label>
                <Input
                  dir="ltr"
                  className="text-start"
                  value={row.name}
                  disabled={disabled}
                  placeholder="guide.pdf"
                  onChange={(e) => {
                    const next = [...rows];
                    next[index] = { ...row, name: e.target.value };
                    onChange(next);
                  }}
                />
              </div>
              <MediaUploader
                label="رابط الملف / الرفع"
                value={row.url}
                disabled={disabled}
                folder="products/files"
                accept="file"
                onChange={(url) => {
                  const next = [...rows];
                  next[index] = { ...row, url };
                  onChange(next);
                }}
              />
            </div>
          ))}
        </div>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => onChange([...rows, { name: "", url: "" }])}
      >
        <PlusIcon />
        إضافة ملف
      </Button>
    </div>
  );
}
