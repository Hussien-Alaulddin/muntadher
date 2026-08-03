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
import {
  adminPath,
  adminPathSuffix,
  isAdminPublicPathname,
} from "@/lib/admin-base-path";
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
  "": LayoutDashboardIcon,
  "/settings": SettingsIcon,
  "/customers": UsersIcon,
  "/course-purchases": ShoppingBagIcon,
  "/form-questions": ClipboardListIcon,
  "/form-responses": MessagesSquareIcon,
  "/projects": BriefcaseBusinessIcon,
  "/courses": GraduationCapIcon,
  "/booklets": BookOpenIcon,
  "/stats": BarChart3Icon,
  "/awards": AwardIcon,
  "/digital-impact": GlobeIcon,
  "/tasks": ListTodoIcon,
  "/career-highlights": RouteIcon,
  "/client-logos": Building2Icon,
  "/testimonials": MessageSquareQuoteIcon,
  "/faqs": CircleHelpIcon,
  "/socials": Link2Icon,
  "/reports": FileSpreadsheetIcon,
};

function navIcon(href: string) {
  return NAV_ICONS[adminPathSuffix(href)] ?? LayoutDashboardIcon;
}

function prefetchNavTarget(href: string) {
  const suffix = adminPathSuffix(href);
  if (suffix === "") {
    prefetchAdmin("/api/admin/overview?part=kpis");
    return;
  }
  if (suffix === "/reports") {
    prefetchAdmin("/api/admin/reports");
    return;
  }
  if (suffix === "/settings") {
    prefetchAdmin("/api/admin/settings");
    return;
  }
  if (suffix === "/customers") {
    prefetchAdmin("/api/admin/customers");
    return;
  }
  if (suffix === "/course-purchases") {
    prefetchAdmin("/api/admin/course-purchases");
    return;
  }
  if (suffix === "/form-questions") {
    prefetchAdmin("/api/admin/form-questions");
    return;
  }
  if (suffix === "/form-responses") {
    prefetchAdmin("/api/admin/form-responses");
    return;
  }
  const collection = suffix.replace(/^\//, "");
  if (collection) prefetchAdmin(`/api/admin/${collection}`);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const { formCount: newFormCount, customerCount: newCustomerCount } =
    useAdminFormNotifications(true);
  const loginPath = adminPath("/login");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/auth", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (cancelled || res.ok) return;
        const login = new URL(loginPath, window.location.origin);
        if (isAdminPublicPathname(pathname) && pathname !== loginPath) {
          login.searchParams.set("next", pathname);
        }
        window.location.replace(login.toString());
      } catch {
        if (!cancelled) window.location.replace(loginPath);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, loginPath]);

  useEffect(() => {
    const timer = window.setTimeout(() => prefetchAdminNav(), 50);
    return () => window.clearTimeout(timer);
  }, []);

  async function logout() {
    setLoggingOut(true);
    try {
      await adminFetch("/api/admin/auth", { method: "DELETE" });
      router.replace(loginPath);
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
                      {item.href === adminPath("/form-responses") ? (
                        <AdminNavCountBadge count={newFormCount} />
                      ) : null}
                      {item.href === adminPath("/customers") ? (
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
