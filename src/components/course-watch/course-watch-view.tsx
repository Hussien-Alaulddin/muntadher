"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AwardIcon,
  CheckIcon,
  ChevronDownIcon,
  CircleHelpIcon,
  Clock3Icon,
  DownloadIcon,
  ExternalLinkIcon,
  FileTextIcon,
  MessageSquareIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
  ThumbsUpIcon,
  XIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  flattenWatchLessons,
  lessonAttachments,
  progressStorageKey,
  type CourseWatchContent,
  type CourseWatchLesson,
} from "@/lib/course-watch";
import { cn } from "@/lib/utils";

type TabId = "qa" | "certificate";

type CourseQuestion = {
  id: string;
  lessonId: string;
  title: string;
  body: string;
  votes: number;
  createdAt: string;
};

function ratingStorageKey(productId: string, customerId: string) {
  return `montader-course-rating:${productId}:${customerId}`;
}

function questionsStorageKey(productId: string, customerId: string) {
  return `montader-course-questions:${productId}:${customerId}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function downloadCertificate(courseTitle: string) {
  const safeTitle = escapeHtml(courseTitle);
  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>شهادة — ${safeTitle}</title>
  <style>
    body { font-family: "IBM Plex Sans Arabic", Tajawal, sans-serif; margin: 0; background: #f3f7f6; color: #111; }
    .sheet { max-width: 900px; margin: 40px auto; padding: 48px; background: #fff; border: 2px solid #ff6614; border-radius: 24px; text-align: center; }
    h1 { color: #ff6614; margin: 0 0 12px; font-size: 32px; }
    p { line-height: 1.8; color: #444; }
    .title { font-size: 22px; color: #111; font-weight: 700; margin: 24px 0; }
    .meta { margin-top: 32px; font-size: 14px; color: #777; }
  </style>
</head>
<body>
  <div class="sheet">
    <h1>شهادة إتمام الدورة</h1>
    <p>تشهد منصة منتظر بأن المتعلم قد أكمل بنجاح دورة:</p>
    <p class="title">${safeTitle}</p>
    <p>مع خالص التهنئة والتوفيق.</p>
    <p class="meta">${new Date().toLocaleDateString("ar-IQ")}</p>
  </div>
  <script>window.onload = () => window.print()</script>
</body>
</html>`;
  const win = window.open("", "_blank", "noopener,noreferrer,width=960,height=720");
  if (!win) {
    toast.error("اسمح بالنوافذ المنبثقة لتحميل الشهادة");
    return;
  }
  win.document.write(html);
  win.document.close();
}

