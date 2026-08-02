"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import {
  CheckCircle2Icon,
  ImagePlusIcon,
  Loader2Icon,
  ShieldCheckIcon,
  UploadIcon,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatSitePrice } from "@/lib/currency";

const COUNTRY_DIALS = [
  { code: "IQ", name: "العراق", dial: "964", flag: "🇮🇶" },
  { code: "SA", name: "السعودية", dial: "966", flag: "🇸🇦" },
  { code: "KW", name: "الكويت", dial: "965", flag: "🇰🇼" },
  { code: "AE", name: "الإمارات", dial: "971", flag: "🇦🇪" },
  { code: "QA", name: "قطر", dial: "974", flag: "🇶🇦" },
  { code: "BH", name: "البحرين", dial: "973", flag: "🇧🇭" },
  { code: "OM", name: "عُمان", dial: "968", flag: "🇴🇲" },
  { code: "JO", name: "الأردن", dial: "962", flag: "🇯🇴" },
  { code: "PS", name: "فلسطين", dial: "970", flag: "🇵🇸" },
  { code: "EG", name: "مصر", dial: "20", flag: "🇪🇬" },
  { code: "SY", name: "سوريا", dial: "963", flag: "🇸🇾" },
  { code: "LB", name: "لبنان", dial: "961", flag: "🇱🇧" },
  { code: "YE", name: "اليمن", dial: "967", flag: "🇾🇪" },
  { code: "SD", name: "السودان", dial: "249", flag: "🇸🇩" },
  { code: "LY", name: "ليبيا", dial: "218", flag: "🇱🇾" },
  { code: "TN", name: "تونس", dial: "216", flag: "🇹🇳" },
  { code: "DZ", name: "الجزائر", dial: "213", flag: "🇩🇿" },
  { code: "MA", name: "المغرب", dial: "212", flag: "🇲🇦" },
  { code: "MR", name: "موريتانيا", dial: "222", flag: "🇲🇷" },
  { code: "SO", name: "الصومال", dial: "252", flag: "🇸🇴" },
  { code: "DJ", name: "جيبوتي", dial: "253", flag: "🇩🇯" },
  { code: "KM", name: "جزر القمر", dial: "269", flag: "🇰🇲" },
  { code: "TR", name: "تركيا", dial: "90", flag: "🇹🇷" },
  { code: "IR", name: "إيران", dial: "98", flag: "🇮🇷" },
  { code: "PK", name: "باكستان", dial: "92", flag: "🇵🇰" },
  { code: "AF", name: "أفغانستان", dial: "93", flag: "🇦🇫" },
  { code: "IN", name: "الهند", dial: "91", flag: "🇮🇳" },
  { code: "BD", name: "بنغلاديش", dial: "880", flag: "🇧🇩" },
  { code: "ID", name: "إندونيسيا", dial: "62", flag: "🇮🇩" },
  { code: "MY", name: "ماليزيا", dial: "60", flag: "🇲🇾" },
  { code: "GB", name: "بريطانيا", dial: "44", flag: "🇬🇧" },
  { code: "DE", name: "ألمانيا", dial: "49", flag: "🇩🇪" },
  { code: "FR", name: "فرنسا", dial: "33", flag: "🇫🇷" },
  { code: "IT", name: "إيطاليا", dial: "39", flag: "🇮🇹" },
  { code: "ES", name: "إسبانيا", dial: "34", flag: "🇪🇸" },
  { code: "NL", name: "هولندا", dial: "31", flag: "🇳🇱" },
  { code: "SE", name: "السويد", dial: "46", flag: "🇸🇪" },
  { code: "NO", name: "النرويج", dial: "47", flag: "🇳🇴" },
  { code: "DK", name: "الدنمارك", dial: "45", flag: "🇩🇰" },
  { code: "FI", name: "فنلندا", dial: "358", flag: "🇫🇮" },
  { code: "CH", name: "سويسرا", dial: "41", flag: "🇨🇭" },
  { code: "AT", name: "النمسا", dial: "43", flag: "🇦🇹" },
  { code: "BE", name: "بلجيكا", dial: "32", flag: "🇧🇪" },
  { code: "CA", name: "كندا", dial: "1", flag: "🇨🇦" },
  { code: "US", name: "الولايات المتحدة", dial: "1", flag: "🇺🇸" },
  { code: "AU", name: "أستراليا", dial: "61", flag: "🇦🇺" },
  { code: "NZ", name: "نيوزيلندا", dial: "64", flag: "🇳🇿" },
  { code: "BR", name: "البرازيل", dial: "55", flag: "🇧🇷" },
  { code: "RU", name: "روسيا", dial: "7", flag: "🇷🇺" },
  { code: "CN", name: "الصين", dial: "86", flag: "🇨🇳" },
  { code: "JP", name: "اليابان", dial: "81", flag: "🇯🇵" },
  { code: "KR", name: "كوريا الجنوبية", dial: "82", flag: "🇰🇷" },
  { code: "SG", name: "سنغافورة", dial: "65", flag: "🇸🇬" },
  { code: "ZA", name: "جنوب أفريقيا", dial: "27", flag: "🇿🇦" },
  { code: "NG", name: "نيجيريا", dial: "234", flag: "🇳🇬" },
  { code: "KE", name: "كينيا", dial: "254", flag: "🇰🇪" },
] as const;

