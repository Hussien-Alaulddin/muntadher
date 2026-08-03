"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  BookOpenIcon,
  CalendarIcon,
  CameraIcon,
  LogOutIcon,
  MailIcon,
  PhoneIcon,
  SaveIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react";
import { useShop } from "@/components/shop/shop-provider";
import { userFacingMessage } from "@/lib/public-messages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export type ProfileCustomer = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  countryCode: string | null;
  hasGoogle: boolean;
  avatarUrl: string | null;
  googleAvatarUrl: string | null;
  displayAvatarUrl: string | null;
  createdAt: string;
  stats: {
    courses: number;
    booklets: number;
  };
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "م";
  if (parts.length === 1) return parts[0]!.slice(0, 2);
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`;
}

function formatJoined(iso: string) {
  try {
    return new Intl.DateTimeFormat("ar-IQ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function ProfileView({ customer }: { customer: ProfileCustomer }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const { logout, refresh } = useShop();
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(customer.avatarUrl);
  const [googleAvatarUrl] = useState(customer.googleAvatarUrl);
  const [displayAvatarUrl, setDisplayAvatarUrl] = useState(
    customer.displayAvatarUrl,
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stats] = useState(customer.stats);
  const [email] = useState(customer.email);
  const [meta] = useState({
    hasGoogle: customer.hasGoogle,
    createdAt: customer.createdAt,
  });

  function applyCustomer(next: ProfileCustomer) {
    setName(next.name);
    setPhone(next.phone ?? "");
    setAvatarUrl(next.avatarUrl);
    setDisplayAvatarUrl(next.displayAvatarUrl);
  }

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        customer?: ProfileCustomer;
      };
      if (!res.ok) {
        toast.error(userFacingMessage(data.message, "تعذّر حفظ التعديلات"));
        return;
      }
      if (data.customer) applyCustomer(data.customer);
      await refresh();
      router.refresh();
      toast.success("تم حفظ الملف الشخصي");
    } catch {
      toast.error("تعذّر الاتصال، تحقق من الإنترنت وحاول مرة أخرى");
    } finally {
      setSaving(false);
    }
  }

  async function onUploadAvatar(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/profile", {
        method: "POST",
        credentials: "include",
        body,
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        customer?: ProfileCustomer;
      };
      if (!res.ok) {
        toast.error(userFacingMessage(data.message, "تعذّر رفع الصورة"));
        return;
      }
      if (data.customer) applyCustomer(data.customer);
      await refresh();
      router.refresh();
      toast.success("تم تحديث صورة البروفايل");
    } catch {
      toast.error("تعذّر رفع الصورة");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onClearCustomAvatar() {
    setUploading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearCustomAvatar: true }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        customer?: ProfileCustomer;
      };
      if (!res.ok) {
        toast.error(userFacingMessage(data.message, "تعذّر إزالة الصورة"));
        return;
      }
      if (data.customer) applyCustomer(data.customer);
      await refresh();
      router.refresh();
      toast.success(
        googleAvatarUrl
          ? "تمت العودة لصورة حساب Google"
          : "تمت إزالة صورة البروفايل",
      );
    } catch {
      toast.error("تعذّر إزالة الصورة");
    } finally {
      setUploading(false);
    }
  }

  async function onLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  const usingGoogleDefault = !avatarUrl && Boolean(googleAvatarUrl);

  return (
    <main className="bg-page pb-16 text-ink">
      <section className="border-b border-line bg-[linear-gradient(180deg,#f3f7f6_0%,#ffffff_78%)]">
        <div className="container-site py-10 md:py-14">
          <Badge className="rounded-full bg-brand/10 text-brand hover:bg-brand/10">
            حسابي
          </Badge>
          <div className="mt-5 flex flex-wrap items-center gap-5">
            <div className="relative">
              <Avatar className="size-20 border border-line bg-brand/10 text-brand md:size-24">
                {displayAvatarUrl ? (
                  <AvatarImage src={displayAvatarUrl} alt={name} />
                ) : null}
                <AvatarFallback className="bg-brand/10 font-arabic-bold text-xl text-brand md:text-2xl">
                  {initials(name || customer.name)}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -start-1 flex size-9 items-center justify-center rounded-full border border-line bg-page text-brand shadow-sm transition hover:bg-surface disabled:opacity-60"
                aria-label="تغيير صورة البروفايل"
              >
                <CameraIcon className="size-4" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onUploadAvatar(file);
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-arabic-bold text-3xl md:text-4xl">
                {name || customer.name}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-ink-secondary">
                <MailIcon className="size-4 shrink-0" />
                <span className="truncate" dir="ltr">
                  {email}
                </span>
                {meta.hasGoogle ? (
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-surface text-ink-secondary"
                  >
                    Google
                  </Badge>
                ) : null}
              </p>
              <p className="mt-2 text-xs text-ink-muted">
                {usingGoogleDefault
                  ? "الصورة الحالية من حساب Google — يمكنك استبدالها بصورة خاصة"
                  : avatarUrl
                    ? "تستخدم صورة بروفايل مخصصة"
                    : "لم تُضف صورة بعد — ارفع صورة أو سجّل عبر Google لاستخدام صورته"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full gap-1.5"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  <CameraIcon className="size-3.5" />
                  {uploading ? "جارٍ الرفع…" : "رفع صورة"}
                </Button>
                {avatarUrl ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="rounded-full gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={uploading}
                    onClick={() => void onClearCustomAvatar()}
                  >
                    <Trash2Icon className="size-3.5" />
                    {googleAvatarUrl ? "العودة لصورة Google" : "إزالة الصورة"}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-site grid gap-6 py-10 md:py-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
        <Card className="border-line bg-white/80 shadow-sm backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-arabic-bold text-xl text-ink">
              <UserIcon className="size-5 text-brand" />
              البيانات الشخصية
            </CardTitle>
            <CardDescription className="text-ink-secondary">
              حدّث اسمك ورقم هاتفك. البريد الإلكتروني ثابت لربط الحساب.
            </CardDescription>
          </CardHeader>
          <form onSubmit={onSave}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="profile-name">الاسم</Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="اسمك الكامل"
                  required
                  minLength={2}
                  maxLength={80}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-email">البريد الإلكتروني</Label>
                <Input
                  id="profile-email"
                  value={email}
                  readOnly
                  dir="ltr"
                  className="bg-surface text-ink-secondary"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-phone">رقم الهاتف</Label>
                <Input
                  id="profile-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+964…"
                  dir="ltr"
                  maxLength={30}
                />
              </div>
            </CardContent>
            <CardFooter className="justify-start gap-2 border-t border-line bg-surface/40 py-4">
              <Button
                type="submit"
                disabled={saving}
                className="rounded-full gap-1.5 bg-brand text-inverted hover:bg-brand-hover"
              >
                <SaveIcon className="size-4" />
                {saving ? "جارٍ الحفظ…" : "حفظ التعديلات"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="space-y-6">
          <Card className="border-line bg-white/80 shadow-sm backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-arabic-bold text-lg text-ink">
                نظرة عامة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-surface p-4 text-center">
                  <p className="font-arabic-bold text-2xl text-brand">
                    {stats.courses}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">الدورات</p>
                </div>
                <div className="rounded-2xl bg-surface p-4 text-center">
                  <p className="font-arabic-bold text-2xl text-brand">
                    {stats.booklets}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">الكتيبات</p>
                </div>
              </div>

              <Separator />

              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2 text-ink-secondary">
                  <CalendarIcon className="mt-0.5 size-4 shrink-0 text-brand" />
                  <span>
                    انضم في{" "}
                    <span className="text-ink">{formatJoined(meta.createdAt)}</span>
                  </span>
                </li>
                <li className="flex items-start gap-2 text-ink-secondary">
                  <PhoneIcon className="mt-0.5 size-4 shrink-0 text-brand" />
                  <span dir="ltr">{phone || "لم يُضف رقم هاتف"}</span>
                </li>
                <li className="flex items-start gap-2 text-ink-secondary">
                  <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-brand" />
                  <span>
                    {meta.hasGoogle
                      ? "مرتبط بحساب Google"
                      : "تسجيل بالبريد وكلمة المرور"}
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-line bg-white/80 shadow-sm backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-arabic-bold text-lg text-ink">
                اختصارات
              </CardTitle>
              <CardDescription className="text-ink-secondary">
                انتقل بسرعة إلى دوراتك أو المنتجات.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button
                asChild
                variant="outline"
                className="justify-start rounded-full gap-2"
              >
                <Link href="/my-courses">
                  <BookOpenIcon className="size-4 text-brand" />
                  دوراتي
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="justify-start rounded-full gap-2"
              >
                <Link href="/products">تصفح المنتجات</Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="justify-start rounded-full gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => void onLogout()}
              >
                <LogOutIcon className="size-4" />
                تسجيل الخروج
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
