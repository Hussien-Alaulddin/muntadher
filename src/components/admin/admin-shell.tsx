"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  AwardIcon,
  BarChart3Icon,
  BookOpenIcon,
  BriefcaseBusinessIcon,
  Building2Icon,
  CircleHelpIcon,
  ClipboardListIcon,
  ExternalLinkIcon,
  FileSpreadsheetIcon,
  GlobeIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  Link2Icon,
  ListTodoIcon,
  LogOutIcon,
  MessageSquareQuoteIcon,
  MessagesSquareIcon,
  ShoppingBagIcon,
  RouteIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import { adminNav } from "@/lib/admin-ui-meta";
import { adminFetch, prefetchAdmin, prefetchAdminNav } from "@/lib/admin-api";
import { AdminPageTransition } from "@/components/admin/admin-page-transition";
import {
  AdminNavCountBadge,
  useAdminFormNotifications,
} from "@/components/admin/admin-notifications";
import { NavigationProgress } from "@/components/navigation-progress";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const NAV_ICONS: Record<string, typeof LayoutDashboardIcon> = {
  "/admin": LayoutDashboardIcon,
  "/admin/settings": SettingsIcon,
  "/admin/customers": UsersIcon,
  "/admin/course-purchases": ShoppingBagIcon,
  "/admin/form-questions": ClipboardListIcon,
  "/admin/form-responses": MessagesSquareIcon,
  "/admin/projects": BriefcaseBusinessIcon,
  "/admin/courses": GraduationCapIcon,
  "/admin/booklets": BookOpenIcon,
  "/admin/stats": BarChart3Icon,
  "/admin/awards": AwardIcon,
  "/admin/digital-impact": GlobeIcon,
  "/admin/tasks": ListTodoIcon,
  "/admin/career-highlights": RouteIcon,
  "/admin/client-logos": Building2Icon,
  "/admin/testimonials": MessageSquareQuoteIcon,
  "/admin/faqs": CircleHelpIcon,
  "/admin/socials": Link2Icon,
  "/admin/reports": FileSpreadsheetIcon,
};

function navIcon(href: string) {
  return NAV_ICONS[href] ?? LayoutDashboardIcon;
}

function prefetchNavTarget(href: string) {
  if (href === "/admin") {
    prefetchAdmin("/api/admin/overview?part=kpis");
    return;
  }
  if (href === "/admin/reports") {
    prefetchAdmin("/api/admin/reports");
    return;
  }
  if (href === "/admin/settings") {
    prefetchAdmin("/api/admin/settings");
    return;
  }
  if (href === "/admin/customers") {
    prefetchAdmin("/api/admin/customers");
    return;
  }
  if (href === "/admin/course-purchases") {
    prefetchAdmin("/api/admin/course-purchases");
    return;
  }
  if (href === "/admin/form-questions") {
    prefetchAdmin("/api/admin/form-questions");
    return;
  }
  if (href === "/admin/form-responses") {
    prefetchAdmin("/api/admin/form-responses");
    return;
  }
  const collection = href.replace(/^\/admin\//, "");
  if (collection) prefetchAdmin(`/api/admin/${collection}`);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const { formCount: newFormCount, customerCount: newCustomerCount } =
    useAdminFormNotifications(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/auth", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (cancelled || res.ok) return;
        const login = new URL("/admin/login", window.location.origin);
        if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
          login.searchParams.set("next", pathname);
        }
        window.location.replace(login.toString());
      } catch {
        if (!cancelled) window.location.replace("/admin/login");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    const timer = window.setTimeout(() => prefetchAdminNav(), 50);
    return () => window.clearTimeout(timer);
  }, []);

  async function logout() {
    setLoggingOut(true);
    try {
      await adminFetch("/api/admin/auth", { method: "DELETE" });
      router.replace("/admin/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <SidebarProvider>
      <NavigationProgress barClassName="bg-primary" />
      <Toaster
        theme="light"
        richColors
        position="bottom-right"
        closeButton
        dir="rtl"
        offset={16}
        gap={12}
        toastOptions={{
          classNames: {
            toast: "cn-toast",
          },
        }}
      />
      <Sidebar side="right" variant="inset" collapsible="icon">
        <SidebarHeader className="gap-3 px-3 py-4">
          <div className="flex items-center gap-2.5 px-1 group-data-[collapsible=icon]:justify-center">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              م
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-semibold tracking-tight">
                منتظر
              </p>
              <p className="truncate text-xs text-muted-foreground">
                لوحة التحكم
              </p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>المحتوى</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNav.map((item) => {
                  const Icon = navIcon(item.href);
                  const active =
                    "exact" in item && item.exact
                      ? pathname === item.href
                      : pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.label}
                        className="[&_svg]:text-foreground"
                      >
                        <Link
                          href={item.href}
                          prefetch
                          onMouseEnter={() => prefetchNavTarget(item.href)}
                          onFocus={() => prefetchNavTarget(item.href)}
                        >
                          <Icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                      {item.href === "/admin/form-responses" ? (
                        <AdminNavCountBadge count={newFormCount} />
                      ) : null}
                      {item.href === "/admin/customers" ? (
                        <AdminNavCountBadge count={newCustomerCount} />
                      ) : null}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="gap-1">
          <Separator className="mb-1" />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="عرض الموقع"
              >
                <Link href="/" target="_blank">
                  <ExternalLinkIcon />
                  <span>عرض الموقع</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="تسجيل الخروج"
                disabled={loggingOut}
                onClick={logout}
              >
                <LogOutIcon />
                <span>{loggingOut ? "جاري الخروج…" : "تسجيل الخروج"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur supports-backdrop-filter:bg-background/70">
          <SidebarTrigger className="-ms-1" />
          <Separator orientation="vertical" className="h-4" />
          <p className="text-sm text-muted-foreground">إدارة محتوى الموقع</p>
        </header>
        <div className="flex-1 p-4 md:p-6 lg:p-8">
          <AdminPageTransition>{children}</AdminPageTransition>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
