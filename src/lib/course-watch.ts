/**
 * أنواع ومساعدات صفحة مشاهدة الدورة (LMS).
 * الهيكل المرجعي: src/data/course-watch-template.json
 */
import template from "@/data/course-watch-template.json";

export type CourseWatchLessonType = "video" | "file";

export type CourseWatchAttachment = {
  id: string;
  title: string;
  url: string;
  kind: "file" | "link";
};

export type CourseWatchLesson = {
  id: string;
  title: string;
  description: string;
  duration: string;
  durationSeconds: number;
  type: CourseWatchLessonType;
  videoUrl: string;
  posterUrl: string;
  /** @deprecated استخدم attachments — يُبقى للتوافق */
  fileUrl: string;
  attachments: CourseWatchAttachment[];
};

export type CourseWatchSection = {
  id: string;
  title: string;
  lessonsCountLabel: string;
  durationLabel: string;
  lessons: CourseWatchLesson[];
};

export type CourseWatchQaFilter = {
  id: string;
  label: string;
};

export type CourseWatchContent = {
  course: {
    title: string;
    subtitle: string;
    totalLessons: number;
    totalDurationLabel: string;
    totalDurationMinutes: number;
  };
  player: {
    emptyPosterUrl: string;
    emptyMessage: string;
  };
  actions: {
    exitLabel: string;
    completeLessonLabel: string;
    rateCourseLabel: string;
    askQuestionLabel: string;
  };
  tabs: {
    qa: {
      id: string;
      label: string;
      enabled: boolean;
      emptyTitle: string;
      emptyDescription: string;
      filters: CourseWatchQaFilter[];
      searchPlaceholder: string;
    };
    certificate: {
      id: string;
      label: string;
      enabled: boolean;
      title: string;
      description: string;
      lockedMessage: string;
      downloadLabel: string;
    };
  };
  sidebar: {
    title: string;
    progressLabel: string;
  };
  sections: CourseWatchSection[];
};

export type ParseCourseWatchOptions = {
  /** للاحتفاظ بالعناصر الفارجة أثناء التحرير في لوحة التحكم */
  keepEmpty?: boolean;
};

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function newWatchId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyWatchAttachment(): CourseWatchAttachment {
  return {
    id: newWatchId("att"),
    title: "",
    url: "",
    kind: "link",
  };
}

export function emptyWatchLesson(): CourseWatchLesson {
  return {
    id: newWatchId("les"),
    title: "",
    description: "",
    duration: "00:00",
    durationSeconds: 0,
    type: "video",
    videoUrl: "",
    posterUrl: "",
    fileUrl: "",
    attachments: [],
  };
}

export function emptyWatchSection(): CourseWatchSection {
  return {
    id: newWatchId("sec"),
    title: "",
    lessonsCountLabel: "٠ دروس",
    durationLabel: "",
    lessons: [],
  };
}

function parseDurationSeconds(duration: string, fallback: number) {
  if (fallback > 0) return fallback;
  const parts = duration.split(":").map((p) => Number(p));
  if (parts.length === 2 && parts.every((n) => Number.isFinite(n))) {
    return parts[0]! * 60 + parts[1]!;
  }
  if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
    return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
  }
  return 0;
}

