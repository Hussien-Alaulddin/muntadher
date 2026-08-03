"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DownloadIcon,
  LockIcon,
  ShoppingBagIcon,
  ZapIcon,
  UsersIcon,
} from "lucide-react";
import type { BookletDetailView } from "@/lib/content";
import { isFreePrice } from "@/lib/product-files";
import { useShop } from "@/components/shop/shop-provider";
import { Button } from "@/components/ui/button";
import { userFacingMessage } from "@/lib/public-messages";

export function PurchaseCard({
  booklet,
  entitled,
}: {
  booklet: BookletDetailView;
  entitled: boolean;
}) {
  const router = useRouter();
  const { addToCart, claimFree } = useShop();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const free = isFreePrice(booklet.price);

  async function handleClaim() {
    setMessage(null);
    setBusy(true);
    try {
      const result = await claimFree(booklet.id);
      if (result.requireAuth) {
        router.push(
          `/login?next=${encodeURIComponent(`/products/${booklet.slug}`)}`,
        );
        return;
      }
      if (!result.ok) {
        setMessage(
          userFacingMessage(result.message, "تعذّر إتمام العملية"),
        );
        return;
      }
      router.refresh();
      setMessage("تم فتح صلاحية التحميل — يمكنك تحميل الملفات أدناه");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddCart() {
    setMessage(null);
    setBusy(true);
    try {
      const result = await addToCart(booklet.id);
      if (result.requireAuth) {
        router.push(
          `/login?next=${encodeURIComponent(`/products/${booklet.slug}`)}`,
        );
        return;
      }
      if (!result.ok) {
        setMessage(
          userFacingMessage(result.message, "تعذّر الإضافة للسلة"),
        );
        return;
      }
      setMessage("أُضيف إلى السلة");
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="rounded-card border border-[#d9d9d9] bg-page p-5 shadow-sm md:sticky md:top-24">
      <p className="text-micro text-ink-muted">{booklet.type}</p>
      <h1 className="mt-2 text-[22px] leading-[1.35] font-bold tracking-[-0.02em] text-ink">
        {booklet.title}
      </h1>
      {booklet.description ? (
        <p className="mt-3 text-body text-ink-secondary">{booklet.description}</p>
      ) : null}

      <p
        className={`mt-5 text-lg font-bold ${free ? "text-success" : "text-ink-price"}`}
      >
        <span dir="ltr" className="inline-block">
          {booklet.price}
        </span>
      </p>

      {entitled ? (
        <p className="mt-4 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          لديك صلاحية تحميل هذا الكتيّب
        </p>
      ) : (
        <div className="mt-4 flex gap-2">
          <Button
            disabled={busy}
            onClick={() => void handleClaim()}
            className="h-11 flex-1 bg-brand text-base hover:bg-brand-hover"
          >
            {free ? "احصل عليه مجانًا" : "اشترِ الآن"}
          </Button>
          <Button
            type="button"
            disabled={busy}
            variant="secondary"
            size="icon"
            className="size-11 shrink-0"
            aria-label="أضف للسلة"
            onClick={() => void handleAddCart()}
          >
            <ShoppingBagIcon className="size-4" />
          </Button>
        </div>
      )}

      {message ? (
        <p className="mt-3 text-sm text-ink-secondary">{message}</p>
      ) : null}

      {booklet.reviewsCount > 0 ? (
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4 text-sm text-ink-secondary">
          <span className="inline-flex text-amber-400">
            {"★★★★★".slice(0, Math.round(booklet.averageRating))}
          </span>
          <span>
            ({booklet.reviewsCount} تقييم) {booklet.downloadsCount} مستفيد
          </span>
        </div>
      ) : null}

      <ul className="mt-4 space-y-3 text-sm text-ink-secondary">
        <li className="flex items-center gap-2">
          <UsersIcon className="size-4 shrink-0 text-ink-muted" />
          عدد التحميلات: {booklet.downloadsCount.toLocaleString("ar-EG")} تحميل
        </li>
        <li className="flex items-center gap-2">
          <DownloadIcon className="size-4 shrink-0 text-ink-muted" />
          ملفات المنتج الرقمي: {booklet.files.length}
        </li>
        <li className="flex items-center gap-2">
          <ZapIcon className="size-4 shrink-0 text-ink-muted" />
          صلاحية الوصول لكل تحديثات المنتج
        </li>
      </ul>
    </aside>
  );
}

export function DigitalFiles({
  booklet,
  entitled,
}: {
  booklet: BookletDetailView;
  entitled: boolean;
}) {
  const router = useRouter();

  if (booklet.files.length === 0) return null;

  function handleDownload(index: number) {
    if (!entitled) {
      router.push(
        `/login?next=${encodeURIComponent(`/products/${booklet.slug}`)}`,
      );
      return;
    }
    window.location.href = `/api/shop/download?productId=${encodeURIComponent(booklet.id)}&file=${index}`;
  }

  return (
    <section id="digital-files" className="py-8">
      <div className="mb-4 flex items-center gap-2">
        <DownloadIcon className="size-5 text-accent-blue" />
        <h2 className="text-h2">ملفات المنتج الرقمي</h2>
      </div>
      <ul className="space-y-2">
        {booklet.files.map((file, index) => (
          <li
            key={`${file.name}-${index}`}
            className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line px-4 py-3"
          >
            <span className="text-sm font-medium text-ink" dir="auto">
              {file.name}
            </span>
            <Button
              type="button"
              variant={entitled ? "default" : "secondary"}
              size="sm"
              className={entitled ? "bg-brand hover:bg-brand-hover" : ""}
              onClick={() => handleDownload(index)}
            >
              {entitled ? (
                <>
                  <DownloadIcon className="size-3.5" />
                  تحميل الملف
                </>
              ) : (
                <>
                  <LockIcon className="size-3.5" />
                  تحميل الملف
                </>
              )}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function StickyCtaBar({
  booklet,
  entitled,
}: {
  booklet: BookletDetailView;
  entitled: boolean;
}) {
  const router = useRouter();
  const { claimFree, addToCart } = useShop();
  const [busy, setBusy] = useState(false);
  const free = isFreePrice(booklet.price);

  if (entitled) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-page/95 backdrop-blur-sm md:hidden">
      <div className="container-site flex items-center gap-3 py-3">
        <span
          className={`shrink-0 text-sm font-bold ${free ? "text-success" : "text-ink"}`}
        >
          {booklet.price}
        </span>
        <Button
          disabled={busy}
          className="h-10 flex-1 bg-brand hover:bg-brand-hover"
          onClick={() => {
            setBusy(true);
            void claimFree(booklet.id).then((result) => {
              setBusy(false);
              if (result.requireAuth) {
                router.push(
                  `/login?next=${encodeURIComponent(`/products/${booklet.slug}`)}`,
                );
                return;
              }
              if (result.ok) router.refresh();
            });
          }}
        >
          {free ? "احصل عليه مجانًا" : "اشترِ الآن"}
        </Button>
        <Button
          type="button"
          disabled={busy}
          variant="secondary"
          size="icon"
          className="size-10"
          onClick={() => {
            void addToCart(booklet.id).then((result) => {
              if (result.requireAuth) {
                router.push(
                  `/login?next=${encodeURIComponent(`/products/${booklet.slug}`)}`,
                );
              }
            });
          }}
        >
          <ShoppingBagIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}
