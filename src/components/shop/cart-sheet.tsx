"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBagIcon, Trash2Icon, XIcon } from "lucide-react";
import { useShop } from "@/components/shop/shop-provider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function CartButton() {
  const { items, removeFromCart, claimFree, customer } = useShop();
  const count = items.length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="سلة المشتريات"
          className="relative flex size-9 items-center justify-center rounded-[9px] bg-surface text-ink transition-colors hover:bg-surface-alt"
        >
          <ShoppingBagIcon className="size-4" />
          {count > 0 ? (
            <span className="absolute -top-1 -start-1 flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-inverted">
              {count}
            </span>
          ) : null}
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>سلة المشتريات</SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex flex-1 flex-col gap-3 overflow-y-auto">
          {!customer ? (
            <div className="rounded-card bg-surface p-4 text-sm text-ink-secondary">
              <p>سجّل الدخول لإضافة الكتيبات إلى سلتك وتحميلها.</p>
              <Button asChild className="mt-3 w-full bg-brand hover:bg-brand-hover">
                <Link href="/login?next=/products">تسجيل الدخول</Link>
              </Button>
            </div>
          ) : null}

          {customer && items.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-secondary">
              السلة فارغة حالياً
            </p>
          ) : null}

          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-3 rounded-card border border-line p-3"
            >
              <div className="relative size-16 shrink-0 overflow-hidden rounded-media bg-surface-alt">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/products/${item.slug}`}
                  className="line-clamp-2 text-sm font-medium text-ink hover:opacity-70"
                >
                  {item.title}
                </Link>
                <p className="mt-1 text-sm text-success">{item.price}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="bg-brand hover:bg-brand-hover"
                    onClick={() => void claimFree(item.id)}
                  >
                    احصل عليه مجانًا
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void removeFromCart(item.id)}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function AuthNavButton() {
  const { customer, logout } = useShop();

  if (customer) {
    return (
      <div className="hidden items-center gap-2 md:flex">
        <Button asChild variant="ghost" size="sm" className="gap-2 px-2">
          <Link href="/profile" className="max-w-[160px] text-ink-secondary">
            {customer.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={customer.avatarUrl}
                alt=""
                className="size-6 shrink-0 rounded-full object-cover"
              />
            ) : null}
            <span className="truncate">{customer.name}</span>
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void logout()}
          className="text-ink-secondary"
        >
          خروج
        </Button>
      </div>
    );
  }

  return (
    <Button asChild size="sm" variant="secondary" className="hidden md:inline-flex">
      <Link href="/login">تسجيل/دخول</Link>
    </Button>
  );
}

/** أيقونة إغلاق اختيارية للواجهة */
export function CartCloseIcon() {
  return <XIcon className="size-4" />;
}
