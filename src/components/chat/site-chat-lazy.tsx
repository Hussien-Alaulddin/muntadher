"use client";

import dynamic from "next/dynamic";

const SiteChat = dynamic(
  () => import("@/components/chat/site-chat").then((m) => m.SiteChat),
  { ssr: false },
);

export function SiteChatLazy() {
  return <SiteChat />;
}
