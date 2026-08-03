"use client";

import { ChevronDownIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { ADMIN_MEDIA_SIZES, mediaSizeHint } from "@/lib/admin-media-sizes";
import { MediaUploader } from "@/components/admin/media-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  emptyCourseWatchContent,
  emptyWatchAttachment,
  emptyWatchLesson,
  emptyWatchSection,
  parseCourseWatchContent,
  recomputeCourseWatchMeta,
  type CourseWatchAttachment,
  type CourseWatchContent,
  type CourseWatchLesson,
  type CourseWatchSection,
} from "@/lib/course-watch";
import { cn } from "@/lib/utils";

function formatWatchDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** يقرأ مدة الفيديو من الرابط عبر metadata في المتصفح */
function readVideoDurationSeconds(url: string): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      video.removeAttribute("src");
      video.load();
      video.remove();
    };

    const fail = () => {
      cleanup();
      resolve(null);
    };

    video.onloadedmetadata = () => {
      const duration = video.duration;
      cleanup();
      if (!Number.isFinite(duration) || duration <= 0) {
        resolve(null);
        return;
      }
      resolve(duration);
    };
    video.onerror = fail;
    window.setTimeout(fail, 12000);
    video.src = url;
  });
}

export function normalizeCourseWatch(value: unknown): CourseWatchContent {
  return parseCourseWatchContent(value ?? emptyCourseWatchContent(), {
    keepEmpty: true,
  });
}

export function cleanCourseWatchValue(value: unknown): CourseWatchContent {
  const parsed = parseCourseWatchContent(value);
  return recomputeCourseWatchMeta({
    ...parsed,
    sections: parsed.sections
      .map((section) => ({
        ...section,
        lessons: section.lessons
          .map((lesson) => ({
            ...lesson,
            attachments: lesson.attachments.filter((att) => att.url.trim()),
          }))
          .filter((lesson) => lesson.title.trim()),
      }))
      .filter((section) => section.title.trim() && section.lessons.length > 0),
  });
}

function updateAt<T>(rows: T[], index: number, patch: Partial<T>): T[] {
  return rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
}