function formatDurationLabel(totalSeconds: number) {
  if (totalSeconds <= 0) return "";
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 60) return `${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem > 0 ? `${hours} ساعة و ${rem} دقيقة` : `${hours} ساعة`;
}

function lessonsCountLabel(count: number) {
  if (count === 0) return "٠ دروس";
  if (count === 1) return "درس واحد";
  if (count === 2) return "درسان";
  if (count >= 3 && count <= 10) return `${count} دروس`;
  return `${count} درساً`;
}

function asAttachment(
  value: unknown,
  options?: ParseCourseWatchOptions,
): CourseWatchAttachment | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const id = asString(item.id).trim() || (options?.keepEmpty ? newWatchId("att") : "");
  const title = asString(item.title).trim();
  const url = asString(item.url).trim();
  if (!options?.keepEmpty && (!id || !url)) return null;
  if (!id) return null;
  return {
    id,
    title,
    url,
    kind: asString(item.kind) === "file" ? "file" : "link",
  };
}

function asLesson(
  value: unknown,
  options?: ParseCourseWatchOptions,
): CourseWatchLesson | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const id = asString(item.id).trim() || (options?.keepEmpty ? newWatchId("les") : "");
  const title = asString(item.title).trim();
  if (!options?.keepEmpty && (!id || !title)) return null;
  if (!id) return null;

  const type = asString(item.type) === "file" ? "file" : "video";
  const duration = asString(item.duration) || "00:00";
  const durationSeconds = parseDurationSeconds(
    duration,
    asNumber(item.durationSeconds),
  );
  const fileUrl = asString(item.fileUrl);
  let attachments = Array.isArray(item.attachments)
    ? item.attachments
        .map((row) => asAttachment(row, options))
        .filter((row): row is CourseWatchAttachment => Boolean(row))
    : [];

  if (attachments.length === 0 && fileUrl) {
    attachments = [
      {
        id: newWatchId("att"),
        title: "ملحق",
        url: fileUrl,
        kind: "file",
      },
    ];
  }

  return {
    id,
    title,
    description: asString(item.description),
    duration,
    durationSeconds,
    type,
    videoUrl: asString(item.videoUrl),
    posterUrl: asString(item.posterUrl),
    fileUrl,
    attachments,
  };
}

function asSection(
  value: unknown,
  options?: ParseCourseWatchOptions,
): CourseWatchSection | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const id = asString(item.id).trim() || (options?.keepEmpty ? newWatchId("sec") : "");
  const title = asString(item.title).trim();
  if (!options?.keepEmpty && (!id || !title)) return null;
  if (!id) return null;
  const lessons = Array.isArray(item.lessons)
    ? item.lessons
        .map((row) => asLesson(row, options))
        .filter((row): row is CourseWatchLesson => Boolean(row))
    : [];
  return {
    id,
    title,
    lessonsCountLabel: asString(item.lessonsCountLabel),
    durationLabel: asString(item.durationLabel),
    lessons,
  };
}

export function emptyCourseWatchContent(): CourseWatchContent {
  return {
    course: {
      title: "",
      subtitle: "",
      totalLessons: 0,
      totalDurationLabel: "",
      totalDurationMinutes: 0,
    },
    player: {
      emptyPosterUrl: "",
      emptyMessage: "اختر درساً من قائمة المحتوى للبدء",
    },
    actions: {
      exitLabel: "خروج",
      completeLessonLabel: "إكمال الدرس",
      rateCourseLabel: "قيّم الدورة",
      askQuestionLabel: "اطرح سؤالاً",
    },
    tabs: {
      qa: {
        id: "qa",
        label: "الأسئلة والأجوبة",
        enabled: true,
        emptyTitle: "لا توجد أسئلة بعد",
        emptyDescription: "كن أول من يسأل حول هذا الدرس أو الدورة.",
        filters: [
          { id: "lesson", label: "هذا الدرس" },
          { id: "course", label: "كل الدورة" },
          { id: "top", label: "الأعلى تصويتاً" },
        ],
        searchPlaceholder: "ابحث في الأسئلة…",
      },
      certificate: {
        id: "certificate",
        label: "الشهادة",
        enabled: true,
        title: "شهادة إتمام الدورة",
        description: "ستتوفر الشهادة بعد إكمال جميع دروس الدورة.",
        lockedMessage: "أكمل كل الدروس لفتح الشهادة",
        downloadLabel: "تحميل الشهادة",
      },
    },
    sidebar: {
      title: "محتوى الدورة",
      progressLabel: "قيد التعلّم",
    },
    sections: [],
  };
}

/** يعيد حساب عدد الدروس والمدد من المحاور */
export function recomputeCourseWatchMeta(
  content: CourseWatchContent,
): CourseWatchContent {
  const sections = content.sections.map((section) => {
    const totalSeconds = section.lessons.reduce(
      (sum, lesson) =>
        sum +
        parseDurationSeconds(lesson.duration, lesson.durationSeconds),
      0,
    );
    return {
      ...section,
      lessonsCountLabel: lessonsCountLabel(section.lessons.length),
      durationLabel: formatDurationLabel(totalSeconds),
      lessons: section.lessons.map((lesson) => ({
        ...lesson,
        durationSeconds: parseDurationSeconds(
          lesson.duration,
          lesson.durationSeconds,
        ),
        type: lesson.videoUrl ? "video" : lesson.type,
        fileUrl: lesson.attachments[0]?.url || lesson.fileUrl || "",
      })),
    };
  });

  const allLessons = sections.flatMap((section) => section.lessons);
  const totalSeconds = allLessons.reduce(
    (sum, lesson) => sum + lesson.durationSeconds,
    0,
  );

  return {
    ...content,
    sections,
    course: {
      ...content.course,
      totalLessons: allLessons.length,
      totalDurationMinutes: Math.round(totalSeconds / 60),
      totalDurationLabel: formatDurationLabel(totalSeconds),
    },
  };
}

export function parseCourseWatchContent(
  value: unknown,
  options?: ParseCourseWatchOptions,
): CourseWatchContent {
  const empty = emptyCourseWatchContent();
  if (!value || typeof value !== "object") return empty;
  const raw = value as Record<string, unknown>;
  const course =
    raw.course && typeof raw.course === "object"
      ? (raw.course as Record<string, unknown>)
      : {};
  const player =
    raw.player && typeof raw.player === "object"
      ? (raw.player as Record<string, unknown>)
      : {};
  const actions =
    raw.actions && typeof raw.actions === "object"
      ? (raw.actions as Record<string, unknown>)
      : {};
  const tabs =
    raw.tabs && typeof raw.tabs === "object"
      ? (raw.tabs as Record<string, unknown>)
      : {};
  const qa =
    tabs.qa && typeof tabs.qa === "object"
      ? (tabs.qa as Record<string, unknown>)
      : {};
  const certificate =
    tabs.certificate && typeof tabs.certificate === "object"
      ? (tabs.certificate as Record<string, unknown>)
      : {};
  const sidebar =
    raw.sidebar && typeof raw.sidebar === "object"
      ? (raw.sidebar as Record<string, unknown>)
      : {};

  const sections = Array.isArray(raw.sections)
    ? raw.sections
        .map((row) => asSection(row, options))
        .filter((row): row is CourseWatchSection => Boolean(row))
    : [];

  const parsed: CourseWatchContent = {
    course: {
      title: asString(course.title) || empty.course.title,
      subtitle: asString(course.subtitle) || empty.course.subtitle,
      totalLessons: asNumber(course.totalLessons),
      totalDurationLabel:
        asString(course.totalDurationLabel) || empty.course.totalDurationLabel,
      totalDurationMinutes: asNumber(course.totalDurationMinutes),
    },
    player: {
      emptyPosterUrl:
        asString(player.emptyPosterUrl) || empty.player.emptyPosterUrl,
      emptyMessage: asString(player.emptyMessage) || empty.player.emptyMessage,
    },
    actions: {
      exitLabel: asString(actions.exitLabel) || empty.actions.exitLabel,
      completeLessonLabel:
        asString(actions.completeLessonLabel) ||
        empty.actions.completeLessonLabel,
      rateCourseLabel:
        asString(actions.rateCourseLabel) || empty.actions.rateCourseLabel,
      askQuestionLabel:
        asString(actions.askQuestionLabel) || empty.actions.askQuestionLabel,
    },
    tabs: {
      qa: {
        id: asString(qa.id) || "qa",
        label: asString(qa.label) || empty.tabs.qa.label,
        enabled: qa.enabled !== false,
        emptyTitle: asString(qa.emptyTitle) || empty.tabs.qa.emptyTitle,
        emptyDescription:
          asString(qa.emptyDescription) || empty.tabs.qa.emptyDescription,
        filters: Array.isArray(qa.filters)
          ? qa.filters
              .map((row) => {
                if (!row || typeof row !== "object") return null;
                const item = row as Record<string, unknown>;
                const id = asString(item.id).trim();
                const label = asString(item.label).trim();
                if (!id || !label) return null;
                return { id, label };
              })
              .filter((row): row is CourseWatchQaFilter => Boolean(row))
          : empty.tabs.qa.filters,
        searchPlaceholder:
          asString(qa.searchPlaceholder) || empty.tabs.qa.searchPlaceholder,
      },
      certificate: {
        id: asString(certificate.id) || "certificate",
        label: asString(certificate.label) || empty.tabs.certificate.label,
        enabled: certificate.enabled !== false,
        title: asString(certificate.title) || empty.tabs.certificate.title,
        description:
          asString(certificate.description) ||
          empty.tabs.certificate.description,
        lockedMessage:
          asString(certificate.lockedMessage) ||
          empty.tabs.certificate.lockedMessage,
        downloadLabel:
          asString(certificate.downloadLabel) ||
          empty.tabs.certificate.downloadLabel,
      },
    },
    sidebar: {
      title: asString(sidebar.title) || empty.sidebar.title,
      progressLabel:
        asString(sidebar.progressLabel) || empty.sidebar.progressLabel,
    },
    sections,
  };

  return options?.keepEmpty ? parsed : recomputeCourseWatchMeta(parsed);
}

export function defaultCourseWatchContent(
  title?: string,
): CourseWatchContent {
  const base = parseCourseWatchContent(template);
  if (!title?.trim()) return base;
  return {
    ...base,
    course: {
      ...base.course,
      title: title.trim(),
    },
  };
}

export function flattenWatchLessons(content: CourseWatchContent) {
  return content.sections.flatMap((section) =>
    section.lessons.map((lesson) => ({ section, lesson })),
  );
}

export function progressStorageKey(productId: string, customerId: string) {
  return `montader-course-progress:${productId}:${customerId}`;
}

/** روابط الملحقات المعروضة للطالب */
export function lessonAttachments(lesson: CourseWatchLesson) {
  if (lesson.attachments.length > 0) return lesson.attachments;
  if (lesson.fileUrl) {
    return [
      {
        id: `${lesson.id}-file`,
        title: "ملحق",
        url: lesson.fileUrl,
        kind: "file" as const,
      },
    ];
  }
  return [];
}
