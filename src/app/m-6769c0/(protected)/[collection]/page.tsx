import { notFound } from "next/navigation";
import { isCollection } from "@/lib/admin-collections";
import { CollectionManager } from "@/components/admin/collection-manager";

export default async function AdminCollectionPage({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const { collection } = await params;
  if (!isCollection(collection)) notFound();

  return <CollectionManager collection={collection} />;
}
