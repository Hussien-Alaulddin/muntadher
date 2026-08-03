import type { MetadataRoute } from "next";
import { DEFAULT_ADMIN_BASE_PATH } from "@/lib/admin-base-path";

export default function robots(): MetadataRoute.Robots {
  const admin =
    process.env.NEXT_PUBLIC_ADMIN_BASE_PATH?.trim() || DEFAULT_ADMIN_BASE_PATH;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [admin, `${admin}/`, "/api/"],
      },
    ],
    host: process.env.NEXT_PUBLIC_SITE_URL?.trim() || undefined,
  };
}
