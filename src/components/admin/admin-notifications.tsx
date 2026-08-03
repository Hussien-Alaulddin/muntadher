"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { showFormResponseToast } from "@/components/admin/form-response-toast";
import { SidebarMenuBadge } from "@/components/ui/sidebar";
import { adminPath } from "@/lib/admin-base-path";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  name: string | null;
  helpType: string | null;
  createdAt: string;
};

type NotificationsPayload = {
  formResponses: {
    count: number;
    ids?: string[];
    items: NotificationItem[];
  };
  customers?: {
    count: number;
    ids: string[];
  };
};

const TOAST_SESSION_KEY = "admin:form-response-toast-ids";
const FORM_BADGE_SEEN_KEY = "admin:form-response-badge-seen-ids";
const FORM_BASELINE_KEY = "admin:form-response-badge-baselined";
const CUSTOMER_BADGE_SEEN_KEY = "admin:customer-badge-seen-ids";
const CUSTOMER_BASELINE_KEY = "admin:customer-badge-baselined";

function readIdList(key: string): string[] {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

function writeIdList(key: string, ids: string[]) {
  try {
    sessionStorage.setItem(key, JSON.stringify(Array.from(new Set(ids))));
  } catch {
    /* ignore */
  }
}

function markIds(key: string, ids: string[]) {
  writeIdList(key, [...readIdList(key), ...ids]);
}

function unreadIds(ids: string[], seenKey: string) {
  const seen = new Set(readIdList(seenKey));
  return ids.filter((id) => !seen.has(id));
}

function unreadCount(ids: string[], seenKey: string) {
  return unreadIds(ids, seenKey).length;
}

/** أول زيارة: اعتبر الموجود حالياً مقروءاً — الرقم يظهر فقط للجديد بعد ذلك */
function ensureBaseline(ids: string[], seenKey: string, baselineKey: string) {
  try {
    if (sessionStorage.getItem(baselineKey) === "1") return;
    writeIdList(seenKey, ids);
    sessionStorage.setItem(baselineKey, "1");
  } catch {
    /* ignore */
  }
}

async function fetchNotifications(): Promise<NotificationsPayload | null> {
  const res = await fetch("/api/admin/notifications", {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as NotificationsPayload;
}

export function useAdminFormNotifications(enabled = true) {
  const pathname = usePathname();
  const router = useRouter();
  const [formBadgeCount, setFormBadgeCount] = useState(0);
  const [customerBadgeCount, setCustomerBadgeCount] = useState(0);
  const toastedRef = useRef(false);

  const load = useCallback(
    async (opts?: {
      showToast?: boolean;
      markFormSeen?: boolean;
      markCustomersSeen?: boolean;
    }) => {
      if (!enabled) return;
      try {
        const data = await fetchNotifications();
        if (!data) return;

        const formItems = data.formResponses?.items ?? [];
        const formIds =
          data.formResponses?.ids ?? formItems.map((item) => item.id);
        const customerIds = data.customers?.ids ?? [];

        ensureBaseline(formIds, FORM_BADGE_SEEN_KEY, FORM_BASELINE_KEY);
        ensureBaseline(
          customerIds,
          CUSTOMER_BADGE_SEEN_KEY,
          CUSTOMER_BASELINE_KEY,
        );

        let nextFormUnread = unreadCount(formIds, FORM_BADGE_SEEN_KEY);

        if (opts?.markFormSeen) {
          markIds(FORM_BADGE_SEEN_KEY, formIds);
          nextFormUnread = 0;
          setFormBadgeCount(0);
        } else {
          setFormBadgeCount(nextFormUnread);
        }

        if (opts?.markCustomersSeen) {
          markIds(CUSTOMER_BADGE_SEEN_KEY, customerIds);
          setCustomerBadgeCount(0);
        } else {
          setCustomerBadgeCount(
            unreadCount(customerIds, CUSTOMER_BADGE_SEEN_KEY),
          );
        }

        if (!opts?.showToast || nextFormUnread === 0 || toastedRef.current) {
          return;
        }

        const unseenFormIds = unreadIds(formIds, FORM_BADGE_SEEN_KEY);
        const toastFreshIds = unseenFormIds.filter(
          (id) => !readIdList(TOAST_SESSION_KEY).includes(id),
        );
        if (toastFreshIds.length === 0) return;

        toastedRef.current = true;
        markIds(TOAST_SESSION_KEY, toastFreshIds);

        const latest =
          formItems.find((item) => unseenFormIds.includes(item.id)) ??
          formItems[0];

        const title =
          nextFormUnread === 1
            ? "طلب مشروع لم يُطَّلع عليه"
            : `${nextFormUnread} طلبات لم يُطَّلع عليها`;

        const description = latest
          ? [latest.name?.trim() || "بدون اسم", latest.helpType?.trim() || null]
              .filter(Boolean)
              .join(" · ")
          : "افتح ردود الاستمارة للاطلاع عليها";

        showFormResponseToast({
          count: nextFormUnread,
          title,
          description,
          onView: () => {
            router.push(adminPath("/form-responses"));
          },
        });
      } catch (err) {
        console.error("[admin notifications]", err);
      }
    },
    [enabled, router],
  );

  useEffect(() => {
    if (!enabled) return;
    void load({ showToast: true });
  }, [enabled, load]);

  useEffect(() => {
    if (!enabled) return;
    if (pathname.startsWith(adminPath("/form-responses"))) {
      void load({ showToast: false, markFormSeen: true });
    }
    if (pathname.startsWith(adminPath("/customers"))) {
      void load({ showToast: false, markCustomersSeen: true });
    }
  }, [enabled, pathname, load]);

  useEffect(() => {
    if (!enabled) return;
    function onRefresh() {
      void load({
        showToast: false,
        markFormSeen: pathname.startsWith(adminPath("/form-responses")),
        markCustomersSeen: pathname.startsWith(adminPath("/customers")),
      });
    }
    window.addEventListener("admin:form-notifications-refresh", onRefresh);
    window.addEventListener("admin:customer-notifications-refresh", onRefresh);
    return () => {
      window.removeEventListener("admin:form-notifications-refresh", onRefresh);
      window.removeEventListener(
        "admin:customer-notifications-refresh",
        onRefresh,
      );
    };
  }, [enabled, load, pathname]);

  return {
    count: formBadgeCount,
    formCount: formBadgeCount,
    customerCount: customerBadgeCount,
    refresh: () => load({ showToast: false }),
  };
}

export function AdminNavCountBadge({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  if (count <= 0) return null;
  return (
    <SidebarMenuBadge
      className={cn(
        "bg-success text-[11px] font-semibold text-white shadow-sm peer-hover/menu-button:text-white peer-data-active/menu-button:text-white",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </SidebarMenuBadge>
  );
}

/** @deprecated استخدم AdminNavCountBadge */
export function FormResponsesNavBadge({ count }: { count: number }) {
  return <AdminNavCountBadge count={count} />;
}
