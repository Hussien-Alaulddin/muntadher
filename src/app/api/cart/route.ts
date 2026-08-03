import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { customerIdFromRequest } from "@/lib/customer-auth";

async function requireCustomer(request: Request) {
  const customerId = customerIdFromRequest(request);
  if (!customerId) {
    return {
      error: NextResponse.json(
        { message: "يجب تسجيل الدخول أولاً" },
        { status: 401 },
      ),
      customerId: null as string | null,
      prisma: null,
    };
  }
  const prisma = getPrisma();
  if (!prisma) {
    return {
      error: NextResponse.json(
        { message: "الخدمة غير متاحة مؤقتاً، حاول بعد قليل" },
        { status: 503 },
      ),
      customerId: null,
      prisma: null,
    };
  }
  return { error: null, customerId, prisma };
}

export async function GET(request: Request) {
  const { error, customerId, prisma } = await requireCustomer(request);
  if (error || !prisma || !customerId) return error!;

  const items = await prisma.cartItem.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          title: true,
          price: true,
          imageUrl: true,
          type: true,
          group: true,
        },
      },
    },
  });

  return NextResponse.json({
    items: items.map((item) => ({
      id: item.id,
      productId: item.productId,
      product: item.product,
    })),
  });
}

export async function POST(request: Request) {
  const { error, customerId, prisma } = await requireCustomer(request);
  if (error || !prisma || !customerId) return error!;

  let body: { productId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "طلب غير صالح" }, { status: 400 });
  }

  const productId = typeof body.productId === "string" ? body.productId : "";
  if (!productId) {
    return NextResponse.json({ message: "المنتج مطلوب" }, { status: 400 });
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, published: true, group: "resource" },
  });
  if (!product) {
    return NextResponse.json({ message: "المنتج غير متاح" }, { status: 404 });
  }

  await prisma.cartItem.upsert({
    where: {
      customerId_productId: { customerId, productId },
    },
    create: { customerId, productId },
    update: {},
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { error, customerId, prisma } = await requireCustomer(request);
  if (error || !prisma || !customerId) return error!;

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ message: "المنتج مطلوب" }, { status: 400 });
  }

  await prisma.cartItem.deleteMany({
    where: { customerId, productId },
  });

  return NextResponse.json({ ok: true });
}
