"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2Icon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import { peekAdminCache } from "@/lib/admin-cache";
import type { CollectionName } from "@/lib/admin-collections";
import { collectionMeta, emptyItem, nextOrderValue, maxOrderValue, clampOrder } from "@/lib/admin-ui-meta";
import {
  AdminField,
  AdminNotice,
  AdminPageHeader,
} from "@/components/admin/admin-field";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import {
  cleanFilesList,
  cleanGalleryList,
  cleanMetaList,
  normalizeFilesList,
  normalizeGalleryList,
  normalizeMetaList,
} from "@/components/admin/list-editors";
import {
  cleanCourseDetailValue,
  normalizeCourseDetail,
} from "@/components/admin/course-detail-editor";
import {
  cleanCourseWatchValue,
  normalizeCourseWatch,
} from "@/components/admin/course-watch-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Item = Record<string, unknown> & { id?: string };

function cachedItems(collection: CollectionName): Item[] {
  return (
    peekAdminCache<{ items: Item[] }>(`/api/admin/${collection}`)?.items ?? []
  );
}

export function CollectionManager({
  collection,
}: {
  collection: CollectionName;
}) {
  const meta = collectionMeta[collection];
  const [items, setItems] = useState<Item[]>(() => cachedItems(collection));
  const [draft, setDraft] = useState<Item | null>(null);
  const [loading, setLoading] = useState(
    () => peekAdminCache(`/api/admin/${collection}`) === null,
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    const path = `/api/admin/${collection}`;
    const cached = peekAdminCache<{ items: Item[] }>(path);
    if (cached) {
      setItems(cached.items ?? []);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await adminFetch<{ items: Item[] }>(path);
      setItems(data.items ?? []);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "تعذّر التحميل");
    } finally {
      setLoading(false);
    }
  }, [collection]);

  useEffect(() => {
    setItems(cachedItems(collection));
    setLoading(peekAdminCache(`/api/admin/${collection}`) === null);
    setDraft(null);
    setPendingDelete(null);
    setDeleting(false);
    setError(null);
    setSuccess(null);
    void load();
  }, [collection, load]);

  const orderMax = useMemo(
    () => maxOrderValue(items, !draft?.id),
    [items, draft?.id],
  );

  const editingLabel = useMemo(() => {
    if (!draft) return null;
    return draft.id ? "تعديل عنصر" : "إضافة عنصر";
  }, [draft]);

  function startCreate() {
    setSuccess(null);
    setError(null);
    const draftItem = emptyItem(collection);
    if ("order" in draftItem) {
      draftItem.order = nextOrderValue(items);
    }
    setDraft(toFormValues(collection, draftItem));
  }

  function startEdit(item: Item) {
    setSuccess(null);
    setError(null);
    const form = toFormValues(collection, item);
    if ("order" in form) {
      form.order = clampOrder(form.order, maxOrderValue(items, false));
    }
    setDraft(form);
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    const toastId = toast.loading(
      draft.id ? "جاري حفظ التعديلات…" : "جاري إضافة العنصر…",
    );
    try {
      const payload = fromFormValues(collection, draft, {
        itemCount: items.length,
        isNew: !draft.id,
      });
      if (draft.id) {
        await adminFetch(`/api/admin/${collection}/${draft.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setSuccess("تم تحديث العنصر.");
        toast.success("تم تحديث العنصر.", { id: toastId });
      } else {
        await adminFetch(`/api/admin/${collection}`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setSuccess("تمت إضافة العنصر.");
        toast.success("تمت إضافة العنصر.", { id: toastId });
      }
      setDraft(null);
      await load();
    } catch (err) {
      const message =
        err instanceof AdminApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "تعذّر الحفظ";
      setError(message);
      toast.error(message, { id: toastId });
    } finally {
      setSaving(false);
    }
  }

  function requestRemove(item: Item) {
    if (!item.id || deleting) return;
    setPendingDelete({
      id: String(item.id),
      label: primaryLabel(item, meta.listKeys),
    });
  }

  async function confirmRemove() {
    if (!pendingDelete || deleting) return;
    const { id, label } = pendingDelete;
    setDeleting(true);
    setError(null);
    setSuccess(null);
    const toastId = toast.loading(`جاري حذف «${label}»…`);
    try {
      await adminFetch(`/api/admin/${collection}/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((item) => String(item.id) !== id));
      if (draft?.id === id) setDraft(null);
      setPendingDelete(null);
      setSuccess("تم الحذف.");
      toast.success("تم الحذف بنجاح.", { id: toastId });
      await load();
    } catch (err) {
      const message =
        err instanceof AdminApiError ? err.message : "تعذّر الحذف";
      setError(message);
      toast.error(message, { id: toastId });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <AdminPageHeader
        title={meta.title}
        description={meta.description}
        actions={
          <Button onClick={startCreate} disabled={loading || deleting}>
            <PlusIcon />
            إضافة
          </Button>
        }
      />

      <div className="space-y-3">
        {error ? <AdminNotice tone="error">{error}</AdminNotice> : null}
        {success ? <AdminNotice tone="success">{success}</AdminNotice> : null}
      </div>

      {draft ? (
        <Card className="mt-5">
          <CardHeader>
            <div className="space-y-1">
              <CardTitle>{editingLabel}</CardTitle>
              <CardDescription>
                الحقول المطلوبة معلّمة بعلامة نجمة.
              </CardDescription>
            </div>
            <CardAction>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() => setDraft(null)}
                >
                  إلغاء
                </Button>
                <Button type="button" disabled={saving} onClick={save}>
                  {saving ? <Loader2Icon className="animate-spin" /> : null}
                  {saving ? "جاري الحفظ…" : "حفظ"}
                </Button>
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {meta.fields.map((field) => (
                <div
                  key={field.key}
                  className={
                    field.type === "textarea" ||
                    field.type === "meta-list" ||
                    field.type === "gallery-list" ||
                    field.type === "files-list" ||
                    field.type === "course-detail" ||
                    field.type === "course-watch" ||
                    field.type === "media" ||
                    field.type === "boolean"
                      ? "md:col-span-2"
                      : undefined
                  }
                >
                  <AdminField
                    field={field}
                    value={draft[field.key]}
                    disabled={saving}
                    orderMax={field.key === "order" ? orderMax : undefined}
                    onChange={(v) =>
                      setDraft((d) => (d ? { ...d, [field.key]: v } : d))
                    }
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="relative mt-5 overflow-hidden p-0">
        {deleting ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/55 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-sm">
              <Loader2Icon className="size-4 animate-spin text-primary" />
              جاري الحذف…
            </div>
          </div>
        ) : null}
        {loading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-2/3" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            لا توجد عناصر بعد. اضغط «إضافة» لبدء القسم.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العنصر</TableHead>
                <TableHead className="hidden md:table-cell">التفاصيل</TableHead>
                <TableHead className="w-[1%] text-end">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const isTarget =
                  deleting &&
                  pendingDelete !== null &&
                  String(item.id) === pendingDelete.id;
                return (
                  <TableRow
                    key={String(item.id)}
                    className={cn(isTarget && "bg-destructive/5 opacity-60")}
                  >
                    <TableCell>
                      <div className="font-medium">
                        {primaryLabel(item, meta.listKeys)}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1 md:hidden">
                        {meta.listKeys.slice(1, 3).map((key) => (
                          <Badge key={key} variant="secondary">
                            {key}: {formatCell(item[key])}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="hidden max-w-md truncate text-muted-foreground md:table-cell">
                      {meta.listKeys
                        .slice(1)
                        .map((key) => `${key}: ${formatCell(item[key])}`)
                        .join(" · ")}
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="inline-flex gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          disabled={deleting}
                          onClick={() => startEdit(item)}
                          aria-label="تعديل"
                        >
                          <PencilIcon />
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon-sm"
                          disabled={deleting}
                          onClick={() => requestRemove(item)}
                          aria-label="حذف"
                        >
                          {isTarget ? (
                            <Loader2Icon className="animate-spin" />
                          ) : (
                            <Trash2Icon />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <ConfirmDeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setPendingDelete(null);
        }}
        itemLabel={pendingDelete?.label}
        collectionLabel={meta.title}
        loading={deleting}
        onConfirm={confirmRemove}
      />
    </div>
  );
}

function toFormValues(collection: CollectionName, item: Item): Item {
  const next: Item = { ...item };
  for (const field of collectionMeta[collection].fields) {
    if (field.type === "meta-list") {
      next[field.key] = normalizeMetaList(item[field.key]);
    } else if (field.type === "gallery-list") {
      next[field.key] = normalizeGalleryList(item[field.key]);
    } else if (field.type === "files-list") {
      next[field.key] = normalizeFilesList(item[field.key]);
    } else if (field.type === "course-detail") {
      next[field.key] = normalizeCourseDetail(item[field.key]);
    } else if (field.type === "course-watch") {
      next[field.key] = normalizeCourseWatch(item[field.key]);
    }
  }
  return next;
}

function fromFormValues(
  collection: CollectionName,
  draft: Item,
  orderCtx: { itemCount: number; isNew: boolean },
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const orderCap = maxOrderValue(
    Array.from({ length: orderCtx.itemCount }),
    orderCtx.isNew,
  );
  for (const field of collectionMeta[collection].fields) {
    const value = draft[field.key];
    if (field.type === "meta-list") {
      payload[field.key] = cleanMetaList(value);
    } else if (field.type === "gallery-list") {
      payload[field.key] = cleanGalleryList(value);
    } else if (field.type === "files-list") {
      payload[field.key] = cleanFilesList(value);
    } else if (field.type === "course-detail") {
      payload[field.key] = cleanCourseDetailValue(value);
    } else if (field.type === "course-watch") {
      payload[field.key] = cleanCourseWatchValue(value);
    } else if (
      field.type === "text" ||
      field.type === "textarea" ||
      field.type === "url" ||
      field.type === "media" ||
      field.type === "select"
    ) {
      const str = String(value ?? "").trim();
      if (field.required && !str) {
        throw new Error(`الحقل المطلوب ناقص: ${field.label}`);
      }
      if (field.type === "select" && field.options?.length && str) {
        const allowed = field.options.some((opt) => opt.value === str);
        if (!allowed) {
          throw new Error(`قيمة غير صالحة لحقل: ${field.label}`);
        }
      }
      payload[field.key] =
        (field.type === "url" || field.type === "media") && !str ? null : str;
    } else {
      if (field.key === "order") {
        payload[field.key] = clampOrder(value, orderCap);
      } else {
        payload[field.key] = value;
      }
    }
  }
  return payload;
}

function primaryLabel(item: Item, listKeys: string[]) {
  const first = listKeys[0];
  return formatCell(item[first] ?? item.id);
}

function formatCell(value: unknown) {
  if (typeof value === "boolean") return value ? "نعم" : "لا";
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}