export function CourseWatchEditor({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: unknown;
  onChange: (value: CourseWatchContent) => void;
  disabled?: boolean;
}) {
  const content = normalizeCourseWatch(value);
  const contentRef = useRef(content);
  contentRef.current = content;
  const [openSections, setOpenSections] = useState<string[]>(() =>
    content.sections.map((s) => s.id),
  );

  function patch(partial: Partial<CourseWatchContent>) {
    onChange({ ...content, ...partial });
  }

  function setSections(sections: CourseWatchSection[]) {
    patch({ sections });
  }

  function patchSection(index: number, partial: Partial<CourseWatchSection>) {
    setSections(updateAt(content.sections, index, partial));
  }

  function patchLesson(
    sectionIndex: number,
    lessonIndex: number,
    partial: Partial<CourseWatchLesson>,
  ) {
    const section = content.sections[sectionIndex];
    if (!section) return;
    patchSection(sectionIndex, {
      lessons: updateAt(section.lessons, lessonIndex, partial),
    });
  }

  function patchAttachment(
    sectionIndex: number,
    lessonIndex: number,
    attachmentIndex: number,
    partial: Partial<CourseWatchAttachment>,
  ) {
    const lesson = content.sections[sectionIndex]?.lessons[lessonIndex];
    if (!lesson) return;
    patchLesson(sectionIndex, lessonIndex, {
      attachments: updateAt(lesson.attachments, attachmentIndex, partial),
    });
  }

  async function setLessonVideo(
    sectionIndex: number,
    lessonIndex: number,
    videoUrl: string,
  ) {
    const trimmed = videoUrl.trim();
    if (!trimmed) {
      patchLesson(sectionIndex, lessonIndex, {
        videoUrl: "",
        duration: "00:00",
        durationSeconds: 0,
        type: "video",
      });
      return;
    }

    patchLesson(sectionIndex, lessonIndex, {
      videoUrl: trimmed,
      type: "video",
    });

    const seconds = await readVideoDurationSeconds(trimmed);
    const latest = contentRef.current;
    const section = latest.sections[sectionIndex];
    const lesson = section?.lessons[lessonIndex];
    if (!section || !lesson || lesson.videoUrl.trim() !== trimmed) return;

    if (seconds == null) {
      onChange({
        ...latest,
        sections: updateAt(latest.sections, sectionIndex, {
          lessons: updateAt(section.lessons, lessonIndex, {
            duration: "00:00",
            durationSeconds: 0,
          }),
        }),
      });
      return;
    }

    const durationSeconds = Math.round(seconds);
    onChange({
      ...latest,
      sections: updateAt(latest.sections, sectionIndex, {
        lessons: updateAt(section.lessons, lessonIndex, {
          durationSeconds,
          duration: formatWatchDuration(durationSeconds),
        }),
      }),
    });
  }

  function toggleSection(id: string) {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((row) => row !== id) : [...prev, id],
    );
  }

  return (
    <div className="space-y-5 rounded-xl border bg-card p-4">
      <div>
        <Label className="text-base">{label}</Label>
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="عنوان الدورة في المشغّل">
          <Input
            disabled={disabled}
            value={content.course.title}
            placeholder="يُملأ تلقائياً من عنوان المنتج إن تُرك فارغاً"
            onChange={(e) =>
              patch({ course: { ...content.course, title: e.target.value } })
            }
          />
        </Field>
        <Field label="وصف قصير للدورة">
          <Input
            disabled={disabled}
            value={content.course.subtitle}
            onChange={(e) =>
              patch({
                course: { ...content.course, subtitle: e.target.value },
              })
            }
          />
        </Field>
      </div>

      <MediaUploader
        label="صورة افتراضية للمشغّل (عند عدم وجود بوستر للدرس)"
        value={content.player.emptyPosterUrl}
        onChange={(emptyPosterUrl) =>
          patch({ player: { ...content.player, emptyPosterUrl } })
        }
        disabled={disabled}
        folder="course-watch"
        accept="image"
        hint={mediaSizeHint(ADMIN_MEDIA_SIZES.watchPoster)}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">المحاور والدروس</p>
          <p className="text-xs text-muted-foreground">
            أضف محوراً، ثم أضف دروساً داخله مع الفيديو والملحقات.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={disabled}
          className="gap-1.5"
          onClick={() => {
            const section = emptyWatchSection();
            setSections([...content.sections, section]);
            setOpenSections((prev) => [...prev, section.id]);
          }}
        >
          <PlusIcon className="size-4" />
          إضافة محور
        </Button>
      </div>

      {content.sections.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          لا توجد محاور بعد. ابدأ بإضافة أول محور للدورة.
        </p>
      ) : null}

      <div className="space-y-3">
        {content.sections.map((section, sectionIndex) => {
          const open = openSections.includes(section.id);
          return (
            <div
              key={section.id}
              className="overflow-hidden rounded-xl border bg-background"
            >
              <div className="flex items-start gap-2 border-b bg-muted/30 p-3">
                <button
                  type="button"
                  className="mt-2 text-muted-foreground"
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={open}
                >
                  <ChevronDownIcon
                    className={cn(
                      "size-4 transition-transform",
                      open ? "rotate-180" : "",
                    )}
                  />
                </button>
                <div className="min-w-0 flex-1 space-y-2">
                  <Input
                    disabled={disabled}
                    value={section.title}
                    placeholder={`عنوان المحور ${sectionIndex + 1}`}
                    onChange={(e) =>
                      patchSection(sectionIndex, { title: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {section.lessons.length} درس
                  </p>
                </div>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="destructive"
                  disabled={disabled}
                  onClick={() =>
                    setSections(
                      content.sections.filter((_, i) => i !== sectionIndex),
                    )
                  }
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>

              {open ? (
                <div className="space-y-3 p-3">
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={disabled}
                      className="gap-1.5"
                      onClick={() =>
                        patchSection(sectionIndex, {
                          lessons: [...section.lessons, emptyWatchLesson()],
                        })
                      }
                    >
                      <PlusIcon className="size-4" />
                      إضافة درس
                    </Button>
                  </div>

                  {section.lessons.length === 0 ? (
                    <p className="rounded-lg bg-muted/40 px-3 py-6 text-center text-sm text-muted-foreground">
                      لا دروس في هذا المحور بعد.
                    </p>
                  ) : null}

                  {section.lessons.map((lesson, lessonIndex) => (
                    <div
                      key={lesson.id}
                      className="space-y-3 rounded-lg border p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">
                          درس {lessonIndex + 1}
                        </p>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="destructive"
                          disabled={disabled}
                          onClick={() =>
                            patchSection(sectionIndex, {
                              lessons: section.lessons.filter(
                                (_, i) => i !== lessonIndex,
                              ),
                            })
                          }
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      </div>

                      <Field label="عنوان الدرس">
                        <Input
                          disabled={disabled}
                          value={lesson.title}
                          placeholder="عنوان الدرس"
                          onChange={(e) =>
                            patchLesson(sectionIndex, lessonIndex, {
                              title: e.target.value,
                            })
                          }
                        />
                      </Field>

                      <Field label="وصف الدرس">
                        <Textarea
                          rows={3}
                          disabled={disabled}
                          value={lesson.description}
                          placeholder="ماذا سيتعلم الطالب في هذا الدرس؟"
                          onChange={(e) =>
                            patchLesson(sectionIndex, lessonIndex, {
                              description: e.target.value,
                            })
                          }
                        />
                      </Field>

                      <div className="space-y-2">
                        <MediaUploader
                          label="فيديو الدرس"
                          value={lesson.videoUrl}
                          onChange={(videoUrl) =>
                            void setLessonVideo(
                              sectionIndex,
                              lessonIndex,
                              videoUrl,
                            )
                          }
                          disabled={disabled}
                          folder="course-lessons"
                          accept="video"
                          hint="MP4 أو WebM — تُحسب مدة الدرس تلقائياً من الفيديو"
                        />
                        {lesson.videoUrl ? (
                          <p className="text-xs text-muted-foreground">
                            مدة الدرس:{" "}
                            <span className="font-medium text-foreground" dir="ltr">
                              {lesson.durationSeconds > 0
                                ? lesson.duration
                                : "—"}
                            </span>
                          </p>
                        ) : null}
                      </div>

                      <MediaUploader
                        label="صورة مصغّرة للدرس (اختياري)"
                        value={lesson.posterUrl}
                        onChange={(posterUrl) =>
                          patchLesson(sectionIndex, lessonIndex, { posterUrl })
                        }
                        disabled={disabled}
                        folder="course-lessons"
                        accept="image"
                        hint={mediaSizeHint(ADMIN_MEDIA_SIZES.lessonPoster)}
                      />

                      <div className="space-y-2 rounded-lg border border-dashed p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">الملحقات</p>
                            <p className="text-xs text-muted-foreground">
                              ملفات PDF/ZIP أو روابط خارجية مرتبطة بالدرس.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={disabled}
                              onClick={() =>
                                patchLesson(sectionIndex, lessonIndex, {
                                  attachments: [
                                    ...lesson.attachments,
                                    {
                                      ...emptyWatchAttachment(),
                                      kind: "file",
                                    },
                                  ],
                                })
                              }
                            >
                              إضافة ملف
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={disabled}
                              onClick={() =>
                                patchLesson(sectionIndex, lessonIndex, {
                                  attachments: [
                                    ...lesson.attachments,
                                    emptyWatchAttachment(),
                                  ],
                                })
                              }
                            >
                              إضافة رابط
                            </Button>
                          </div>
                        </div>

                        {lesson.attachments.map((att, attIndex) => (
                          <div
                            key={att.id}
                            className="space-y-2 rounded-md border bg-card p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-muted-foreground">
                                {att.kind === "file" ? "ملف" : "رابط"}
                              </p>
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="ghost"
                                disabled={disabled}
                                onClick={() =>
                                  patchLesson(sectionIndex, lessonIndex, {
                                    attachments: lesson.attachments.filter(
                                      (_, i) => i !== attIndex,
                                    ),
                                  })
                                }
                              >
                                <Trash2Icon className="size-4" />
                              </Button>
                            </div>
                            <Input
                              disabled={disabled}
                              value={att.title}
                              placeholder="اسم الملحق"
                              onChange={(e) =>
                                patchAttachment(
                                  sectionIndex,
                                  lessonIndex,
                                  attIndex,
                                  { title: e.target.value },
                                )
                              }
                            />
                            {att.kind === "file" ? (
                              <MediaUploader
                                label="رفع الملف"
                                value={att.url}
                                onChange={(url) =>
                                  patchAttachment(
                                    sectionIndex,
                                    lessonIndex,
                                    attIndex,
                                    { url, kind: "file" },
                                  )
                                }
                                disabled={disabled}
                                folder="course-attachments"
                                accept="file"
                              />
                            ) : (
                              <Input
                                disabled={disabled}
                                value={att.url}
                                placeholder="https://…"
                                dir="ltr"
                                onChange={(e) =>
                                  patchAttachment(
                                    sectionIndex,
                                    lessonIndex,
                                    attIndex,
                                    { url: e.target.value, kind: "link" },
                                  )
                                }
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
