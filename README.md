# موقع منتظر — بورتفوليو + منصة منتجات

موقع عربي RTL لمصمم هويات بصرية، مبني على Next.js وTailwind CSS، ومحتواه الديناميكي في Supabase/PostgreSQL عبر Prisma.

المرحلة الحالية: **الصفحة الرئيسية فقط** (`page-home.json`).

## التقنيات

| الطبقة | الأداة |
| --- | --- |
| الإطار | Next.js 15 (App Router) |
| التنسيق | Tailwind CSS 4 (tokens من `design-system.json`) |
| قاعدة البيانات | Supabase / PostgreSQL |
| ORM | Prisma 6 |

## التشغيل

```bash
npm install
cp .env.example .env      # ثم عبّي DATABASE_URL و DIRECT_URL و ADMIN_API_TOKEN
npm run prisma:generate
npm run prisma:push       # ينشئ الجداول في Supabase
npm run prisma:seed       # يزرع المحتوى الابتدائي (placeholder)
npm run db:check          # يتحقق من اتصال Supabase
npm run dev
```

### رفع الصور والفيديو

من لوحة التحكم يمكن رفع الصور (حتى 10MB) والفيديو (حتى 50MB).

1. من Supabase: **Project Settings → API** انسخ `service_role` إلى `SUPABASE_SERVICE_ROLE_KEY` في `.env`
2. تأكد أن `NEXT_PUBLIC_SUPABASE_URL` مضبوط
3. أعد تشغيل `npm run dev`

بدون مفتاح `service_role` يعمل الرفع محلياً في `public/uploads` (مناسب للتطوير فقط).

### استقرار اتصال Supabase

- استخدم **Session mode (منفذ 5432)** في `DATABASE_URL` مع `connection_limit=1`.
- لا تشغّل أكثر من سيرفر `dev` واحد في نفس الوقت (خطة Free محدودة الاتصالات).
- إذا ظهر المشروع **Paused** في لوحة Supabase → **Restore** ثم أعد المحاولة.
- للتحقق السريع: `npm run db:check`

الموقع يشتغل **حتى بدون قاعدة بيانات**: لو `DATABASE_URL` غير مضبوط، طبقة المحتوى تعرض
المحتوى الابتدائي من `src/lib/placeholder-content.ts` بدل ما تنكسر الصفحة.

## مصادر المحتوى

- `src/lib/fixed-content.ts` — كل نص `"source": "fixed"` من ملف الصفحة، منقول حرفياً.
- `src/lib/placeholder-content.ts` — محتوى `placeholderContent` كبيانات ابتدائية فقط.
- الباقي كله من قاعدة البيانات عبر `src/lib/content.ts`.

- `src/lib/demo-content.ts` — محتوى تجريبي لبقية الأقسام (بانر "جديد"، الأسئلة،
  شعارات العملاء) عشان يستلم المصمم موقعاً كامل المحتوى.

## المحتوى التجريبي

**كل أقسام الصفحة الرئيسية تظهر من أول تشغيل** بمحتوى تجريبي، بدون أي إعداد
إضافي، حتى يشاهد المصمم الموقع كامل ويستبدل المحتوى عنصراً عنصراً.

النصوص كلها موسومة صريحاً بكلمة "تجريبي"، ومصدرها إمّا `placeholderContent` في
`page-home.json` أو `src/lib/demo-content.ts`.

قبل ربط قاعدة البيانات يُقرأ المحتوى من الكود مباشرة. وبعد `npm run prisma:seed`
يصير موجوداً في قاعدة البيانات، فيقدر المصمم يعدّله أو يحذفه من لوحة التحكم —
وأي قسم يفرّغه بالكامل يختفي من الصفحة حسب `emptyState`.

### قبل الإطلاق للعامة

لازم يُستبدل محتوى الجوائز والتأثير الرقمي وشهادات العملاء بمحتوى حقيقي (أو
يُحذف)، لأن عرضه للزوار يوحي بإنجازات وشهادات غير حقيقية. لإخفاء المحتوى
التجريبي بالكامل بدون حذف الكود:

```bash
DEMO_CONTENT=off    # يخفي المحتوى التجريبي المقروء من الكود
SEED_DEMO=off       # يزرع الهيكل فقط بدون محتوى تجريبي
```

## سلوك الأقسام الفاضية (emptyState)

| القسم | لو ما فيه محتوى |
| --- | --- |
| hero | صورة placeholder رمادية بنفس أبعاد 4:5 |
| stats | التسميات الأربع تظهر دائماً، والأرقام تظهر كشرطة |
| أحدث أعمالي | رسالة + زر "أضف أول مشروع" يوجّه للوحة التحكم |
| المنتجات، الجوائز، التأثير الرقمي، اعمل حالياً على، محطات المسيرة، شعارات العملاء، الشهادات، الأسئلة | القسم يُخفى بالكامل |
| بانر "جديد" | لا يظهر إلا لو فعّله المصمم من لوحة التحكم |

## لوحة التحكم

المسار: [`/admin`](http://localhost:3000/admin)

1. اضبط `ADMIN_API_TOKEN` في `.env` (سلسلة سرية قوية).
2. افتح `/admin/login` وأدخل نفس الرمز.
3. من اللوحة عدّل الإعدادات، البانر، والمشاريع وباقي الأقسام.

الجلسة تُحفظ في كوكي `httpOnly` لمدة أسبوع. واجهات `/api/admin/*` تقبل التوكن من الكوكي أو من ترويسة `x-admin-token`.

## واجهات لوحة التحكم (API)

كلها تتطلب ترويسة `x-admin-token` تساوي `ADMIN_API_TOKEN`، وتستدعي `revalidatePath("/")`
بعد أي تعديل عشان الصفحة الرئيسية تتحدث فوراً.

```
GET    /api/admin/settings
PATCH  /api/admin/settings          { settings: {...}, banner: {...} }

GET    /api/admin/:collection
POST   /api/admin/:collection
PATCH  /api/admin/:collection/:id
DELETE /api/admin/:collection/:id
```

`:collection` واحد من: `projects`, `products`, `stats`, `awards`, `digital-impact`,
`tasks`, `career-highlights`, `client-logos`, `testimonials`, `faqs`, `socials`.

للزوار: `POST /api/newsletter` بـ `{ "email": "..." }` لتسجيل الاشتراك بالنشرة.

## هيكل الملفات

```
prisma/schema.prisma          سكيما كل المحتوى الديناميكي
prisma/seed.ts                البيانات الابتدائية
src/app/page.tsx              تركيب الصفحة الرئيسية
src/app/globals.css           tokens design-system.json
src/components/home/*         أقسام الصفحة الرئيسية
src/components/ui.tsx         الأزرار، ترويسة القسم، emptyState
src/lib/content.ts            طبقة قراءة المحتوى (DB + fallback)
```
