"use client";

import { useEffect, useState } from "react";
import { Loader2Icon, SaveIcon } from "lucide-react";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import { peekAdminCache } from "@/lib/admin-cache";
import {
  AdminField,
  AdminNotice,
  AdminPageHeader,
} from "@/components/admin/admin-field";
import type { FieldDef } from "@/lib/admin-ui-meta";
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

type SettingsPayload = {
  settings: Record<string, unknown> | null;
  banner: Record<string, unknown> | null;
};

const SETTINGS_PATH = "/api/admin/settings";

const settingsFields: FieldDef[] = [
  { key: "designerName", label: "اسم المصمم", type: "text", required: true },
  { key: "siteName", label: "اسم الموقع", type: "text", required: true },
  { key: "avatarUrl", label: "صورة الأفاتار", type: "media", mediaAccept: "image", mediaFolder: "settings" },
  { key: "heroImageUrl", label: "صورة الهيرو", type: "media", mediaAccept: "image", mediaFolder: "settings" },
  { key: "availableForWork", label: "متاح للعمل", type: "boolean" },
  {
    key: "contactEmail",
    label: "البريد",
    type: "text",
    placeholder: "hello@example.com",
  },
  { key: "whatsappUrl", label: "رابط واتساب", type: "url" },
  {
    key: "projectRequestFormUrl",
    label: "رابط طلب مشروع (اختياري)",
    type: "url",
    hint: "اتركه فارغاً لاستخدام الاستمارة الداخلية /project-request",
  },
  { key: "externalPortfolioUrl", label: "بورتفوليو خارجي", type: "url" },
];

const paymentFields: FieldDef[] = [
  {
    key: "qiCardAccount",
    label: "رقم حساب كي كارد",
    type: "text",
    placeholder: "مثال: 1234 5678 9012 3456",
    hint: "يظهر في صفحة شراء الدورة للتحويل عبر كي كارد",
  },
  {
    key: "zainCashAccount",
    label: "رقم حساب زين كاش",
    type: "text",
    placeholder: "مثال: 07XX XXX XXXX",
    hint: "يظهر في صفحة شراء الدورة للتحويل عبر زين كاش",
  },
];

const bannerFields: FieldDef[] = [
  { key: "enabled", label: "إظهار بانر «جديد»", type: "boolean" },
  { key: "title", label: "عنوان البانر", type: "text" },
  {
    key: "contentType",
    label: "نوع المحتوى",
    type: "text",
    placeholder: "دورة / مقال…",
  },
  { key: "href", label: "رابط البانر", type: "url" },
];

function cachedSettings(): SettingsPayload | null {
  return peekAdminCache<SettingsPayload>(SETTINGS_PATH);
}

export function SettingsForm() {
  const initial = cachedSettings();
  const [settings, setSettings] = useState<Record<string, unknown>>(
    () => initial?.settings ?? {},
  );
  const [banner, setBanner] = useState<Record<string, unknown>>(
    () => initial?.banner ?? { enabled: false },
  );
  const [loading, setLoading] = useState(() => initial === null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const cached = cachedSettings();
    if (cached) {
      setSettings(cached.settings ?? {});
      setBanner(cached.banner ?? { enabled: false });
      setLoading(false);
    }

    (async () => {
      try {
        const data = await adminFetch<SettingsPayload>(SETTINGS_PATH);
        if (cancelled) return;
        setSettings(data.settings ?? {});
        setBanner(data.banner ?? { enabled: false });
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof AdminApiError
              ? err.message
              : "تعذّر تحميل الإعدادات",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
        const data = await adminFetch<SettingsPayload>(SETTINGS_PATH, {
          method: "PATCH",
          body: JSON.stringify({ settings, banner }),
        });
      setSettings(data.settings ?? settings);
      setBanner(data.banner ?? banner);
      setSuccess("تم الحفظ. سيظهر التحديث على الموقع خلال لحظات.");
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "تعذّر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-80" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="الإعدادات"
        description="بيانات المصمم، روابط التواصل، وبانر «جديد» في الرئيسية."
        actions={
          <Button onClick={save} disabled={saving}>
            {saving ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <SaveIcon />
            )}
            {saving ? "جاري الحفظ…" : "حفظ التغييرات"}
          </Button>
        }
      />

      <div className="space-y-3">
        {error ? <AdminNotice tone="error">{error}</AdminNotice> : null}
        {success ? <AdminNotice tone="success">{success}</AdminNotice> : null}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>الموقع والتواصل</CardTitle>
          <CardDescription>
            تظهر هذه البيانات في الناف بار، الهيرو، والفوتر.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {settingsFields.map((field) => (
            <div
              key={field.key}
              className={
                field.type === "boolean" || field.type === "media"
                  ? "md:col-span-2"
                  : undefined
              }
            >
                <AdminField
                  field={field}
                  value={settings[field.key]}
                  onChange={(v) =>
                    setSettings((s) => ({ ...s, [field.key]: v }))
                  }
                  disabled={saving}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>حسابات التحويل المالي</CardTitle>
          <CardDescription>
            أرقام كي كارد وزين كاش التي تظهر للعميل في صفحة شراء الدورة.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {paymentFields.map((field) => (
              <div key={field.key}>
                <AdminField
                  field={field}
                  value={settings[field.key]}
                  onChange={(v) =>
                    setSettings((s) => ({ ...s, [field.key]: v }))
                  }
                  disabled={saving}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <div className="space-y-1.5">
            <CardTitle>بانر «جديد»</CardTitle>
            <CardDescription>
              قسم اختياري في الرئيسية — يظهر فقط عند تفعيله.
            </CardDescription>
          </div>
          <CardAction>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setBanner({
                  enabled: false,
                  title: "",
                  contentType: "",
                  href: "",
                })
              }
            >
              مسح البانر
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {bannerFields.map((field) => (
            <div
              key={field.key}
              className={
                field.type === "boolean" || field.type === "media"
                  ? "md:col-span-2"
                  : undefined
              }
            >
                <AdminField
                  field={field}
                  value={banner[field.key]}
                  onChange={(v) => setBanner((b) => ({ ...b, [field.key]: v }))}
                  disabled={saving}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
