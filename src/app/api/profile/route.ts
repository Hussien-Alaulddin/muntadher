import { NextResponse } from "next/server";
import { customerIdFromRequest } from "@/lib/customer-auth";
import { resolveCustomerAvatar } from "@/lib/customer-avatar";
import { getCustomerLibraryStats } from "@/lib/customer-library-stats";
import { getPrisma } from "@/lib/prisma";
import {
  buildObjectKey,
  isAllowedMedia,
  maxBytesForMime,
  resolveUploadMime,
} from "@/lib/media-upload";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isAllowedAvatarUrl } from "@/lib/storage-url";
import { uploadMediaObject } from "@/lib/upload-media";

export const runtime = "nodejs";

const profileSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  country: true,
  region: true,
  city: true,
  countryCode: true,
  googleId: true,
  avatarUrl: true,
  googleAvatarUrl: true,
  createdAt: true,
} as const;

function serializeCustomer(
  customer: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    country: string | null;
    region: string | null;
    city: string | null;
    countryCode: string | null;
    googleId: string | null;
    avatarUrl: string | null;
    googleAvatarUrl: string | null;
    createdAt: Date;
  },
  stats: { courses: number; booklets: number },
) {
  return {
    id: customer.id,
    email: customer.email,
    name: customer.name,
    phone: customer.phone,
    country: customer.country,
    region: customer.region,
    city: customer.city,
    countryCode: customer.countryCode,
    hasGoogle: Boolean(customer.googleId),
    avatarUrl: customer.avatarUrl,
    googleAvatarUrl: customer.googleAvatarUrl,
    displayAvatarUrl: resolveCustomerAvatar(customer),
    createdAt: customer.createdAt.toISOString(),
    stats,
  };
}

export async function GET(request: Request) {
  const customerId = customerIdFromRequest(request);
  if (!customerId) {
    return NextResponse.json({ message: "يلزم تسجيل الدخول" }, { status: 401 });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json(
      { message: "قاعدة البيانات غير متاحة" },
      { status: 503 },
    );
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: profileSelect,
  });

  if (!customer) {
    return NextResponse.json({ message: "الحساب غير موجود" }, { status: 404 });
  }

  const stats = await getCustomerLibraryStats(prisma, customerId);
  return NextResponse.json({ customer: serializeCustomer(customer, stats) });
}

export async function PATCH(request: Request) {
  const customerId = customerIdFromRequest(request);
  if (!customerId) {
    return NextResponse.json({ message: "يلزم تسجيل الدخول" }, { status: 401 });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json(
      { message: "قاعدة البيانات غير متاحة" },
      { status: 503 },
    );
  }

  let body: {
    name?: string;
    phone?: string;
    avatarUrl?: string | null;
    clearCustomAvatar?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "طلب غير صالح" }, { status: 400 });
  }

  const data: {
    name?: string;
    phone?: string | null;
    avatarUrl?: string | null;
  } = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name || name.length < 2) {
      return NextResponse.json(
        { message: "الاسم يجب أن يكون حرفين على الأقل" },
        { status: 400 },
      );
    }
    if (name.length > 80) {
      return NextResponse.json(
        { message: "الاسم طويل جداً" },
        { status: 400 },
      );
    }
    data.name = name;
  }

  if (typeof body.phone === "string") {
    const phone = body.phone.trim() || null;
    if (phone && phone.length > 30) {
      return NextResponse.json(
        { message: "رقم الهاتف غير صالح" },
        { status: 400 },
      );
    }
    data.phone = phone;
  }

  if (body.clearCustomAvatar === true) {
    data.avatarUrl = null;
  } else if (typeof body.avatarUrl === "string") {
    const avatarUrl = body.avatarUrl.trim();
    if (!avatarUrl) {
      data.avatarUrl = null;
    } else if (!isAllowedAvatarUrl(avatarUrl, customerId)) {
      return NextResponse.json(
        { message: "رابط الصورة غير مسموح — ارفع صورة من الموقع" },
        { status: 400 },
      );
    } else {
      data.avatarUrl = avatarUrl;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { message: "لا توجد تعديلات للحفظ" },
      { status: 400 },
    );
  }

  try {
    const customer = await prisma.customer.update({
      where: { id: customerId },
      data,
      select: profileSelect,
    });
    const stats = await getCustomerLibraryStats(prisma, customerId);

    return NextResponse.json({
      ok: true,
      customer: serializeCustomer(customer, stats),
    });
  } catch {
    return NextResponse.json(
      { message: "تعذّر حفظ التعديلات" },
      { status: 503 },
    );
  }
}

/** رفع صورة بروفايل مخصصة */
export async function POST(request: Request) {
  const customerId = customerIdFromRequest(request);
  if (!customerId) {
    return NextResponse.json({ message: "يلزم تسجيل الدخول" }, { status: 401 });
  }

  const limited = rateLimit(
    `profile-upload:${customerId}:${clientIp(request)}`,
    10,
    60 * 60_000,
  );
  if (!limited.ok) {
    return NextResponse.json(
      { message: "محاولات رفع كثيرة — حاول لاحقاً" },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json(
      { message: "قاعدة البيانات غير متاحة" },
      { status: 503 },
    );
  }

  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "لم يتم إرسال ملف" }, { status: 400 });
    }

    if (!isAllowedMedia(file.type, "image")) {
      return NextResponse.json(
        { message: "يُسمح بصور فقط (JPG, PNG, WebP, GIF)" },
        { status: 415 },
      );
    }

    const maxBytes = Math.min(maxBytesForMime(file.type), 5 * 1024 * 1024);
    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          message: `حجم الصورة كبير جداً (الحد ${Math.round(maxBytes / (1024 * 1024))}MB)`,
        },
        { status: 413 },
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const contentType = resolveUploadMime(file.type, bytes, "image");
    if (!contentType) {
      return NextResponse.json(
        { message: "نوع ملف الصورة غير صالح" },
        { status: 415 },
      );
    }

    const objectKey = buildObjectKey(
      `profile-avatars/${customerId}`,
      contentType,
      file.name,
    );

    const uploaded = await uploadMediaObject({
      objectKey,
      bytes,
      contentType,
      upsert: true,
    });

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: { avatarUrl: uploaded.url },
      select: profileSelect,
    });
    const stats = await getCustomerLibraryStats(prisma, customerId);

    return NextResponse.json({
      ok: true,
      url: uploaded.url,
      customer: serializeCustomer(customer, stats),
    });
  } catch {
    return NextResponse.json(
      { message: "تعذّر رفع صورة البروفايل" },
      { status: 500 },
    );
  }
}
