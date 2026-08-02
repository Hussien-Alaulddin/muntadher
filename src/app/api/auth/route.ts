import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import {
  createSessionToken,
  hashPassword,
  sessionCookieOptions,
  verifyPassword,
  customerIdFromRequest,
} from "@/lib/customer-auth";
import { resolveCustomerAvatar } from "@/lib/customer-avatar";
import {
  CUSTOMER_COOKIE,
  CUSTOMER_SESSION_DAYS,
} from "@/lib/customer-constants";
import { resolveClientGeo } from "@/lib/client-geo";
import { clientIp, rateLimit } from "@/lib/rate-limit";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function GET(request: Request) {
  const customerId = customerIdFromRequest(request);
  if (!customerId) {
    return NextResponse.json({ customer: null });
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
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      googleAvatarUrl: true,
    },
  });

  if (!customer) {
    return NextResponse.json({ customer: null });
  }

  return NextResponse.json({
    customer: {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      avatarUrl: resolveCustomerAvatar(customer),
    },
  });
}

export async function POST(request: Request) {
  const limited = rateLimit(`auth:${clientIp(request)}`, 20, 15 * 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { message: "محاولات كثيرة — حاول لاحقاً" },
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

  let body: {
    action?: string;
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "طلب غير صالح" }, { status: 400 });
  }

  const action = body.action === "register" ? "register" : "login";
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { message: "أدخل بريداً إلكترونياً صالحاً" },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" },
      { status: 400 },
    );
  }

  try {
    if (action === "register") {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) {
        return NextResponse.json(
          { message: "الاسم مطلوب" },
          { status: 400 },
        );
      }

      const existing = await prisma.customer.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json(
          { message: "هذا البريد مسجّل مسبقاً — سجّل الدخول" },
          { status: 409 },
        );
      }

      const phone =
        typeof body.phone === "string" && body.phone.trim()
          ? body.phone.trim()
          : null;

      const geo = await resolveClientGeo(request);

      const customer = await prisma.customer.create({
        data: {
          email,
          name,
          phone,
          passwordHash: await hashPassword(password),
          countryCode: geo.countryCode,
          country: geo.country,
          region: geo.region,
          city: geo.city,
        },
        select: { id: true, email: true, name: true },
      });

      const token = createSessionToken(customer.id);
      if (!token) {
        return NextResponse.json(
          { message: "تعذّر إنشاء الجلسة — اضبط CUSTOMER_AUTH_SECRET" },
          { status: 503 },
        );
      }

      const response = NextResponse.json({ customer });
      response.cookies.set(
        CUSTOMER_COOKIE,
        token,
        sessionCookieOptions(CUSTOMER_SESSION_DAYS * 24 * 60 * 60),
      );
      return response;
    }

    const customer = await prisma.customer.findUnique({ where: { email } });
    if (
      !customer ||
      !customer.passwordHash ||
      !(await verifyPassword(password, customer.passwordHash))
    ) {
      return NextResponse.json(
        { message: "البريد أو كلمة المرور غير صحيحة" },
        { status: 401 },
      );
    }

    const token = createSessionToken(customer.id);
    if (!token) {
      return NextResponse.json(
        { message: "تعذّر إنشاء الجلسة — اضبط CUSTOMER_AUTH_SECRET" },
        { status: 503 },
      );
    }

    const response = NextResponse.json({
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
      },
    });
    response.cookies.set(
      CUSTOMER_COOKIE,
      token,
      sessionCookieOptions(CUSTOMER_SESSION_DAYS * 24 * 60 * 60),
    );
    return response;
  } catch (error) {
    console.error("[auth]", error);
    return NextResponse.json(
      { message: "تعذّر إتمام العملية حالياً" },
      { status: 503 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(CUSTOMER_COOKIE, "", sessionCookieOptions(0));
  return response;
}
