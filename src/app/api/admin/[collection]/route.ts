import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { checkAdmin, requireDatabase } from "@/lib/admin-auth";
import { adminRouteError } from "@/lib/admin-route-error";
import { withDbRetry } from "@/lib/prisma";
import {
  collectionListWhere,
  getDelegate,
  isCollection,
  missingRequired,
  pickFields,
} from "@/lib/admin-collections";

type Params = { params: Promise<{ collection: string }> };

function revalidateSite() {
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/products");
  revalidateTag("site-content");
}

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
    const data = pickFields(collection, payload);
    const missing = missingRequired(collection, data);

    if (missing.length > 0) {
      return NextResponse.json(
        { message: `حقول مطلوبة ناقصة: ${missing.join(", ")}` },
        { status: 422 },
      );
    }

    const item = await withDbRetry((prisma) =>
      getDelegate(prisma, collection).create({ data }),
    );
    revalidateSite();

    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    return adminRouteError(err);
  }
}
