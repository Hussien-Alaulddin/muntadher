"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ClipboardListIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import { peekAdminCache } from "@/lib/admin-cache";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

type QuestionType =
  | "text"
  | "textarea"
  | "single_select"
  | "multi_select"
  | "contact_methods";

type Question = {
  id: string;
  key: string;
  heading: string;
  subtext: string | null;
  type: QuestionType | string;
  required: boolean;
  options: string[] | null;
  order: number;
  enabled: boolean;
};

type Draft = {
  id?: string;
  key: string;
  heading: string;
  subtext: string;
  type: QuestionType;
  required: boolean;
  optionsText: string;
  order: number;
  enabled: boolean;
};

const TYPE_LABELS: Record<QuestionType, string> = {
  text: "نص قصير",
  textarea: "نص طويل",
  single_select: "اختيار واحد",
  multi_select: "خيارات متعددة",
  contact_methods: "وسائل تواصل",
};

function emptyDraft(nextOrder: number): Draft {
  return {
    key: "",
    heading: "",
    subtext: "",
    type: "text",
    required: true,
    optionsText: "",
    order: nextOrder,
    enabled: true,
  };
}

function toDraft(q: Question): Draft {
  return {
    id: q.id,
    key: q.key,
    heading: q.heading,
    subtext: q.subtext ?? "",
    type: (q.type as QuestionType) || "text",
    required: q.required,
    optionsText: (q.options ?? []).join("\n"),
    order: q.order,
    enabled: q.enabled,
  };
}

function needsOptions(type: QuestionType) {
  return (
    type === "single_select" ||
    type === "multi_select" ||
    type === "contact_methods"
  );
}

const FORM_QUESTIONS_PATH = "/api/admin/form-questions";

