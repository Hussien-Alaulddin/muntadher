import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpLeftIcon,
  BookOpenIcon,
  Clock3Icon,
  PlayCircleIcon,
  ShoppingBagIcon,
  XCircleIcon,
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
import { formatSitePrice } from "@/lib/currency";
import {
  courseRequestStatusHint,
  courseRequestStatusLabel,
} from "@/lib/my-courses";
import { cn } from "@/lib/utils";

export type MyCourseItem = {
  id: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    slug: string;
    title: string;
    type: string;
    price: string;
    description: string | null;
    imageUrl: string | null;
    coverImageUrl: string | null;
  };
};

function statusBadgeClass(status: string) {
  if (status === "approved") {
    return "border-transparent bg-success/15 text-success hover:bg-success/15";
  }
  if (status === "rejected") {
    return "border-transparent bg-destructive/10 text-destructive hover:bg-destructive/10";
  }
  return "border-transparent bg-amber-500/15 text-amber-700 hover:bg-amber-500/15";
}

function StatusIcon({ status }: { status: string }) {
  if (status === "approved") {
    return <PlayCircleIcon className="size-4" />;
  }
  if (status === "rejected") {
    return <XCircleIcon className="size-4" />;
  }
  return <Clock3Icon className="size-4" />;
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("ar-IQ", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function MyCoursesView({
  customerName,
  courses,
}: {
  customerName: string;
  courses: MyCourseItem[];
}) {
  return (
    <main className="bg-page pb-16 text-ink">
      <section className="border-b border-line bg-[linear-gradient(180deg,#f3f7f6_0%,#ffffff_78%)]">
        <div className="container-site py-10 md:py-14">
          <Badge className="rounded-full bg-brand/10 text-brand hover:bg-brand/10">
            حسابي
          </Badge>
          <h1 className="mt-3 font-arabic-bold text-3xl md:text-4xl">دوراتي</h1>
          <p className="mt-2 max-w-2xl text-ink-secondary">
            مرحباً {customerName} — هنا طلبات شراء الدورات وحالة كل طلب.
          </p>
        </div>
      </section>

      <section className="container-site py-10 md:py-14">
        {courses.length === 0 ? (
          <Card className="mx-auto max-w-lg border-line bg-white/70 text-center shadow-sm backdrop-blur-xl">
            <CardHeader className="items-center gap-3 pt-10">
              <div className="flex size-14 items-center justify-center rounded-full bg-brand/10 text-brand">
                <BookOpenIcon className="size-7" />
              </div>
              <CardTitle className="font-arabic-bold text-2xl text-ink">
                لا توجد دورات بعد
              </CardTitle>
              <CardDescription className="max-w-sm text-base leading-relaxed text-ink-secondary">
                لم تقدّم أي طلب شراء لدورة. تصفّح المنتجات وابدأ بطلب دورة تناسبك.
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center pb-10">
              <Button
                asChild
                className="rounded-full gap-2 bg-brand text-inverted hover:bg-brand-hover"
              >
                <Link href="/products">
                  <ShoppingBagIcon className="size-4" />
                  تصفح المنتجات
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {courses.map((item) => {
              const image =
                item.product.coverImageUrl || item.product.imageUrl;
              const approved = item.status === "approved";
              const rejected = item.status === "rejected";
              const learnHref = `/products/${item.product.slug}/learn`;
              const productHref = `/products/${item.product.slug}`;
              const purchaseHref = `/products/${item.product.slug}/purchase`;

              const cardInner = (
                <>
                  <div className="relative aspect-[16/10] bg-surface">
                    {image ? (
                      <Image
                        src={image}
                        alt={item.product.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        sizes="(max-width:640px) 100vw, (max-width:1280px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-ink-muted">
                        لا توجد صورة
                      </div>
                    )}
                    <Badge
                      className={cn(
                        "absolute start-3 top-3 gap-1 rounded-full",
                        statusBadgeClass(item.status),
                      )}
                    >
                      <StatusIcon status={item.status} />
                      {courseRequestStatusLabel(item.status)}
                    </Badge>
                  </div>

                  <CardHeader className="gap-2">
                    <p className="text-xs text-ink-muted">
                      {item.product.type || "دورة رقمية"}
                    </p>
                    <CardTitle className="font-arabic-bold text-lg leading-snug text-ink md:text-xl">
                      {item.product.title}
                    </CardTitle>
                    <CardDescription className="text-ink-secondary">
                      {courseRequestStatusHint(item.status)}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-ink-muted">السعر</span>
                      <span className="font-medium text-ink-price">
                        {formatSitePrice(item.product.price)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-ink-muted">تاريخ الطلب</span>
                      <span className="text-ink-secondary">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    {item.adminNote && rejected ? (
                      <p className="rounded-lg bg-destructive/5 px-3 py-2 text-xs text-destructive">
                        ملاحظة: {item.adminNote}
                      </p>
                    ) : null}
                  </CardContent>

                  <CardFooter className="gap-2 border-t border-line bg-surface/40 py-4">
                    {approved ? (
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-brand">
                        ابدأ المشاهدة
                        <ArrowUpLeftIcon className="size-4" />
                      </span>
                    ) : rejected ? (
                      <Button
                        asChild
                        size="sm"
                        className="rounded-full bg-brand text-inverted hover:bg-brand-hover"
                      >
                        <Link href={purchaseHref}>إعادة تقديم الطلب</Link>
                      </Button>
                    ) : (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                      >
                        <Link href={productHref}>عرض صفحة الدورة</Link>
                      </Button>
                    )}
                  </CardFooter>
                </>
              );

              if (approved) {
                return (
                  <Link
                    key={item.id}
                    href={learnHref}
                    className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  >
                    <Card className="h-full gap-0 border-line bg-white/80 py-0 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md">
                      {cardInner}
                    </Card>
                  </Link>
                );
              }

              return (
                <Card
                  key={item.id}
                  className="h-full gap-0 border-line bg-white/80 py-0 shadow-sm backdrop-blur-sm"
                >
                  {cardInner}
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
