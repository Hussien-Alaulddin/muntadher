import { revalidatePath, revalidateTag } from "next/cache";
import { clearPublicSiteKnowledgeCache } from "@/lib/site-assistant-knowledge";

/** يحدّث صفحات الموقع ومعرفة مساعد الدردشة بعد تعديل المحتوى */
export function revalidateSite() {
  clearPublicSiteKnowledgeCache();
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/products");
  revalidateTag("site-content");
}