export type CoursePurchaseView = {
  id: string;
  slug: string;
  title: string;
  type: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  coverImageUrl: string | null;
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

function normalizeLocalPhone(value: string) {
  return value.replace(/[^\d]/g, "").replace(/^0+/, "");
}

function buildWhatsappHref(whatsappUrl: string) {
  const raw = whatsappUrl.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

export function CoursePurchaseForm({
  course,
  qiCardAccount,
  zainCashAccount,
  customerName,
  supportWhatsappUrl,
}: {
  course: CoursePurchaseView;
  qiCardAccount: string;
  zainCashAccount: string;
  customerName: string;
  supportWhatsappUrl: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [countryCode, setCountryCode] = useState("IQ");
  const [localPhone, setLocalPhone] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const image = course.coverImageUrl || course.imageUrl;
  const selectedCountry =
    COUNTRY_DIALS.find((c) => c.code === countryCode) ?? COUNTRY_DIALS[0];
  const supportHref = useMemo(() => {
    return (
      buildWhatsappHref(supportWhatsappUrl) ??
      "https://wa.me/"
    );
  }, [supportWhatsappUrl]);

  async function onFileChange(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/shop/upload", {
        method: "POST",
        body,
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        url?: string;
      };
      if (!res.ok || !data.url) {
        setError(data.message ?? "تعذّر رفع صورة التحويل");
        return;
      }
      setReceiptUrl(data.url);
    } catch {
      setError("تعذّر رفع صورة التحويل");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const local = normalizeLocalPhone(localPhone);
    if (local.length < 7) {
      setError("أدخل رقم واتساب صالحاً");
      return;
    }

    const whatsappPhone = `+${selectedCountry.dial}${local}`;
    setSubmitting(true);
    try {
      const res = await fetch("/api/shop/course-purchase", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: course.id,
          whatsappPhone,
          receiptImageUrl: receiptUrl,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
      };
      if (!res.ok) {
        setError(data.message ?? "تعذّر إرسال الطلب");
        return;
      }
      setSuccess(
        data.message ??
          "تم إرسال طلبك بنجاح وسيتم مراجعته قريباً وفتح الدورة لك.",
      );
    } catch {
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <Card className="mx-auto max-w-xl border-line bg-white/70 text-center shadow-sm backdrop-blur-xl">
        <CardHeader className="justify-items-center gap-3 pt-10 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2Icon className="size-7" />
          </div>
          <CardTitle className="font-arabic-bold text-2xl text-ink">
            تم إرسال طلبك بنجاح
          </CardTitle>
          <CardDescription className="max-w-md text-center text-base leading-relaxed text-ink-secondary">
            {success}
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center pb-10">
          <Button asChild variant="outline" className="rounded-full">
            <a href={`/products/${course.slug}`}>العودة لصفحة الدورة</a>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <Card className="overflow-hidden border-line bg-white/70 shadow-sm backdrop-blur-xl">
        <div className="relative aspect-[16/10] bg-surface">
          {image ? (
            <Image
              src={image}
              alt={course.title}
              fill
              className="object-cover"
              sizes="(max-width:1024px) 100vw, 560px"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-ink-muted">
              لا توجد صورة للدورة
            </div>
          )}
        </div>
        <CardHeader className="gap-3">
          <Badge className="w-fit rounded-full bg-brand/10 text-brand hover:bg-brand/10">
            {course.type || "دورة رقمية"}
          </Badge>
          <CardTitle className="font-arabic-bold text-2xl leading-snug text-ink md:text-3xl">
            {course.title}
          </CardTitle>
          {course.description ? (
            <CardDescription className="text-base leading-relaxed text-ink-secondary">
              {course.description}
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-4 rounded-2xl bg-surface px-5 py-4 ring-1 ring-line">
            <div>
              <p className="text-sm text-ink-muted">سعر الدورة</p>
              <p className="mt-1 font-arabic-bold text-3xl text-brand">
                {formatSitePrice(course.price)}
              </p>
            </div>
            <p className="max-w-[12rem] text-end text-xs leading-relaxed text-ink-muted">
              مرحباً {customerName} — أكمل التحويل ثم أرسل الطلب للمراجعة
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-line bg-white/70 shadow-sm backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-xl text-ink">إتمام الشراء</CardTitle>
          <CardDescription>
            حوّل المبلغ إلى أحد الحسابات أدناه، ثم ارفع صورة الإيصال مع رقم واتسابك.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="space-y-3 rounded-2xl bg-surface p-4 ring-1 ring-line">
              <p className="text-sm font-medium text-ink">أرقام التحويل</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3 rounded-xl bg-page px-3 py-2.5 ring-1 ring-line">
                  <span className="text-sm text-ink-secondary">كي كارد</span>
                  <span className="font-medium text-ink" dir="ltr">
                    {qiCardAccount || "لم يُضف بعد"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl bg-page px-3 py-2.5 ring-1 ring-line">
                  <span className="text-sm text-ink-secondary">زين كاش</span>
                  <span className="font-medium text-ink" dir="ltr">
                    {zainCashAccount || "لم يُضف بعد"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">رقم واتساب</Label>
              <div className="flex gap-2" dir="ltr">
                <Select
                  value={countryCode}
                  onValueChange={setCountryCode}
                  disabled={submitting}
                >
                  <SelectTrigger className="h-9 w-[8.5rem] shrink-0">
                    <SelectValue>
                      <span className="flex items-center gap-1.5">
                        <span className="text-base leading-none">
                          {selectedCountry.flag}
                        </span>
                        <span dir="ltr">+{selectedCountry.dial}</span>
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_DIALS.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        <span className="flex items-center gap-2">
                          <span className="text-base leading-none">
                            {country.flag}
                          </span>
                          <span>{country.name}</span>
                          <span className="text-muted-foreground" dir="ltr">
                            +{country.dial}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="whatsapp"
                  dir="ltr"
                  inputMode="tel"
                  placeholder="7XXXXXXXXX"
                  value={localPhone}
                  onChange={(e) => setLocalPhone(e.target.value)}
                  required
                  disabled={submitting}
                  className="min-w-0 flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>صورة التحويل المالي</Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => void onFileChange(e.target.files?.[0] ?? null)}
              />
              {receiptUrl ? (
                <div className="space-y-3">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-2xl ring-1 ring-line">
                    <Image
                      src={receiptUrl}
                      alt="صورة التحويل"
                      fill
                      className="object-cover"
                      sizes="420px"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading || submitting}
                    onClick={() => fileRef.current?.click()}
                  >
                    استبدال الصورة
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={uploading || submitting}
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-surface px-4 py-8 text-sm text-ink-secondary transition hover:bg-surface-alt"
                >
                  {uploading ? (
                    <Loader2Icon className="size-6 animate-spin text-brand" />
                  ) : (
                    <ImagePlusIcon className="size-6 text-brand" />
                  )}
                  {uploading ? "جاري الرفع…" : "اضغط لرفع صورة الإيصال"}
                </button>
              )}
            </div>

            {error ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <Separator />

            <Button
              type="submit"
              disabled={submitting || uploading || !receiptUrl}
              className="h-11 w-full gap-2 rounded-full bg-brand text-inverted hover:bg-brand-hover"
            >
              {submitting ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <UploadIcon className="size-4" />
              )}
              {submitting ? "جاري الإرسال…" : "إرسال طلب الشراء"}
            </Button>

            <Button
              asChild
              type="button"
              variant="outline"
              className="h-11 w-full gap-2 rounded-full border-[#25D366]/25 bg-[#25D366]/10 text-[#128C7E] shadow-none hover:bg-[#25D366]/15 hover:text-[#075E54]"
            >
              <a href={supportHref} target="_blank" rel="noreferrer">
                <WhatsAppIcon className="size-5" />
                تواصل معنا على واتساب إذا احتجت مساعدة
              </a>
            </Button>

            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-ink-muted">
              <ShieldCheckIcon className="size-3.5 text-brand" />
              سيتم مراجعة التحويل يدوياً ثم فتح الدورة لحسابك
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
