import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { checkAdmin, requireDatabase } from "@/lib/admin-auth";
import { adminRouteError } from "@/lib/admin-route-error";
import { adminPath } from "@/lib/admin-base-path";
import {
  createSignedMediaUrl,
  RECEIPT_SIGNED_URL_SECONDS,
} from "@/lib/media-access";
import { withDbRetry } from "@/lib/prisma";

async function withSignedReceipt(url: string) {
  return (await createSignedMediaUrl(url, RECEIPT_SIGNED_URL_SECONDS)) || url;
}

export async function GET(request: Request) {
  const unauthorized = await checkAdmin(request);
  if (unauthorized) return unauthorized;

  const { error } = requireDatabase();
  if (error) return error;

  try {
    const items = await withDbRetry((prisma) =>
      prisma.coursePurchaseRequest.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          customer: {
            select: { id: true, name: true, email: true, phone: true },
          },
          product: {
            select: { id: true, title: true, slug: true, price: true },
          },
        },
      }),
    );

    const signedItems = await Promise.all(
      items.map(async (item) => ({
        id: item.id,
        status: item.status,
        whatsappPhone: item.whatsappPhone,
        receiptImageUrl: await withSignedReceipt(item.receiptImageUrl),
        adminNote: item.adminNote,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        customer: item.customer,
        product: item.product,
      })),
    );

    return NextResponse.json({ items: signedItems });
  } catch (err) {
    return adminRouteError(err);
  }
}

export async function PATCH(request: Request) {
  const unauthorized = await checkAdmin(request);
  if (unauthorized) return unauthorized;

  const { error } = requireDatabase();
  if (error) return error;

  try {
    const body = (await request.json()) as {
      id?: string;
      status?: string;
      adminNote?: string;
    };

    const id = String(body.id ?? "").trim();
    const status = String(body.status ?? "").trim();
    const adminNote =
      body.adminNote === undefined ? undefined : String(body.adminNote ?? "");

    if (!id) {
      return NextResponse.json({ message: "معرّف الطلب مطلوب" }, { status: 400 });
    }
    if (!["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ message: "حالة غير صالحة" }, { status: 400 });
    }

    const updated = await withDbRetry(async (prisma) => {
      const current = await prisma.coursePurchaseRequest.findUnique({
        where: { id },
      });
      if (!current) return null;

      const next = await prisma.coursePurchaseRequest.update({
        where: { id },
        data: {
          status,
          ...(adminNote !== undefined ? { adminNote: adminNote || null } : {}),
        },
        include: {
          customer: {
            select: { id: true, name: true, email: true, phone: true },
          },
          product: {
            select: { id: true, title: true, slug: true, price: true },
          },
        },
      });

      if (status === "approved") {
        await prisma.customerEntitlement.upsert({
          where: {
            customerId_productId: {
              customerId: current.customerId,
              productId: current.productId,
            },
          },
          create: {
            customerId: current.customerId,
            productId: current.productId,
          },
          update: {},
        });
      } else if (status === "rejected") {
        // احذف الصلاحية فقط إن لم تبقَ موافقة أخرى لنفس المنتج
        const otherApproved = await prisma.coursePurchaseRequest.findFirst({
          where: {
            customerId: current.customerId,
            productId: current.productId,
            status: "approved",
            NOT: { id: current.id },
          },
          select: { id: true },
        });
        if (!otherApproved) {
          await prisma.customerEntitlement.deleteMany({
            where: {
              customerId: current.customerId,
              productId: current.productId,
            },
          });
        }
      }

      return next;
    });

    if (!updated) {
      return NextResponse.json({ message: "الطلب غير موجود" }, { status: 404 });
    }

    revalidatePath(adminPath("/course-purchases"));

    return NextResponse.json({
      item: {
        id: updated.id,
        status: updated.status,
        whatsappPhone: updated.whatsappPhone,
        receiptImageUrl: await withSignedReceipt(updated.receiptImageUrl),
        adminNote: updated.adminNote,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        customer: updated.customer,
        product: updated.product,
      },
    });
  } catch (err) {
    return adminRouteError(err);
  }
}
