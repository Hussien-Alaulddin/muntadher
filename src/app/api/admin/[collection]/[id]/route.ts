import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { checkAdmin, requireDatabase } from "@/lib/admin-auth";
import { adminRouteError } from "@/lib/admin-route-error";
import { withDbRetry } from "@/lib/prisma";
import {
  collectionListWhere,
  getDelegate,
  isCollection,
  pickFields,
} from "@/lib/admin-collections";

type Params = { params: Promise<{ collection: string; id: string }> };

function revalidateSite() {
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/products");
  revalidateTag("site-content");
}

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
    const where = { id, ...collectionListWhere(collection) };
    const existing = await withDbRetry((prisma) =>
      getDelegate(prisma, collection).findFirst({ where }),
    );
    if (!existing) {
      return NextResponse.json({ message: "العنصر غير موجود" }, { status: 404 });
    }

    const item = await withDbRetry((prisma) =>
      getDelegate(prisma, collection).update({
        where: { id },
        data: pickFields(collection, payload),
      }),
    );

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
    revalidateSite();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return adminRouteError(err);
  }
}
