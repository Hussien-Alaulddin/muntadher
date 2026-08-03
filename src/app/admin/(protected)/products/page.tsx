import { redirect } from "next/navigation";

/** القسم القديم «المنتجات» انقسم إلى الدورات والكتيبات */
export default function AdminProductsRedirectPage() {
  redirect("/admin/courses");
}
