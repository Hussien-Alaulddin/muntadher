"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DownloadIcon,
  InboxIcon,
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type FormResponse = {
  id: string;
  answers: Record<string, unknown>;
  name: string | null;
  helpType: string | null;
  contactEmail: string | null;
  contactWhatsapp: string | null;
  contactInstagram: string | null;
  status: string;
  createdAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  new: "جديد",
  contacted: "تم التواصل",
  closed: "مغلق",
};

function formatAnswerValue(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string") return value.trim() || "—";
  if (Array.isArray(value)) {
    const items = value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
    return items.length ? items.join(" · ") : "—";
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const parts = Object.entries(obj)
      .map(([k, v]) => {
        const text = typeof v === "string" ? v.trim() : "";
        return text ? `${k}: ${text}` : null;
      })
      .filter(Boolean);
    return parts.length ? parts.join(" · ") : "—";
  }
  return String(value);
}

const ANSWER_LABELS: Record<string, string> = {
  name: "الاسم",
  help_type: "نوع المساعدة",
  role: "الدور",
  project_description: "وصف المشروع",
  project_link: "رابط المشروع",
  company_size: "حجم الشركة",
  budget: "الميزانية",
  contact: "التواصل",
};

const FORM_RESPONSES_PATH = "/api/admin/form-responses";

export function FormResponsesManager() {
  const cached = peekAdminCache<{ items: FormResponse[] }>(FORM_RESPONSES_PATH);
  const [items, setItems] = useState<FormResponse[]>(() => cached?.items ?? []);
  const [loading, setLoading] = useState(() => cached == null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FormResponse | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const deleteLabel = useMemo(
    () => items.find((i) => i.id === deleteId)?.name ?? "رد",
    [items, deleteId],
  );

  const load = useCallback(async () => {
    const hit = peekAdminCache<{ items: FormResponse[] }>(FORM_RESPONSES_PATH);
    if (hit) {
      setItems(hit.items ?? []);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await adminFetch<{ items: FormResponse[] }>(
        FORM_RESPONSES_PATH,
      );
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

  async function exportCsv() {
    try {
      const res = await fetch("/api/admin/form-responses?format=csv", {
        credentials: "same-origin",
      });
      if (!res.ok) {
        toast.error("تعذّر تصدير الملف");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `form-responses-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("تعذّر تصدير الملف");
    }
  }

  async function updateStatus(id: string, status: string) {
    const toastId = toast.loading("جاري تحديث الحالة…");
    try {
      const data = await adminFetch<{ item: FormResponse }>(
        `/api/admin/form-responses/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
      );
      setItems((prev) =>
        prev.map((item) => (item.id === id ? data.item : item)),
      );
      setSelected((prev) => (prev?.id === id ? data.item : prev));
      toast.success("تم تحديث الحالة.", { id: toastId });
      window.dispatchEvent(new Event("admin:form-notifications-refresh"));
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : "تعذّر التحديث",
        { id: toastId },
      );
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const toastId = toast.loading("جاري الحذف…");
    try {
      await adminFetch(`/api/admin/form-responses/${deleteId}`, {
        method: "DELETE",
      });
      toast.success("تم الحذف.", { id: toastId });
      if (selected?.id === deleteId) setSelected(null);
      setDeleteId(null);
      window.dispatchEvent(new Event("admin:form-notifications-refresh"));
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ردود الاستمارة</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            طلبات المشاريع الواردة من الاستمارة العامة
          </p>
        </div>
        <Button
          onClick={() => void exportCsv()}
          className="bg-brand hover:bg-brand-hover"
          disabled={items.length === 0}
        >
          <DownloadIcon className="size-4" />
          تصدير CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <InboxIcon className="size-4" />
              الردود
            </CardTitle>
            <CardDescription>
              {loading ? "جاري التحميل…" : `${items.length} رد`}
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
                  <TableHead>الاسم</TableHead>
                  <TableHead>نوع المساعدة</TableHead>
                  <TableHead>التواصل</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {!loading && items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground"
                    >
                      لا توجد ردود بعد
                    </TableCell>
                  </TableRow>
                ) : null}
                {items.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => setSelected(row)}
                  >
                    <TableCell className="font-medium">
                      {row.name || "—"}
                    </TableCell>
                    <TableCell>{row.helpType || "—"}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">
                      {row.contactEmail ||
                        row.contactWhatsapp ||
                        row.contactInstagram ||
                        "—"}
                    </TableCell>
                    <TableCell>
                      {STATUS_LABELS[row.status] ?? row.status}
                    </TableCell>
                    <TableCell>
                      {new Date(row.createdAt).toLocaleDateString("ar")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(row.id);
                        }}
                        aria-label="حذف"
                      >
                        <Trash2Icon className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(next) => {
          if (!next) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selected.name || "رد بدون اسم"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="resp-status">
                    الحالة
                  </label>
                  <select
                    id="resp-status"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                    value={selected.status}
                    onChange={(e) =>
                      void updateStatus(selected.id, e.target.value)
                    }
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <dl className="space-y-3">
                  {Object.entries(selected.answers ?? {}).map(([key, value]) => (
                    <div key={key} className="space-y-1 border-b border-border/60 pb-3 last:border-0">
                      <dt className="text-xs text-muted-foreground">
                        {ANSWER_LABELS[key] ?? key}
                      </dt>
                      <dd className="whitespace-pre-wrap text-sm">
                        {formatAnswerValue(value)}
                      </dd>
                    </div>
                  ))}
                </dl>

                <p className="text-xs text-muted-foreground">
                  أُرسل في{" "}
                  {new Date(selected.createdAt).toLocaleString("ar")}
                </p>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(deleteId)}
        onOpenChange={(next) => {
          if (!next) setDeleteId(null);
        }}
        itemLabel={deleteLabel}
        collectionLabel="ردود الاستمارة"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
