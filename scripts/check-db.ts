import { getPrisma, withDbRetry } from "@/lib/prisma";

async function main() {
  if (!getPrisma()) {
    console.error("❌ DATABASE_URL غير مضبوط في .env");
    process.exit(1);
  }

  try {
    const result = await withDbRetry(async (prisma) => {
      const [projects, settings] = await Promise.all([
        prisma.project.count(),
        prisma.siteSettings.findUnique({
          where: { id: "default" },
          select: { siteName: true },
        }),
      ]);
      return { projects, siteName: settings?.siteName ?? null };
    });

    console.log("✅ الاتصال بـ Supabase ناجح");
    console.log(`   المشاريع: ${result.projects}`);
    console.log(`   الموقع: ${result.siteName ?? "—"}`);
  } catch (error) {
    console.error("❌ فشل الاتصال بـ Supabase");
    console.error(error instanceof Error ? error.message : error);
    console.error(
      "\nتحقق من: مشروع Supabase (Healthy) + DATABASE_URL على منفذ 5432 (Session) + كلمة المرور.",
    );
    process.exit(1);
  }
}

main();