export function FormQuestionsManager() {
  const cached = peekAdminCache<{ items: Question[] }>(FORM_QUESTIONS_PATH);
  const [items, setItems] = useState<Question[]>(() => cached?.items ?? []);
  const [loading, setLoading] = useState(() => cached == null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft(1));
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const deleteLabel = useMemo(
    () => items.find((i) => i.id === deleteId)?.heading ?? null,
    [items, deleteId],
  );

  const load = useCallback(async () => {
    const hit = peekAdminCache<{ items: Question[] }>(FORM_QUESTIONS_PATH);
    if (hit) {
      setItems(hit.items ?? []);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await adminFetch<{ items: Question[] }>(FORM_QUESTIONS_PATH);
      setItems(data.items ?? []);
    } catch (err) {
      setError(
        err instanceof AdminApiError
          ? err.message
          : "تعذّر الاتصال بالخادم",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    const next =
      items.reduce((max, item) => Math.max(max, item.order), 0) + 1;
    setDraft(emptyDraft(next));
    setOpen(true);
  }

  function openEdit(q: Question) {
    setDraft(toDraft(q));
    setOpen(true);
  }

  async function save() {
    if (!draft.heading.trim() || !draft.key.trim()) {
      toast.error("المفتاح وعنوان السؤال مطلوبان");
      return;
    }

    const options = needsOptions(draft.type)
      ? draft.optionsText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
      : null;

    if (needsOptions(draft.type) && (!options || options.length === 0)) {
      toast.error("أضف خياراً واحداً على الأقل");
      return;
    }

    const payload = {
      key: draft.key,
      heading: draft.heading,
      subtext: draft.subtext,
      type: draft.type,
      required: draft.required,
      options,
      order: draft.order,
      enabled: draft.enabled,
    };

    setSaving(true);
    const toastId = toast.loading(draft.id ? "جاري التحديث…" : "جاري الإضافة…");
    try {
      if (draft.id) {
        await adminFetch(`/api/admin/form-questions/${draft.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("تم تحديث السؤال.", { id: toastId });
      } else {
        await adminFetch("/api/admin/form-questions", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("تمت إضافة السؤال.", { id: toastId });
      }
      setOpen(false);
      await load();
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : "تعذّر الحفظ",
        { id: toastId },
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const toastId = toast.loading("جاري الحذف…");
    try {
      await adminFetch(`/api/admin/form-questions/${deleteId}`, {
        method: "DELETE",
      });
      toast.success("تم الحذف.", { id: toastId });
      setDeleteId(null);
      await load();
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : "تعذّر الحذف",
        { id: toastId },
      );
    } finally {
      setDeleting(false);
    }
  }

  async function toggleEnabled(q: Question) {
    try {
      await adminFetch(`/api/admin/form-questions/${q.id}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: !q.enabled }),
      });
      setItems((prev) =>
        prev.map((item) =>
          item.id === q.id ? { ...item, enabled: !item.enabled } : item,
        ),
      );
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : "تعذّر التحديث",
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">أسئلة الاستمارة</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            عدّل أسئلة استمارة طلب المشروع — كل سؤال يظهر في شاشة مستقلة
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-brand hover:bg-brand-hover"
        >
          <PlusIcon className="size-4" />
          سؤال جديد
        </Button>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardListIcon className="size-4" />
              الأسئلة
            </CardTitle>
            <CardDescription>
              {loading ? "جاري التحميل…" : `${items.length} سؤال`}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الترتيب</TableHead>
                  <TableHead>السؤال</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>مفعّل</TableHead>
                  <TableHead className="w-[120px]">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!loading && items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground"
                    >
                      لا توجد أسئلة بعد
                    </TableCell>
                  </TableRow>
                ) : null}
                {items.map((row) => (
                  <TableRow key={row.id} className={!row.enabled ? "opacity-50" : undefined}>
                    <TableCell>{row.order}</TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-medium">{row.heading}</p>
                        <p className="text-xs text-muted-foreground" dir="ltr">
                          {row.key}
                          {row.required ? " · مطلوب" : " · اختياري"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {TYPE_LABELS[row.type as QuestionType] ?? row.type}
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={row.enabled}
                        onCheckedChange={() => void toggleEnabled(row)}
                        aria-label="تفعيل السؤال"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(row)}
                          aria-label="تعديل"
                        >
                          <PencilIcon className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteId(row.id)}
                          aria-label="حذف"
                        >
                          <Trash2Icon className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {draft.id ? "تعديل السؤال" : "سؤال جديد"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="q-key">المفتاح</Label>
              <Input
                id="q-key"
                dir="ltr"
                value={draft.key}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, key: e.target.value }))
                }
                placeholder="name"
                disabled={Boolean(draft.id)}
              />
              <p className="text-xs text-muted-foreground">
                معرّف ثابت في الردود — لا يُغيّر بعد الإنشاء
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="q-heading">نص السؤال</Label>
              <Textarea
                id="q-heading"
                value={draft.heading}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, heading: e.target.value }))
                }
                rows={2}
                placeholder="كيف يمكنني مساعدتك يا {الاسم}؟"
              />
              <p className="text-xs text-muted-foreground">
                استخدم {"{الاسم}"} لتخصيص السؤال باسم الزائر
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="q-subtext">نص فرعي (اختياري)</Label>
              <Textarea
                id="q-subtext"
                value={draft.subtext}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, subtext: e.target.value }))
                }
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="q-type">النوع</Label>
                <select
                  id="q-type"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={draft.type}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      type: e.target.value as QuestionType,
                    }))
                  }
                >
                  {(Object.keys(TYPE_LABELS) as QuestionType[]).map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="q-order">الترتيب</Label>
                <Input
                  id="q-order"
                  type="number"
                  min={1}
                  value={draft.order}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      order: Number(e.target.value) || 1,
                    }))
                  }
                />
              </div>
            </div>

            {needsOptions(draft.type) ? (
              <div className="grid gap-2">
                <Label htmlFor="q-options">الخيارات (سطر لكل خيار)</Label>
                <Textarea
                  id="q-options"
                  value={draft.optionsText}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, optionsText: e.target.value }))
                  }
                  rows={5}
                  placeholder={"خيار 1\nخيار 2"}
                />
              </div>
            ) : null}

            <div className="flex flex-wrap gap-5">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={draft.required}
                  onCheckedChange={(v) =>
                    setDraft((d) => ({ ...d, required: Boolean(v) }))
                  }
                />
                مطلوب
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={draft.enabled}
                  onCheckedChange={(v) =>
                    setDraft((d) => ({ ...d, enabled: Boolean(v) }))
                  }
                />
                مفعّل في الاستمارة
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button
              className="bg-brand hover:bg-brand-hover"
              disabled={saving}
              onClick={() => void save()}
            >
              {saving ? "جاري الحفظ…" : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(deleteId)}
        onOpenChange={(next) => {
          if (!next) setDeleteId(null);
        }}
        itemLabel={deleteLabel}
        collectionLabel="أسئلة الاستمارة"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
