"use client";

import Link from "next/link";

/**
 * رابط الموقع — next/link العادي.
 * أُزيلت View Transitions لأنها تنتهي بـ TimeoutError عند بطء جلب المحتوى من Supabase.
 */
export default Link;
export { Link };
