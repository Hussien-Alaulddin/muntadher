"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  CheckIcon,
  Loader2Icon,
  ShoppingBagIcon,
  XIcon,
} from "lucide-react";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import { peekAdminCache } from "@/lib/admin-cache";
import { formatSitePrice } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PurchaseRow = {
  id: string;
  status: string;
  whatsappPhone: string;
  receiptImageUrl: string;
  adminNote: string | null;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  product: {
    id: string;
    title: string;
    slug: string;
    price: string;
  };
};

const PATH = "/api/admin/course-purchases";

const STATUS_LABEL: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "مقبول",
  rejected: "مرفوض",
};

function statusBadge(status: string) {
  if (status === "approved") {
    return (
      <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
        {STATUS_LABEL[status]}
      </Badge>
    );
  }
  if (status === "rejected") {
    return <Badge variant="destructive">{STATUS_LABEL[status]}</Badge>;
  }
  return (
    <Badge variant="secondary" className="bg-amber-100 text-amber-900">
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

export function CoursePurchasesManager() {
  const cached = peekAdminCache<{ items: PurchaseRow[] }>(PATH);
  const [items, setItems] = useState<PurchaseRow[]>(() => cached?.items ?? []);
  const [loading, setLoading] = useState(() => cached == null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const hit = peekAdminCache<{ items: PurchaseRow[] }>(PATH);
    if (hit) {
      setItems(hit.items ?? []);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await adminFetch<{ items: PurchaseRow[] }>(PATH);
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

  async function setStatus(
    id: string,
    status: "pending" | "approved" | "rejected",
  ) {
    setBusyId(id);
    setError(null);
    try {
      const data = await adminFetch<{ item: PurchaseRow }>(PATH, {
        method: "PATCH",
        body: JSON.stringify({ id, status }),
      });
      setItems((rows) =>
        rows.map((row) => (row.id === id ? data.item : row)),
      );
    } catch (err) {
      setError(
        err instanceof AdminApiError ? err.message : "تعذّر تحديث الطلب",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          طلبات شراء الدورات
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          راجع إيصالات التحويل وافتح الدورة بعد التأكد من الدفع.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingBagIcon className="size-4" />
              الطلبات
            </CardTitle>
            <CardDescription>
              {loading ? "جاري التحميل…" : `${items.length} طلب`}
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
            تحديث
          </Button>
        </CardHeader>
        <CardContent>
          {loading && items.length === 0 ? (
            <div className="flex justify-center py-10 text-muted-foreground">
              <Loader2Icon className="size-5 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              لا توجد طلبات شراء بعد.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>الدورة</TableHead>
                  <TableHead>واتساب</TableHead>
                  <TableHead>الإيصال</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString("ar-IQ")}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-medium">{item.customer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.customer.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-medium">{item.product.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatSitePrice(item.product.price)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium" dir="ltr">
                      {item.whatsappPhone}
                    </TableCell>
                    <TableCell>
                      <a
                        href={item.receiptImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="relative block size-14 overflow-hidden rounded-lg ring-1 ring-border"
                      >
                        <Image
                          src={item.receiptImageUrl}
                          alt="إيصال التحويل"
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </a>
                    </TableCell>
                    <TableCell>{statusBadge(item.status)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {item.status !== "approved" ? (
                          <Button
                            type="button"
                            size="sm"
                            className="gap-1"
                            disabled={busyId === item.id}
                            onClick={() => void setStatus(item.id, "approved")}
                          >
                            {busyId === item.id ? (
                              <Loader2Icon className="size-3.5 animate-spin" />
                            ) : (
                              <CheckIcon className="size-3.5" />
                            )}
                            قبول
                          </Button>
                        ) : null}
                        {item.status !== "rejected" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            disabled={busyId === item.id}
                            onClick={() => void setStatus(item.id, "rejected")}
                          >
                            <XIcon className="size-3.5" />
                            رفض
                          </Button>
                        ) : null}
                        {item.status !== "pending" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={busyId === item.id}
                            onClick={() => void setStatus(item.id, "pending")}
                          >
                            إعادة للمراجعة
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