export function CourseWatchView({
  productId,
  productSlug,
  customerId,
  content,
}: {
  productId: string;
  productSlug: string;
  customerId: string;
  content: CourseWatchContent;
}) {
  const flatLessons = useMemo(() => flattenWatchLessons(content), [content]);
  const firstLessonId = flatLessons[0]?.lesson.id ?? "";
  const videoRef = useRef<HTMLVideoElement>(null);

  const [activeLessonId, setActiveLessonId] = useState(firstLessonId);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [openSections, setOpenSections] = useState<string[]>(() =>
    content.sections.map((s) => s.id),
  );
  const [tab, setTab] = useState<TabId>("qa");
  const [qaFilter, setQaFilter] = useState(
    content.tabs.qa.filters[0]?.id ?? "lesson",
  );
  const [qaSearch, setQaSearch] = useState("");
  const [questions, setQuestions] = useState<CourseQuestion[]>([]);
  const [rating, setRating] = useState(0);
  const [draftRating, setDraftRating] = useState(0);
  const [rateOpen, setRateOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [askTitle, setAskTitle] = useState("");
  const [askBody, setAskBody] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(
        progressStorageKey(productId, customerId),
      );
      if (raw) {
        const parsed = JSON.parse(raw) as {
          completedIds?: string[];
          activeLessonId?: string;
        };
        if (Array.isArray(parsed.completedIds)) {
          setCompletedIds(parsed.completedIds.filter(Boolean));
        }
        if (
          parsed.activeLessonId &&
          flatLessons.some((row) => row.lesson.id === parsed.activeLessonId)
        ) {
          setActiveLessonId(parsed.activeLessonId);
        }
      }

      const ratingRaw = localStorage.getItem(
        ratingStorageKey(productId, customerId),
      );
      if (ratingRaw) {
        const value = Number(ratingRaw);
        if (value >= 1 && value <= 5) setRating(value);
      }

      const questionsRaw = localStorage.getItem(
        questionsStorageKey(productId, customerId),
      );
      if (questionsRaw) {
        const parsed = JSON.parse(questionsRaw) as CourseQuestion[];
        if (Array.isArray(parsed)) setQuestions(parsed);
      }
    } catch {
      // ignore corrupt local data
    }
  }, [productId, customerId, flatLessons]);

  useEffect(() => {
    try {
      localStorage.setItem(
        progressStorageKey(productId, customerId),
        JSON.stringify({ completedIds, activeLessonId }),
      );
    } catch {
      // ignore quota errors
    }
  }, [completedIds, activeLessonId, productId, customerId]);

  useEffect(() => {
    try {
      localStorage.setItem(
        questionsStorageKey(productId, customerId),
        JSON.stringify(questions),
      );
    } catch {
      // ignore quota errors
    }
  }, [questions, productId, customerId]);

  const active = flatLessons.find((row) => row.lesson.id === activeLessonId);
  const activeLesson = active?.lesson;
  const activeAttachments = activeLesson
    ? lessonAttachments(activeLesson)
    : [];
  const completedCount = completedIds.length;
  const totalLessons = content.course.totalLessons || flatLessons.length;
  const progressPercent =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const allComplete = totalLessons > 0 && completedCount >= totalLessons;
  const isActiveComplete = activeLessonId
    ? completedIds.includes(activeLessonId)
    : false;

  const filterCounts = useMemo(() => {
    const lessonCount = questions.filter(
      (q) => q.lessonId === activeLessonId,
    ).length;
    return {
      lesson: lessonCount,
      course: questions.length,
      top: questions.length,
    } as Record<string, number>;
  }, [questions, activeLessonId]);

  const filteredQuestions = useMemo(() => {
    const query = qaSearch.trim();
    let rows = questions.filter((q) => {
      if (qaFilter === "lesson" && q.lessonId !== activeLessonId) return false;
      if (!query) return true;
      return q.title.includes(query) || q.body.includes(query);
    });

    if (qaFilter === "top") {
      rows = [...rows].sort(
        (a, b) => b.votes - a.votes || b.createdAt.localeCompare(a.createdAt),
      );
    } else {
      rows = [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return rows;
  }, [questions, qaFilter, activeLessonId, qaSearch]);

  const activeFilterLabel =
    content.tabs.qa.filters.find((f) => f.id === qaFilter)?.label ??
    "الأسئلة";

  const emptyFilterMessage =
    qaFilter === "lesson"
      ? "لا توجد أسئلة على هذا الدرس بعد. اطرح سؤالاً أو جرّب «كل الدورة»."
      : qaFilter === "top"
        ? "لا توجد أسئلة لترتيبها بالتصويت بعد. اطرح سؤالاً أولاً."
        : content.tabs.qa.emptyDescription;

  function toggleSection(id: string) {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((row) => row !== id) : [...prev, id],
    );
  }

  function selectLesson(lesson: CourseWatchLesson) {
    setActiveLessonId(lesson.id);
    const section = content.sections.find((s) =>
      s.lessons.some((row) => row.id === lesson.id),
    );
    if (section && !openSections.includes(section.id)) {
      setOpenSections((prev) => [...prev, section.id]);
    }
  }

  function completeLesson() {
    if (!activeLessonId) return;
    setCompletedIds((prev) =>
      prev.includes(activeLessonId) ? prev : [...prev, activeLessonId],
    );
    toast.success("تم إكمال الدرس");
    const index = flatLessons.findIndex(
      (row) => row.lesson.id === activeLessonId,
    );
    const next = flatLessons[index + 1];
    if (next) setActiveLessonId(next.lesson.id);
  }

  function playActiveMedia() {
    if (!activeLesson) {
      toast.message(content.player.emptyMessage);
      return;
    }
    if (activeLesson.type === "file") {
      if (activeLesson.fileUrl) {
        window.open(activeLesson.fileUrl, "_blank", "noopener,noreferrer");
        return;
      }
      toast.message("رابط الملف غير متوفر بعد لهذا الملحق");
      return;
    }
    if (activeLesson.videoUrl) {
      const video = videoRef.current;
      if (video) {
        void video.play().catch(() => {
          toast.message("اضغط تشغيل من مشغّل الفيديو");
        });
      }
      return;
    }
    toast.message("أضف رابط الفيديو من محتوى الدورة لاحقاً");
  }

  function submitRating() {
    if (draftRating < 1) {
      toast.error("اختر تقييماً من 1 إلى 5");
      return;
    }
    setRating(draftRating);
    try {
      localStorage.setItem(
        ratingStorageKey(productId, customerId),
        String(draftRating),
      );
    } catch {
      // ignore
    }
    setRateOpen(false);
    toast.success("شكراً لتقييمك الدورة");
  }

  function submitQuestion() {
    const title = askTitle.trim();
    const body = askBody.trim();
    if (!title || !body) {
      toast.error("أدخل عنوان السؤال ونصّه");
      return;
    }
    const next: CourseQuestion = {
      id: `q-${Date.now()}`,
      lessonId: activeLessonId || firstLessonId,
      title,
      body,
      votes: 0,
      createdAt: new Date().toISOString(),
    };
    setQuestions((prev) => [next, ...prev]);
    setAskTitle("");
    setAskBody("");
    setAskOpen(false);
    setTab("qa");
    toast.success("تم نشر سؤالك");
  }

  function voteQuestion(id: string) {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, votes: q.votes + 1 } : q)),
    );
  }

  return (
    <div className="min-h-screen bg-page text-ink">
      <header className="sticky top-[60px] z-30 border-b border-line bg-page/95 backdrop-blur md:top-[68px]">
        <div className="mx-auto flex w-full max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="rounded-full gap-1.5">
              <Link href={`/products/${productSlug}`}>
                <XIcon className="size-4" />
                {content.actions.exitLabel}
              </Link>
            </Button>
            <Button
              type="button"
              className="rounded-full gap-1.5 bg-brand text-inverted hover:bg-brand-hover"
              disabled={!activeLessonId || isActiveComplete}
              onClick={completeLesson}
            >
              <CheckIcon className="size-4" />
              {isActiveComplete
                ? "تم إكمال الدرس"
                : content.actions.completeLessonLabel}
            </Button>
          </div>
          <div className="min-w-0 text-end">
            <p className="truncate text-sm font-medium text-ink">
              {content.course.title}
            </p>
            <p className="text-xs text-ink-muted">
              {completedCount}/{totalLessons} — {progressPercent}%
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1500px] gap-5 px-4 py-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[24px] border border-line bg-ink shadow-sm">
            <div className="relative aspect-video min-h-[280px] bg-ink sm:min-h-[380px] lg:min-h-[min(68vh,760px)]">
              {activeLesson?.videoUrl ? (
                <video
                  ref={videoRef}
                  key={activeLesson.id}
                  className="absolute inset-0 size-full object-contain"
                  controls
                  preload="metadata"
                  playsInline
                  poster={activeLesson.posterUrl || undefined}
                  src={activeLesson.videoUrl}
                />
              ) : (
                <>
                  {(activeLesson?.posterUrl ||
                    content.player.emptyPosterUrl) && (
                    <Image
                      src={
                        activeLesson?.posterUrl || content.player.emptyPosterUrl
                      }
                      alt={activeLesson?.title || content.course.title}
                      fill
                      className="object-cover opacity-80"
                      sizes="(max-width:1024px) 100vw, 75vw"
                      priority
                    />
                  )}
                  <button
                    type="button"
                    onClick={playActiveMedia}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/35 px-6 text-center text-inverted transition hover:bg-ink/45"
                  >
                    <span className="flex size-20 items-center justify-center rounded-full bg-brand text-inverted shadow-lg sm:size-24">
                      {activeLesson?.type === "file" ? (
                        <FileTextIcon className="size-8" />
                      ) : (
                        <PlayIcon className="size-9 fill-current sm:size-10" />
                      )}
                    </span>
                    <span>
                      <span className="block font-arabic-bold text-xl sm:text-2xl">
                        {activeLesson?.title || content.course.title}
                      </span>
                      <span className="mt-2 block text-sm text-white/80 sm:text-base">
                        {activeLesson
                          ? activeLesson.type === "file"
                            ? activeLesson.fileUrl
                              ? "اضغط لفتح الملحق"
                              : "هذا ملحق — ارفع رابط الملف من لوحة التحكم لاحقاً"
                            : "أضف رابط الفيديو من محتوى الدورة لاحقاً"
                          : content.player.emptyMessage}
                      </span>
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>

          {(activeLesson?.description || activeAttachments.length > 0) && (
            <div className="space-y-3 rounded-[24px] border border-line bg-page p-5 shadow-sm">
              {activeLesson?.description ? (
                <div>
                  <h3 className="font-medium text-ink">عن هذا الدرس</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-secondary">
                    {activeLesson.description}
                  </p>
                </div>
              ) : null}
              {activeAttachments.length > 0 ? (
                <div>
                  <h3 className="font-medium text-ink">الملحقات</h3>
                  <ul className="mt-2 space-y-2">
                    {activeAttachments.map((att) => (
                      <li key={att.id}>
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-brand transition hover:bg-brand/5"
                        >
                          {att.kind === "file" ? (
                            <FileTextIcon className="size-4" />
                          ) : (
                            <ExternalLinkIcon className="size-4" />
                          )}
                          {att.title.trim() || att.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-full gap-1.5"
              onClick={() => {
                setDraftRating(rating || 5);
                setRateOpen(true);
              }}
            >
              <StarIcon className="size-4 text-amber-500" />
              {rating > 0
                ? `تقييمك: ${rating}/5`
                : content.actions.rateCourseLabel}
            </Button>
            <div className="flex items-center gap-1 rounded-full bg-page p-1 ring-1 ring-line">
              <button
                type="button"
                onClick={() => setTab("qa")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm transition",
                  tab === "qa"
                    ? "bg-brand text-inverted"
                    : "text-ink-secondary hover:text-ink",
                )}
              >
                {content.tabs.qa.label}
              </button>
              <button
                type="button"
                onClick={() => setTab("certificate")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm transition",
                  tab === "certificate"
                    ? "bg-brand text-inverted"
                    : "text-ink-secondary hover:text-ink",
                )}
              >
                {content.tabs.certificate.label}
              </button>
            </div>
          </div>

          <div className="rounded-[24px] border border-line bg-page p-5 shadow-sm">
            {tab === "qa" ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    className="rounded-full gap-1.5 bg-brand text-inverted hover:bg-brand-hover"
                    onClick={() => setAskOpen(true)}
                  >
                    <PlusIcon className="size-4" />
                    {content.actions.askQuestionLabel}
                  </Button>
                  {content.tabs.qa.filters.map((filter) => {
                    const count = filterCounts[filter.id] ?? questions.length;
                    const active = qaFilter === filter.id;
                    return (
                      <button
                        key={filter.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setQaFilter(filter.id)}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-sm ring-1 transition",
                          active
                            ? "bg-brand text-inverted ring-brand"
                            : "bg-surface text-ink-secondary ring-line hover:text-ink",
                        )}
                      >
                        {filter.label}
                        <span
                          className={cn(
                            "ms-1.5 inline-flex min-w-5 items-center justify-center rounded-full px-1 text-[11px]",
                            active
                              ? "bg-white/20 text-inverted"
                              : "bg-page text-ink-muted",
                          )}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-ink-muted">
                  العرض الحالي:{" "}
                  <span className="font-medium text-ink">{activeFilterLabel}</span>
                  {" · "}
                  {filteredQuestions.length} سؤال
                </p>
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
                  <Input
                    value={qaSearch}
                    onChange={(e) => setQaSearch(e.target.value)}
                    placeholder={content.tabs.qa.searchPlaceholder}
                    className="ps-9"
                  />
                </div>

                {filteredQuestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-surface px-6 py-14 text-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-brand/10 text-brand">
                      <MessageSquareIcon className="size-6" />
                    </div>
                    <div>
                      <p className="font-medium text-ink">
                        {content.tabs.qa.emptyTitle}
                      </p>
                      <p className="mt-1 text-sm text-ink-secondary">
                        {qaSearch.trim()
                          ? "لا نتائج تطابق بحثك ضمن الفلتر الحالي."
                          : emptyFilterMessage}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => setAskOpen(true)}
                    >
                      {content.actions.askQuestionLabel}
                    </Button>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {filteredQuestions.map((question) => (
                      <li
                        key={question.id}
                        className="rounded-2xl border border-line bg-surface/60 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-ink">
                              {question.title}
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-ink-secondary">
                              {question.body}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="shrink-0 rounded-full gap-1"
                            onClick={() => voteQuestion(question.id)}
                          >
                            <ThumbsUpIcon className="size-3.5" />
                            {question.votes}
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <AwardIcon className="size-6" />
                </div>
                <div>
                  <p className="font-arabic-bold text-xl text-ink">
                    {content.tabs.certificate.title}
                  </p>
                  <p className="mt-2 max-w-md text-sm text-ink-secondary">
                    {allComplete
                      ? content.tabs.certificate.description
                      : content.tabs.certificate.lockedMessage}
                  </p>
                </div>
                <Button
                  type="button"
                  disabled={!allComplete}
                  className="rounded-full gap-1.5 bg-brand text-inverted hover:bg-brand-hover disabled:opacity-50"
                  onClick={() => {
                    if (!allComplete) {
                      toast.message(content.tabs.certificate.lockedMessage);
                      return;
                    }
                    downloadCertificate(content.course.title);
                    toast.success("جاهزة للطباعة أو الحفظ كـ PDF");
                  }}
                >
                  <DownloadIcon className="size-4" />
                  {content.tabs.certificate.downloadLabel}
                </Button>
              </div>
            )}
          </div>
        </div>

        <aside className="overflow-hidden rounded-[24px] border border-line bg-page shadow-sm lg:sticky lg:top-[8.5rem] lg:max-h-[calc(100vh-9.5rem)] lg:overflow-y-auto">
          <div className="space-y-3 border-b border-line p-4">
            <div>
              <h2 className="font-arabic-bold text-lg text-ink">
                {content.sidebar.title}
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                {content.course.title}
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                {totalLessons} دروس · {content.course.totalDurationLabel}
              </p>
            </div>
            <div className="space-y-2 rounded-2xl bg-surface p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-ink">
                  {completedCount}/{totalLessons} — {progressPercent}%
                </span>
                <Badge
                  variant="secondary"
                  className="rounded-full bg-brand/10 text-brand hover:bg-brand/10"
                >
                  {content.sidebar.progressLabel}
                </Badge>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-brand transition-[width] duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="divide-y divide-line">
            {content.sections.map((section) => {
              const open = openSections.includes(section.id);
              return (
                <div key={section.id}>
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className="flex w-full items-start justify-between gap-3 px-4 py-3 text-start hover:bg-surface/80"
                  >
                    <div>
                      <p className="font-medium text-ink">{section.title}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {section.lessonsCountLabel}
                        {section.durationLabel
                          ? ` · ${section.durationLabel}`
                          : ""}
                      </p>
                    </div>
                    <ChevronDownIcon
                      className={cn(
                        "mt-1 size-4 shrink-0 text-ink-muted transition-transform",
                        open ? "rotate-180" : "",
                      )}
                    />
                  </button>
                  {open ? (
                    <ul className="space-y-1 px-2 pb-3">
                      {section.lessons.map((lesson, index) => {
                        const done = completedIds.includes(lesson.id);
                        const current = lesson.id === activeLessonId;
                        return (
                          <li key={lesson.id}>
                            <button
                              type="button"
                              onClick={() => selectLesson(lesson)}
                              className={cn(
                                "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-start transition",
                                current
                                  ? "bg-brand/10 ring-1 ring-brand/25"
                                  : "hover:bg-surface",
                              )}
                            >
                              <span
                                className={cn(
                                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[11px]",
                                  done
                                    ? "bg-success text-inverted"
                                    : current
                                      ? "bg-brand text-inverted"
                                      : "bg-surface text-ink-muted ring-1 ring-line",
                                )}
                              >
                                {done ? (
                                  <CheckIcon className="size-3.5" />
                                ) : current ? (
                                  <PlayIcon className="size-3 fill-current" />
                                ) : (
                                  index + 1
                                )}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span
                                  className={cn(
                                    "block text-sm leading-snug",
                                    current
                                      ? "font-medium text-brand"
                                      : "text-ink",
                                  )}
                                >
                                  {lesson.title}
                                </span>
                                <span className="mt-1 flex items-center gap-2 text-[11px] text-ink-muted">
                                  {lesson.type === "file" ? (
                                    <FileTextIcon className="size-3" />
                                  ) : (
                                    <Clock3Icon className="size-3" />
                                  )}
                                  {lesson.duration}
                                  {lesson.type === "file" && lesson.fileUrl ? (
                                    <ExternalLinkIcon className="size-3" />
                                  ) : null}
                                </span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>

          {content.sections.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-ink-muted">
              <CircleHelpIcon className="size-5" />
              لا يوجد محتوى تعليمي بعد
            </div>
          ) : null}
        </aside>
      </div>

      <Dialog open={rateOpen} onOpenChange={setRateOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>قيّم الدورة</DialogTitle>
            <DialogDescription>
              اختر عدد النجوم حسب تجربتك مع {content.course.title}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`${value} نجوم`}
                onClick={() => setDraftRating(value)}
                className="rounded-full p-1 transition hover:scale-110"
              >
                <StarIcon
                  className={cn(
                    "size-8",
                    value <= draftRating
                      ? "fill-amber-400 text-amber-400"
                      : "text-ink-muted",
                  )}
                />
              </button>
            ))}
          </div>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              className="rounded-full bg-brand text-inverted hover:bg-brand-hover"
              onClick={submitRating}
            >
              حفظ التقييم
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setRateOpen(false)}
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={askOpen} onOpenChange={setAskOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>اطرح سؤالاً</DialogTitle>
            <DialogDescription>
              سيظهر سؤالك ضمن تبويب الأسئلة والأجوبة لهذا الدرس.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ask-title">عنوان السؤال</Label>
              <Input
                id="ask-title"
                value={askTitle}
                onChange={(e) => setAskTitle(e.target.value)}
                placeholder="مثال: كيف أطبّق هذا الدرس؟"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ask-body">تفاصيل السؤال</Label>
              <Textarea
                id="ask-body"
                value={askBody}
                onChange={(e) => setAskBody(e.target.value)}
                placeholder="اكتب سؤالك بوضوح…"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              className="rounded-full bg-brand text-inverted hover:bg-brand-hover"
              onClick={submitQuestion}
            >
              نشر السؤال
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setAskOpen(false)}
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
