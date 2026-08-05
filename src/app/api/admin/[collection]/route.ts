import { NextResponse } from "next/server";
import { checkAdmin, requireDatabase } from "@/lib/admin-auth";
import { adminRouteError } from "@/lib/admin-route-error";
import { clampOrder } from "@/lib/admin-order";
import { withDbRetry } from "@/lib/prisma";
import {
  collectionListWhere,
  getDelegate,
  isCollection,
  missingRequired,
  pickFields,
} from "@/lib/admin-collections";
import { revalidateSite } from "@/lib/revalidate-site";

type Params = { params: Promise<{ collection: string }> };

export async function GET(request: Request, { params }: Params) {
  const unauthorized = await checkAdmin(request);
  if (unauthorized) return unauthorized;

  const { collection } = await params;
  if (!isCollection(collection)) {
    return NextResponse.json({ message: "مجموعة غير معروفة" }, { status: 404 });
  }

  const { error } = requireDatabase();
  if (error) return error;

  try {
    const where = collectionListWhere(collection);
    const items = await withDbRetry((prisma) =>
      getDelegate(prisma, collection).findMany({
        where,
        orderBy: { order: "asc" },
      }),
    );
    return NextResponse.json({ items });
  } catch (err) {
    return adminRouteError(err);
  }
}

export async function POST(request: Request, { params }: Params) {
  const unauthorized = await checkAdmin(request);
  if (unauthorized) return unauthorized;

  const { collection } = await params;
  if (!isCollection(collection)) {
    return NextResponse.json({ message: "مجموعة غير معروفة" }, { status: 404 });
  }

  const { error } = requireDatabase();
  if (error) return error;

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const data = pickFields(collection, payload) as Record<string, unknown>;
    const missing = missingRequired(collection, data);

    if (missing.length > 0) {
      return NextResponse.json(
        { message: `حقول مطلوبة ناقصة: ${missing.join(", ")}` },
        { status: 422 },
      );
    }

    const where = collectionListWhere(collection);
    const item = await withDbRetry(async (prisma) => {
      const delegate = getDelegate(prisma, collection);
      if ("order" in data) {
        const count = await delegate.count({ where });
        data.order = clampOrder(data.order, count + 1);
      }
      return delegate.create({ data });
    });
    revalidateSite();

    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    return adminRouteError(err);
  }
}
