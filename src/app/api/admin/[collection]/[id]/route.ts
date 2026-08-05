import { NextResponse } from "next/server";
import { checkAdmin, requireDatabase } from "@/lib/admin-auth";
import { adminRouteError } from "@/lib/admin-route-error";
import { clampOrder } from "@/lib/admin-order";
import { withDbRetry } from "@/lib/prisma";
import {
  collectionListWhere,
  getDelegate,
  isCollection,
  pickFields,
} from "@/lib/admin-collections";
import {
  deleteManagedMediaUrls,
  deleteRemovedManagedMedia,
  collectManagedMediaUrls,
} from "@/lib/delete-record-media";
import { revalidateSite } from "@/lib/revalidate-site";

type Params = { params: Promise<{ collection: string; id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const unauthorized = await checkAdmin(request);
  if (unauthorized) return unauthorized;

  const { collection, id } = await params;
  if (!isCollection(collection)) {
    return NextResponse.json({ message: "مجموعة غير معروفة" }, { status: 404 });
  }

  const { error } = requireDatabase();
  if (error) return error;

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const listWhere = collectionListWhere(collection);
    const where = { id, ...listWhere };
    const existing = await withDbRetry((prisma) =>
      getDelegate(prisma, collection).findFirst({ where }),
    );
    if (!existing) {
      return NextResponse.json({ message: "العنصر غير موجود" }, { status: 404 });
    }

    const data = pickFields(collection, payload) as Record<string, unknown>;
    const item = await withDbRetry(async (prisma) => {
      const delegate = getDelegate(prisma, collection);
      if ("order" in data) {
        const count = await delegate.count({ where: listWhere });
        data.order = clampOrder(data.order, Math.max(1, count));
      }
      return delegate.update({
        where: { id },
        data,
      });
    });

    // احذف ملفات الميديا التي أُزيلت أو استُبدلت في التحديث
    await deleteRemovedManagedMedia(existing, item);

    revalidateSite();
    return NextResponse.json({ item });
  } catch (err) {
    return adminRouteError(err);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const unauthorized = await checkAdmin(request);
  if (unauthorized) return unauthorized;

  const { collection, id } = await params;
  if (!isCollection(collection)) {
    return NextResponse.json({ message: "مجموعة غير معروفة" }, { status: 404 });
  }

  const { error } = requireDatabase();
  if (error) return error;

  try {
    const where = { id, ...collectionListWhere(collection) };
    const existing = await withDbRetry((prisma) =>
      getDelegate(prisma, collection).findFirst({ where }),
    );
    if (!existing) {
      return NextResponse.json({ message: "العنصر غير موجود" }, { status: 404 });
    }

    await withDbRetry((prisma) =>
      getDelegate(prisma, collection).delete({ where: { id } }),
    );

    await deleteManagedMediaUrls(collectManagedMediaUrls(existing));

    revalidateSite();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return adminRouteError(err);
  }
}
