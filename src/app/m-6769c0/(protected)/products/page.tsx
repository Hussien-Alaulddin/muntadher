import { redirect } from "next/navigation";
import { adminPath } from "@/lib/admin-base-path";

/** القسم القديم «المنتجات» انقسم إلى الدورات والكتيبات */
export default function AdminProductsRedirectPage() {
  redirect(adminPath("/courses"));
}
