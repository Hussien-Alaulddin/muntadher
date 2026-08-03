"use client";

import Link from "@/components/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { navbar } from "@/lib/fixed-content";
import { projectRequestHref } from "@/lib/project-form";
import { cx, primaryButtonClass } from "@/components/ui";
import { AuthNavButton, CartButton } from "@/components/shop/cart-sheet";
import { useShop } from "@/components/shop/shop-provider";

type NavbarProps = {
  designerName: string;
  avatarUrl: string | null;
  navbarLogoUrl?: string | null;
};

export function Navbar({
  designerName,
  avatarUrl,
  navbarLogoUrl,
}: NavbarProps) {
  const [open, setOpen] = useState(false);
  const ctaHref = projectRequestHref();
  const { customer } = useShop();
  const logoSrc = navbarLogoUrl?.trim() || null;

  const links = useMemo(() => {
    const items: { label: string; href: string }[] = navbar.links.map(
      (link) => ({ label: link.label, href: link.href }),
    );
    if (!customer) return items;
    const productsIndex = items.findIndex((link) => link.href === "/products");
    const myCourses = { label: "دوراتي", href: "/my-courses" };
    if (productsIndex === -1) {
      items.push(myCourses);
      return items;
    }
    items.splice(productsIndex + 1, 0, myCourses);
    return items;
  }, [customer]);

  return (
    <header className="sticky top-0 z-50 bg-page">
      <nav className="container-site flex h-[60px] items-center justify-between gap-4 md:h-[68px]">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-[7px]"
          aria-label={designerName}
        >
          <span className="relative size-8 overflow-hidden rounded-full bg-surface-alt">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={designerName}
                fill
                sizes="32px"
                className="object-cover"
              />
            ) : null}
          </span>
          {logoSrc ? (
            <Image
              src={logoSrc}
              alt={designerName}
              width={160}
              height={40}
              className="h-5 w-auto max-w-[120px] object-contain object-right md:h-6 md:max-w-[140px]"
              priority
            />
          ) : (
            <span className="text-body font-medium">{designerName}</span>
          )}
        </Link>

        <ul className="hidden items-center gap-[26px] md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-body font-medium text-ink transition-opacity duration-200 hover:opacity-60"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <AuthNavButton />
          <CartButton />
          <Link
            href={ctaHref}
            className={cx(primaryButtonClass, "hidden lg:inline-flex")}
          >
            {navbar.cta.label}
          </Link>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label="القائمة"
            className="flex size-9 items-center justify-center rounded-[9px] bg-surface transition-colors duration-200 hover:bg-surface-alt md:hidden"
          >
            <span className="flex flex-col gap-[5px]">
              <span className="block h-[1.5px] w-4 bg-ink" />
              <span className="block h-[1.5px] w-4 bg-ink" />
              <span className="block h-[1.5px] w-4 bg-ink" />
            </span>
          </button>
        </div>
      </nav>

      {open ? (
        <div className="bg-page md:hidden">
          <ul className="container-site flex flex-col pb-3">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block py-2.5 text-body font-medium text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              {customer ? (
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="block py-2.5 text-body font-medium text-ink"
                >
                  الملف الشخصي · {customer.name}
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block py-2.5 text-body font-medium text-ink"
                >
                  تسجيل/دخول
                </Link>
              )}
            </li>
            <li className="pt-2">
              <Link
                href={ctaHref}
                onClick={() => setOpen(false)}
                className={cx(primaryButtonClass, "w-full")}
              >
                {navbar.cta.label}
              </Link>
            </li>
          </ul>
        </div>
      ) : null}
    </header>
  );
}
