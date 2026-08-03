"use client";

import { cn } from "@/lib/utils";
import type { FieldDef } from "@/lib/admin-ui-meta";
import {
  FilesListEditor,
  GalleryListEditor,
  MetaListEditor,
} from "@/components/admin/list-editors";
import { CourseDetailEditor } from "@/components/admin/course-detail-editor";
import { CourseWatchEditor } from "@/components/admin/course-watch-editor";
import { MediaUploader } from "@/components/admin/media-uploader";
import { socialIconMap } from "@/components/icons";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2Icon, CircleAlertIcon, InfoIcon } from "lucide-react";
import { clampOrder } from "@/lib/admin-order";

export function AdminField({
  field,
  value,
  onChange,
  disabled,
  orderMax,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  /** أقصى ترتيب مسموح لحقل order */
  orderMax?: number;
}) {
  const id = `field-${field.key}`;

  if (field.type === "meta-list") {
    return (
      <MetaListEditor
        label={field.label}
        hint={field.hint}
        value={value}
        disabled={disabled}
        onChange={onChange}
      />
    );
  }

  if (field.type === "gallery-list") {
    return (
      <GalleryListEditor
        label={field.label}
        hint={field.hint}
        value={value}
        disabled={disabled}
        onChange={onChange}
      />
    );
  }

  if (field.type === "files-list") {
    return (
      <FilesListEditor
        label={field.label}
        hint={field.hint}
        value={value}
        disabled={disabled}
        onChange={onChange}
      />
    );
  }

  if (field.type === "course-detail") {
    return (
      <CourseDetailEditor
        label={field.label}
        hint={field.hint}
        value={value}
        disabled={disabled}
        onChange={onChange}
      />
    );
  }

  if (field.type === "course-watch") {
    return (
      <CourseWatchEditor
        label={field.label}
        hint={field.hint}
        value={value}
        disabled={disabled}
        onChange={onChange}
      />
    );
  }

  if (field.type === "boolean") {
    return (
      <div className="flex items-center gap-3 rounded-xl border bg-card px-3 py-3">
        <Checkbox
          id={id}
          checked={Boolean(value)}
          disabled={disabled}
          onCheckedChange={(checked) => onChange(checked === true)}
        />
        <Label htmlFor={id} className="cursor-pointer font-normal">
          {field.label}
          {field.required ? <span className="text-destructive"> *</span> : null}
        </Label>
      </div>
    );
  }

  if (field.type === "select") {
    const options = field.options ?? [];
    const selected = String(value ?? "");

    return (
      <div className="space-y-2">
        <Label htmlFor={id}>
          {field.label}
          {field.required ? <span className="text-destructive"> *</span> : null}
        </Label>
        <Select
          value={selected || undefined}
          disabled={disabled}
          onValueChange={(next) => onChange(next)}
        >
          <SelectTrigger id={id} className="h-9 w-full">
            <SelectValue placeholder={field.placeholder ?? "اختر…"} />
          </SelectTrigger>
          <SelectContent
            position="popper"
            className="w-[var(--radix-select-trigger-width)]"
          >
            {options.map((opt) => {
              const Icon =
                opt.iconKey && opt.iconKey in socialIconMap
                  ? socialIconMap[opt.iconKey as keyof typeof socialIconMap]
                  : null;
              return (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="flex items-center gap-2">
                    {Icon ? <Icon className="size-4 text-accent-blue" /> : null}
                    {opt.label}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {field.hint ? (
          <p className="text-xs text-muted-foreground">{field.hint}</p>
        ) : null}
      </div>
    );
  }

  const display =
    value === null || value === undefined ? "" : String(value);

  if (field.type === "media") {
    return (
      <MediaUploader
        label={field.label}
        value={display}
        onChange={(url) => onChange(url)}
        disabled={disabled}
        hint={field.hint}
        required={field.required}
        folder={field.mediaFolder ?? field.key}
        accept={field.mediaAccept ?? "image"}
        fixedSize={field.mediaFixedSize}
      />
    );
  }

  const isOrder = field.key === "order" && field.type === "number";
  const max = isOrder && orderMax ? orderMax : undefined;
  const orderHint = isOrder && max ? `من 1 إلى ${max}` : field.hint;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {field.label}
        {field.required ? <span className="text-destructive"> *</span> : null}
      </Label>

      {field.type === "textarea" ? (
        <Textarea
          id={id}
          rows={4}
          className="min-h-24 resize-y"
          value={display}
          disabled={disabled}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input
          id={id}
          type={
            field.type === "number"
              ? "number"
              : field.type === "url"
                ? "url"
                : "text"
          }
          value={display}
          disabled={disabled}
          placeholder={field.placeholder}
          min={isOrder ? 1 : undefined}
          max={max}
          step={field.type === "number" ? 1 : undefined}
          dir={field.type === "url" ? "ltr" : undefined}
          onChange={(e) => {
            if (field.type === "number") {
              const n = e.target.value === "" ? 0 : Number(e.target.value);
              const next = Number.isFinite(n) ? n : 0;
              onChange(
                isOrder
                  ? clampOrder(next, max ?? Number.MAX_SAFE_INTEGER)
                  : next,
              );
            } else {
              onChange(e.target.value);
            }
          }}
        />
      )}

      {orderHint ? (
        <p className="text-xs text-muted-foreground">{orderHint}</p>
      ) : null}
    </div>
  );
}

export function AdminNotice({
  tone = "info",
  children,
}: {
  tone?: "info" | "error" | "success";
  children: React.ReactNode;
}) {
  const Icon =
    tone === "error"
      ? CircleAlertIcon
      : tone === "success"
        ? CheckCircle2Icon
        : InfoIcon;

  return (
    <Alert
      variant={tone === "error" ? "destructive" : "default"}
      className={cn(
        tone === "success" &&
          "border-emerald-200 bg-emerald-50 text-emerald-900 *:data-[slot=alert-description]:text-emerald-800",
        tone === "info" && "bg-muted/40",
      )}
    >
      <Icon />
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}
