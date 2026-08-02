"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpLeftIcon,
  BrushIcon,
  CheckIcon,
  ChevronDownIcon,
  FileStackIcon,
  Link2Icon,
  NewspaperIcon,
  PenIcon,
  PencilIcon,
  PercentIcon,
  PresentationIcon,
  ShieldCheckIcon,
  StarIcon,
  UsersIcon,
  VideoIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react";
import type {
  CourseIconName,
  CoursePageData,
} from "@/lib/course-detail";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatSitePrice } from "@/lib/currency";

export type CoursePageView = CoursePageData;

const ICON_MAP: Record<CourseIconName, LucideIcon> = {
  video: VideoIcon,
  files: FileStackIcon,
  pen: PenIcon,
  pencil: PencilIcon,
  brush: BrushIcon,
  presentation: PresentationIcon,
  percent: PercentIcon,
  newspaper: NewspaperIcon,
  link: Link2Icon,
  check: CheckIcon,
  star: StarIcon,
  users: UsersIcon,
  zap: ZapIcon,
};

function CourseIcon({
  name,
  className,
}: {
  name: CourseIconName;
  className?: string;
}) {
  const Icon = ICON_MAP[name] ?? CheckIcon;
  return <Icon className={className} />;
}

function EnrollButton({
  course,
  className,
  variant = "dark",
  intent = "purchase",
  entitled = false,
}: {
  course: CoursePageData;
  className?: string;
  variant?: "dark" | "brand" | "light";
  /** scroll = إلى كارد السعر، purchase = صفحة الشراء، learn = مشاهدة الدورة */
  intent?: "scroll" | "purchase" | "learn";
  entitled?: boolean;
}) {
  const purchaseHref = `/products/${course.slug}/purchase`;
  const learnHref = `/products/${course.slug}/learn`;
  const label = entitled
    ? "متابعة التعلّم"
    : course.detail.pricing.ctaLabel || course.ctaLabel || "سجل الآن";
  const styles =
    variant === "brand"
      ? "bg-brand text-inverted hover:bg-brand-hover"
      : variant === "light"
        ? "bg-page text-ink hover:bg-surface"
        : "bg-ink text-inverted hover:bg-ink/90";

  function scrollToOffer(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    const target = document.getElementById("course-offer");
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", "#course-offer");
  }

  if (entitled || intent === "learn") {
    return (
      <Button
        asChild
        className={`gap-2 rounded-full px-6 ${styles} ${className ?? ""}`}
      >
        <Link href={learnHref}>
          <ArrowUpLeftIcon className="size-4" />
          {label}
        </Link>
      </Button>
    );
  }

  if (intent === "scroll") {
    return (
      <Button
        asChild
        className={`gap-2 rounded-full px-6 ${styles} ${className ?? ""}`}
      >
        <a href="#course-offer" onClick={scrollToOffer}>
          <ArrowUpLeftIcon className="size-4" />
          {label}
        </a>
      </Button>
    );
  }

  return (
    <Button
      asChild
      className={`gap-2 rounded-full px-6 ${styles} ${className ?? ""}`}
    >
      <Link href={purchaseHref}>
        <ArrowUpLeftIcon className="size-4" />
        {label}
      </Link>
    </Button>
  );
}

function useCountUp(target: number, active: boolean, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, duration, target]);
  return value;
}

