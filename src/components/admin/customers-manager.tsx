"use client";

import { useCallback, useEffect, useState } from "react";
import { DownloadIcon, UsersIcon } from "lucide-react";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import { peekAdminCache } from "@/lib/admin-cache";
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

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  location: string;
  entitlementsCount: number;
  createdAt: string;
};

const CUSTOMERS_PATH = "/api/admin/customers";

export function CustomersManager() {
  const cached = peekAdminCache<{ items: CustomerRow[] }>(CUSTOMERS_PATH);
  const [items, setItems] = useState<CustomerRow[]>(() => cached?.items ?? []);
  const [loading, setLoading] = useState(() => cached == null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const hit = peekAdminCache<{ items: CustomerRow[] }>(CUSTOMERS_PATH);
    if (hit) {
      setItems(hit.items ?? []);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await adminFetch<{ items: CustomerRow[] }>(CUSTOMERS_PATH);
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
      const res = await fetch("/api/admin/customers?format=csv", {
        credentials: "same-origin",
      });
      if (!res.ok) {
        setError("تعذّر تصدير الملف");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("تعذّر تصدير الملف");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">بيانات العملاء</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            إيميلات المسجّلين عبر المتجر — مع بلد/محافظة تقديرية من الـ IP
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
              <UsersIcon className="size-4" />
              العملاء المسجّلون
            </CardTitle>
            <CardDescription>
              {loading ? "جاري التحميل…" : `${items.length} عميل`}
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
                  <TableHead>البريد</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>الموقع</TableHead>
                  <TableHead>الكتيبات</TableHead>
                  <TableHead>تاريخ التسجيل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!loading && items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground"
                    >
                      لا يوجد عملاء بعد
                    </TableCell>
                  </TableRow>
                ) : null}
                {items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell dir="ltr" className="text-start">
                      {row.email}
                    </TableCell>
                    <TableCell dir="ltr" className="text-start">
                      {row.phone || "—"}
                    </TableCell>
                    <TableCell>{row.location || "—"}</TableCell>
                    <TableCell>{row.entitlementsCount}</TableCell>
                    <TableCell>
                      {new Date(row.createdAt).toLocaleDateString("en-US")}
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