function StatCard({
  value,
  prefix,
  suffix,
  label,
  description,
}: {
  value: string;
  prefix: string;
  suffix: string;
  label: string;
  description: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const numeric = Number(value.replace(/[^\d.]/g, ""));
  const display = useCountUp(
    Number.isFinite(numeric) ? numeric : 0,
    active,
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="px-4 py-8 text-center md:px-6">
      <p className="font-arabic-bold text-4xl text-ink md:text-5xl">
        {prefix}
        {Number.isFinite(numeric) ? display : value}
        {suffix}
      </p>
      <p className="mt-2 text-base font-medium text-ink">{label}</p>
      {description ? (
        <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function ImageStrip({ images, alt }: { images: string[]; alt: string }) {
  if (images.length === 0) return null;
  return (
    <div className="mx-auto mt-8 flex max-w-3xl flex-col gap-5">
      {images.map((src) => (
        <div
          key={src}
          className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-surface ring-1 ring-line"
        >
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width:768px) 100vw, 768px"
          />
        </div>
      ))}
    </div>
  );
}

function MediaBlock({
  eyebrow,
  title,
  description,
  tags,
  images,
}: {
  eyebrow: string;
  title: string;
  description: string;
  tags: string[];
  images: string[];
}) {
  if (!title && !description && tags.length === 0 && images.length === 0) {
    return null;
  }
  return (
    <section className="container-site py-14 md:py-20">
      <div className="mx-auto max-w-3xl text-center">
        {eyebrow ? (
          <p className="mb-3 inline-flex rounded-full px-3 py-1 text-sm text-brand ring-1 ring-brand/30">
            {eyebrow}
          </p>
        ) : null}
        {title ? (
          <h2 className="font-arabic-bold text-2xl leading-snug md:text-4xl">
            {title}
          </h2>
        ) : null}
        {description ? (
          <p className="mt-4 text-ink-secondary leading-relaxed">
            {description}
          </p>
        ) : null}
        {tags.length > 0 ? (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-surface px-4 py-2 text-sm ring-1 ring-line"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <ImageStrip images={images} alt={title || eyebrow} />
    </section>
  );
}

function ModuleCard({
  module,
}: {
  module: CoursePageData["detail"]["modulesSection"]["modules"][number];
}) {
  const [open, setOpen] = useState(false);
  return (
    <article className="overflow-hidden rounded-[28px] bg-page ring-1 ring-line">
      <div className="space-y-4 px-5 py-6 md:px-8 md:py-8">
        {module.label ? (
          <p className="text-sm font-medium text-brand">{module.label}</p>
        ) : null}
        <h3 className="font-arabic-bold text-2xl md:text-3xl">{module.title}</h3>
        {module.description ? (
          <p className="text-ink-secondary leading-relaxed">
            {module.description}
          </p>
        ) : null}

        <div className="overflow-hidden rounded-2xl bg-surface">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-start"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            <span className="text-sm font-medium">
              {module.lessonsLabel || "دروس المحور"}
            </span>
            <ChevronDownIcon
              className={`size-4 text-brand transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
          {open && module.lessons.length > 0 ? (
            <ol className="space-y-2 border-t border-line px-4 py-4 text-sm text-ink-secondary">
              {module.lessons.map((lesson, index) => (
                <li key={`${lesson}-${index}`} className="flex gap-2">
                  <span className="tabular-nums text-brand">{index + 1}.</span>
                  <span>{lesson}</span>
                </li>
              ))}
            </ol>
          ) : null}
        </div>

        {module.imageUrl ? (
          <div className="relative mt-2 aspect-[16/10] overflow-hidden rounded-2xl bg-surface">
            <Image
              src={module.imageUrl}
              alt={module.title}
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 720px"
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}

function ReviewsSlider({
  eyebrow,
  title,
  items,
}: {
  eyebrow: string;
  title: string;
  items: CoursePageData["detail"]["reviews"]["items"];
}) {
  const [index, setIndex] = useState(0);
  const [autoKey, setAutoKey] = useState(0);
  const pausedRef = useRef(false);
  const reduceMotionRef = useRef(false);

  const goTo = (nextIndex: number) => {
    if (nextIndex === index) return;
    setIndex(nextIndex);
    setAutoKey((k) => k + 1);
  };

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduceMotionRef.current = media.matches;
    const onChange = () => {
      reduceMotionRef.current = media.matches;
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (items.length <= 1) return;
    const id = window.setInterval(() => {
      if (pausedRef.current || reduceMotionRef.current) return;
      setIndex((i) => (i + 1) % items.length);
      setAutoKey((k) => k + 1);
    }, 5500);
    return () => window.clearInterval(id);
  }, [items.length, autoKey]);

  if (items.length === 0) return null;

  return (
    <section className="container-site py-14 md:py-20">
      <div className="mb-8 text-center">
        {eyebrow ? (
          <p className="mb-3 inline-flex rounded-full px-3 py-1 text-sm ring-1 ring-line">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-arabic-bold text-2xl md:text-4xl">{title}</h2>
      </div>

      <div
        className="relative mx-auto max-w-3xl px-12 text-center"
        onMouseEnter={() => {
          pausedRef.current = true;
        }}
        onMouseLeave={() => {
          pausedRef.current = false;
        }}
        onFocusCapture={() => {
          pausedRef.current = true;
        }}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            pausedRef.current = false;
          }
        }}
      >
        <div className="grid">
          {items.map((item, i) => (
            <figure
              key={i}
              aria-hidden={i !== index}
              className={`col-start-1 row-start-1 transition-opacity duration-500 ease-in-out ${
                i === index
                  ? "relative z-10 opacity-100"
                  : "pointer-events-none z-0 opacity-0"
              }`}
            >
              <div className="mb-4 flex justify-center gap-1 text-brand">
                {Array.from({ length: item.rating }).map((_, star) => (
                  <StarIcon key={star} className="size-5 fill-current" />
                ))}
              </div>
              <blockquote className="text-base leading-relaxed text-ink-secondary md:text-lg">
                {item.quote}
              </blockquote>
              <p className="mt-5 font-medium text-brand">{item.name}</p>
            </figure>
          ))}
        </div>

        {items.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="السابق"
              className="absolute start-0 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-ink text-inverted transition-opacity hover:opacity-90"
              onClick={() =>
                goTo((index - 1 + items.length) % items.length)
              }
            >
              <ArrowRightIcon className="size-4" />
            </button>
            <button
              type="button"
              aria-label="التالي"
              className="absolute end-0 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-ink text-inverted transition-opacity hover:opacity-90"
              onClick={() => goTo((index + 1) % items.length)}
            >
              <ArrowLeftIcon className="size-4" />
            </button>

            <div className="mt-8 flex justify-center gap-2">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`تقييم ${i + 1}`}
                  aria-current={i === index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === index
                      ? "w-6 bg-brand"
                      : "w-1.5 bg-line hover:bg-ink-muted"
                  }`}
                  onClick={() => goTo(i)}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

export function CourseDetailView({
  course,
  entitled = false,
}: {
  course: CoursePageData;
  entitled?: boolean;
}) {
  const d = course.detail;
  const title = d.hero.title.trim() || course.title;
  const heroImage =
    d.hero.imageUrl.trim() || course.coverImageUrl || course.imageUrl;
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const socialIcon = useMemo(
    () =>
      ({
        instagram: Link2Icon,
        twitter: Link2Icon,
        x: Link2Icon,
        linkedin: Link2Icon,
        youtube: Link2Icon,
      }) as Record<string, LucideIcon>,
    [],
  );

  return (
    <main className="bg-page pb-16 text-ink">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line bg-[linear-gradient(180deg,#f3f7f6_0%,#ffffff_78%)]">
        <div className="container-site flex flex-col items-center py-14 text-center md:py-20">
          {d.hero.notice ? (
            <p className="mb-6 inline-flex max-w-2xl items-center gap-2 rounded-full bg-brand/10 px-4 py-2 text-sm text-brand ring-1 ring-brand/20">
              <ZapIcon className="size-4 shrink-0" />
              <span>{d.hero.notice}</span>
            </p>
          ) : null}

          <p className="mb-3 text-sm text-ink-muted">{course.type}</p>
          <h1 className="font-arabic-bold max-w-4xl text-4xl leading-tight md:text-6xl md:leading-[1.15]">
            {title}
          </h1>
          {(d.hero.subtitle || course.description) && (
            <p className="mt-5 max-w-2xl text-base text-ink-secondary md:text-lg">
              {d.hero.subtitle || course.description}
            </p>
          )}

          {d.hero.introVideoUrl.trim() ? (
            <div className="mt-10 w-full max-w-4xl overflow-hidden rounded-[28px] bg-ink shadow-sm ring-1 ring-line">
              <div className="relative aspect-video">
                <video
                  className="absolute inset-0 size-full object-contain"
                  controls
                  playsInline
                  preload="metadata"
                  src={d.hero.introVideoUrl.trim()}
                >
                  متصفحك لا يدعم تشغيل الفيديو
                </video>
              </div>
            </div>
          ) : null}

          {d.hero.features.length > 0 ? (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 rounded-full bg-page px-2 py-2 shadow-sm ring-1 ring-line">
              {d.hero.features.map((feature, index) => (
                <div
                  key={`${feature.label}-${index}`}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm md:border-s md:border-line md:first:border-s-0"
                >
                  <CourseIcon name={feature.icon} className="size-4 text-brand" />
                  <span>{feature.label}</span>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-8">
            <EnrollButton
              course={course}
              intent={entitled ? "learn" : "scroll"}
              entitled={entitled}
            />
          </div>

          {heroImage ? (
            <div className="relative mt-12 aspect-[16/10] w-full max-w-4xl overflow-hidden rounded-[28px] bg-surface ring-1 ring-line">
              <Image
                src={heroImage}
                alt={title}
                fill
                priority
                className="object-cover"
                sizes="(max-width:900px) 100vw, 900px"
              />
            </div>
          ) : null}
        </div>
      </section>

      {/* Stats */}
      {d.stats.length > 0 ? (
        <section className="border-b border-line">
          <div className="container-site grid sm:grid-cols-2">
            {d.stats.map((stat, index) => (
              <div
                key={`${stat.label}-${index}`}
                className="border-b border-line sm:odd:border-e sm:[&:nth-last-child(-n+2)]:border-b-0"
              >
                <StatCard {...stat} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <MediaBlock {...d.skills} />
      <div className="border-y border-line bg-surface">
        <MediaBlock {...d.methodology} />
      </div>

      {/* Modules */}
      {(d.modulesSection.title || d.modulesSection.modules.length > 0) && (
        <section className="bg-surface">
          <div className="container-site py-14 md:py-20">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              {d.modulesSection.eyebrow ? (
                <p className="mb-3 inline-flex rounded-full px-3 py-1 text-sm text-brand ring-1 ring-brand/30">
                  {d.modulesSection.eyebrow}
                </p>
              ) : null}
              <h2 className="font-arabic-bold text-2xl md:text-4xl">
                {d.modulesSection.title}
              </h2>
              {d.modulesSection.description ? (
                <p className="mt-3 text-ink-secondary">
                  {d.modulesSection.description}
                </p>
              ) : null}
            </div>
            <div className="mx-auto max-w-3xl space-y-5">
              {d.modulesSection.modules.map((module, index) => (
                <ModuleCard key={`${module.title}-${index}`} module={module} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bonuses */}
      {d.bonuses.items.length > 0 ? (
        <section className="container-site py-14 md:py-20">
          <h2 className="font-arabic-bold mb-10 text-center text-2xl md:text-4xl">
            {d.bonuses.title}
          </h2>
          <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2">
            {d.bonuses.items.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                className="flex flex-col items-center gap-3 text-center"
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                  <CourseIcon name={item.icon} className="size-5" />
                </span>
                <p className="text-sm font-medium md:text-base">{item.label}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Interactive */}
      {(d.interactive.title || d.interactive.items.length > 0) && (
        <section className="container-site py-14 md:py-20">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            {d.interactive.eyebrow ? (
              <p className="mb-2 text-sm text-brand">{d.interactive.eyebrow}</p>
            ) : null}
            {d.interactive.title ? (
              <h2 className="font-arabic-bold text-2xl md:text-4xl">
                {d.interactive.title}
              </h2>
            ) : null}
            {d.interactive.description ? (
              <p className="mt-3 text-ink-secondary">
                {d.interactive.description}
              </p>
            ) : null}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {d.interactive.items.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl bg-surface px-5 py-5 ring-1 ring-line"
              >
                <h3 className="text-lg font-medium">{item.title}</h3>
                {item.description ? (
                  <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
                    {item.description}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
          {d.interactive.imageUrl ? (
            <div className="relative mx-auto mt-10 aspect-[16/9] max-w-3xl overflow-hidden rounded-[28px]">
              <Image
                src={d.interactive.imageUrl}
                alt={d.interactive.title || "دورة تفاعلية"}
                fill
                className="object-cover"
                sizes="800px"
              />
            </div>
          ) : null}
        </section>
      )}

      <ReviewsSlider {...d.reviews} />

      {/* Instructor */}
      {(d.instructor.name || d.instructor.bio) && (
        <section className="border-y border-line bg-surface">
          <div className="container-site py-14 md:py-20">
            <div className="mx-auto max-w-3xl overflow-hidden rounded-[32px] bg-page text-center ring-1 ring-line">
              <div className="space-y-4 px-6 py-10 md:px-10">
                <p className="text-sm font-medium text-brand">
                  {d.instructor.eyebrow}
                </p>
                {d.instructor.name ? (
                  <h2 className="font-arabic-bold text-2xl md:text-4xl">
                    {d.instructor.name}
                  </h2>
                ) : null}
                {d.instructor.bio ? (
                  <p className="leading-relaxed text-ink-secondary">
                    {d.instructor.bio}
                  </p>
                ) : null}
                {d.instructor.socials.length > 0 ? (
                  <div className="flex justify-center gap-3 pt-2">
                    {d.instructor.socials.map((social) => {
                      const Icon =
                        socialIcon[social.platform.toLowerCase()] ?? Link2Icon;
                      if (!social.url) return null;
                      return (
                        <a
                          key={`${social.platform}-${social.url}`}
                          href={social.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex size-10 items-center justify-center rounded-full bg-brand/10 text-brand"
                        >
                          <Icon className="size-4" />
                        </a>
                      );
                    })}
                  </div>
                ) : null}
              </div>
              {d.instructor.imageUrl ? (
                <div className="relative aspect-[4/5] w-full bg-surface sm:aspect-[16/10]">
                  <Image
                    src={d.instructor.imageUrl}
                    alt={d.instructor.name || "المدرب"}
                    fill
                    className="object-cover object-top"
                    sizes="800px"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </section>
      )}

      {/* Pricing */}
      <section
        id="course-offer"
        className="scroll-mt-24 bg-surface py-14 md:py-20"
      >
        <div className="container-site">
          <Card className="relative mx-auto max-w-4xl gap-0 overflow-hidden rounded-[2rem] border border-white/80 bg-white/55 py-0 text-center shadow-[0_28px_64px_-30px_rgba(17,16,17,0.22)] backdrop-blur-2xl supports-backdrop-filter:bg-white/45 md:max-w-5xl ring-1 ring-ink/10">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-l from-transparent via-white to-transparent"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 start-1/2 h-48 w-80 -translate-x-1/2 rounded-full bg-[#82c6db]/25 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-28 -end-10 h-56 w-56 rounded-full bg-brand/15 blur-3xl"
            />

            <CardHeader className="relative items-center gap-4 px-8 pt-10 pb-2 md:px-14 md:pt-14">
              <Badge className="rounded-full border-transparent bg-brand px-3.5 py-1 text-inverted hover:bg-brand">
                عرض الدورة
              </Badge>
              <CardTitle className="max-w-2xl font-arabic-bold text-xl leading-relaxed text-ink md:text-2xl">
                {d.pricing.title?.trim() || `احصل على ${title}`}
              </CardTitle>
            </CardHeader>

            <CardContent className="relative flex flex-col items-center gap-6 px-8 py-8 md:px-14">
              <Card className="w-full max-w-xs gap-0 overflow-hidden rounded-2xl border border-white/80 bg-white/75 py-0 shadow-[0_12px_28px_-16px_rgba(17,16,17,0.18)] backdrop-blur-xl ring-1 ring-ink/8">
                <CardContent className="flex flex-col items-center px-8 py-8">
                  <p className="text-xs font-medium tracking-wide text-ink-muted">
                    السعر الحالي
                  </p>
                  <p className="mt-2 font-arabic-bold text-5xl text-brand md:text-6xl">
                    {formatSitePrice(d.pricing.price || course.price)}
                  </p>
                </CardContent>
              </Card>

              {d.pricing.originalPrice ? (
                <Badge
                  variant="outline"
                  className="rounded-full border-ink/15 bg-white/70 px-3 py-1 text-ink-secondary backdrop-blur-sm"
                >
                  بدلاً من{" "}
                  <span className="ms-1 font-medium text-ink line-through">
                    {formatSitePrice(d.pricing.originalPrice)}
                  </span>
                </Badge>
              ) : null}

              <Separator className="max-w-xs bg-ink/10" />

              <EnrollButton
                course={course}
                intent={entitled ? "learn" : "purchase"}
                entitled={entitled}
                variant="brand"
                className="h-11 min-w-[180px] px-8 text-base shadow-[0_12px_32px_-10px_rgba(255,102,20,0.65)]"
              />
            </CardContent>

            {d.pricing.secureNote && !entitled ? (
              <CardFooter className="relative justify-center gap-2 border-t border-ink/8 bg-white/40 py-5 text-ink-secondary backdrop-blur-md">
                <ShieldCheckIcon className="size-4 shrink-0 text-brand" />
                <p className="text-xs font-medium">{d.pricing.secureNote}</p>
              </CardFooter>
            ) : null}
          </Card>
        </div>
      </section>

      <p className="container-site mt-8 text-center text-sm text-ink-muted">
        <Link href="/products" className="underline-offset-4 hover:underline">
          العودة للمنتجات
        </Link>
      </p>

      {showSticky ? (
        <div className="pointer-events-none fixed bottom-6 end-6 z-40 hidden md:block">
          <div className="pointer-events-auto">
            <EnrollButton
              course={course}
              intent={entitled ? "learn" : "purchase"}
              entitled={entitled}
              variant="brand"
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}
