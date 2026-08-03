"use client";

import type { ReactNode } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import {
  emptyCourseDetail,
  parseCourseDetail,
  COURSE_ICON_OPTIONS,
  type CourseDetailContent,
  type CourseIconName,
} from "@/lib/course-detail";
import { ADMIN_MEDIA_SIZES, mediaSizeHint } from "@/lib/admin-media-sizes";
import { MediaUploader } from "@/components/admin/media-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** للمحرر: يحتفظ بالعناصر الفارغة حتى يُملأ الحقل */
export function normalizeCourseDetail(value: unknown): CourseDetailContent {
  return parseCourseDetail(value ?? emptyCourseDetail(), { keepEmpty: true });
}

/** عند الحفظ: يحذف العناصر الفارغة غير المكتملة */
export function cleanCourseDetailValue(value: unknown): CourseDetailContent {
  return parseCourseDetail(value);
}

function updateAt<T>(rows: T[], index: number, patch: Partial<T>): T[] {
  return rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
}

export function CourseDetailEditor({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: unknown;
  onChange: (value: CourseDetailContent) => void;
  disabled?: boolean;
}) {
  const detail = normalizeCourseDetail(value);

  function patch(partial: Partial<CourseDetailContent>) {
    onChange({ ...detail, ...partial });
  }

  function patchSection<K extends Exclude<keyof CourseDetailContent, "stats">>(
    key: K,
    partial: Partial<CourseDetailContent[K]>,
  ) {
    patch({ [key]: { ...detail[key], ...partial } } as Pick<
      CourseDetailContent,
      K
    >);
  }

  return (
    <div className="space-y-5 rounded-xl border bg-card p-4">
      <div>
        <Label className="text-base">{label}</Label>
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>

      <Section title="رأس الصفحة">
        <Field label="شريط تنبيه أعلى العنوان">
          <Textarea
            rows={2}
            disabled={disabled}
            value={detail.hero.notice}
            onChange={(e) => patchSection("hero", { notice: e.target.value })}
          />
        </Field>
        <Field label="العنوان الرئيسي">
          <Textarea
            rows={2}
            disabled={disabled}
            value={detail.hero.title}
            onChange={(e) => patchSection("hero", { title: e.target.value })}
          />
        </Field>
        <Field label="النص الداعم تحت العنوان">
          <Textarea
            rows={2}
            disabled={disabled}
            value={detail.hero.subtitle}
            onChange={(e) =>
              patchSection("hero", { subtitle: e.target.value })
            }
          />
        </Field>
        <IconLabelListEditor
          label="ميزات الشريط تحت العنوان"
          hint="مثل: ٤٠ درس مسجل"
          items={detail.hero.features}
          disabled={disabled}
          onChange={(features) => patchSection("hero", { features })}
        />
        <MediaUploader
          label="فيديو تعريفي عن الدورة"
          value={detail.hero.introVideoUrl}
          onChange={(introVideoUrl) =>
            patchSection("hero", { introVideoUrl })
          }
          disabled={disabled}
          folder="courses"
          accept="video"
          hint="يظهر تحت العنوان في صفحة التفاصيل. إن تُرك فارغاً لن يظهر القسم."
        />
        <MediaUploader
          label="صورة رأس الصفحة"
          value={detail.hero.imageUrl}
          onChange={(imageUrl) => patchSection("hero", { imageUrl })}
          disabled={disabled}
          folder="courses"
          accept="image"
          hint={mediaSizeHint(ADMIN_MEDIA_SIZES.courseHero)}
        />
      </Section>

      <Section title="الإحصائيات">
        <ListActions
          disabled={disabled}
          onAdd={() =>
            patch({
              stats: [
                ...detail.stats,
                {
                  value: "",
                  prefix: "",
                  suffix: "",
                  label: "",
                  description: "",
                },
              ],
            })
          }
        />
        {detail.stats.map((stat, index) => (
          <div key={index} className="space-y-2 rounded-lg border p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="القيمة مثل ٢٨٠"
                disabled={disabled}
                value={stat.value}
                onChange={(e) =>
                  patch({
                    stats: updateAt(detail.stats, index, {
                      value: e.target.value,
                    }),
                  })
                }
              />
              <Input
                placeholder="التسمية"
                disabled={disabled}
                value={stat.label}
                onChange={(e) =>
                  patch({
                    stats: updateAt(detail.stats, index, {
                      label: e.target.value,
                    }),
                  })
                }
              />
              <Input
                placeholder="بادئة (اختياري)"
                disabled={disabled}
                value={stat.prefix}
                onChange={(e) =>
                  patch({
                    stats: updateAt(detail.stats, index, {
                      prefix: e.target.value,
                    }),
                  })
                }
              />
              <Input
                placeholder="لاحقة (اختياري)"
                disabled={disabled}
                value={stat.suffix}
                onChange={(e) =>
                  patch({
                    stats: updateAt(detail.stats, index, {
                      suffix: e.target.value,
                    }),
                  })
                }
              />
            </div>
            <Textarea
              rows={2}
              placeholder="الوصف"
              disabled={disabled}
              value={stat.description}
              onChange={(e) =>
                patch({
                  stats: updateAt(detail.stats, index, {
                    description: e.target.value,
                  }),
                })
              }
            />
            <RemoveRow
              disabled={disabled}
              onClick={() =>
                patch({ stats: detail.stats.filter((_, i) => i !== index) })
              }
            />
          </div>
        ))}
      </Section>

      <Section title="المهارات">
        <Field label="تسمية صغيرة">
          <Input
            disabled={disabled}
            value={detail.skills.eyebrow}
            onChange={(e) =>
              patchSection("skills", { eyebrow: e.target.value })
            }
          />
        </Field>
        <Field label="عنوان المهارات">
          <Input
            disabled={disabled}
            value={detail.skills.title}
            onChange={(e) =>
              patchSection("skills", { title: e.target.value })
            }
          />
        </Field>
        <Field label="وصف المهارات">
          <Textarea
            rows={3}
            disabled={disabled}
            value={detail.skills.description}
            onChange={(e) =>
              patchSection("skills", { description: e.target.value })
            }
          />
        </Field>
        <StringListEditor
          label="وسوم المهارات"
          value={detail.skills.tags}
          disabled={disabled}
          onChange={(tags) => patchSection("skills", { tags })}
        />
        <ImageListEditor
          label="صور المهارات"
          images={detail.skills.images}
          disabled={disabled}
          folder="courses"
          onChange={(images) => patchSection("skills", { images })}
        />
      </Section>

      <Section title="المنهجية">
        <Field label="تسمية صغيرة">
          <Input
            disabled={disabled}
            value={detail.methodology.eyebrow}
            onChange={(e) =>
              patchSection("methodology", { eyebrow: e.target.value })
            }
          />
        </Field>
        <Field label="عنوان المنهجية">
          <Input
            disabled={disabled}
            value={detail.methodology.title}
            onChange={(e) =>
              patchSection("methodology", { title: e.target.value })
            }
          />
        </Field>
        <Field label="وصف المنهجية">
          <Textarea
            rows={3}
            disabled={disabled}
            value={detail.methodology.description}
            onChange={(e) =>
              patchSection("methodology", { description: e.target.value })
            }
          />
        </Field>
        <StringListEditor
          label="وسوم المنهجية"
          value={detail.methodology.tags}
          disabled={disabled}
          onChange={(tags) => patchSection("methodology", { tags })}
        />
        <ImageListEditor
          label="صور المنهجية"
          images={detail.methodology.images}
          disabled={disabled}
          folder="courses"
          onChange={(images) => patchSection("methodology", { images })}
        />
      </Section>

      <Section title="مواضيع ممنهجة">
        <Field label="تسمية صغيرة">
          <Input
            disabled={disabled}
            value={detail.modulesSection.eyebrow}
            onChange={(e) =>
              patchSection("modulesSection", { eyebrow: e.target.value })
            }
          />
        </Field>
        <Field label="عنوان القسم">
          <Input
            disabled={disabled}
            value={detail.modulesSection.title}
            onChange={(e) =>
              patchSection("modulesSection", { title: e.target.value })
            }
          />
        </Field>
        <Field label="وصف القسم">
          <Textarea
            rows={2}
            disabled={disabled}
            value={detail.modulesSection.description}
            onChange={(e) =>
              patchSection("modulesSection", { description: e.target.value })
            }
          />
        </Field>
        <ListActions
          disabled={disabled}
          onAdd={() =>
            patchSection("modulesSection", {
              modules: [
                ...detail.modulesSection.modules,
                {
                  label: "",
                  title: "",
                  description: "",
                  lessonsLabel: "دروس المحور",
                  lessons: [],
                  imageUrl: "",
                },
              ],
            })
          }
        />
        {detail.modulesSection.modules.map((module, index) => (
          <div key={index} className="space-y-3 rounded-lg border p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="المحور الأول"
                disabled={disabled}
                value={module.label}
                onChange={(e) =>
                  patchSection("modulesSection", {
                    modules: updateAt(detail.modulesSection.modules, index, {
                      label: e.target.value,
                    }),
                  })
                }
              />
              <Input
                placeholder="عنوان المحور"
                disabled={disabled}
                value={module.title}
                onChange={(e) =>
                  patchSection("modulesSection", {
                    modules: updateAt(detail.modulesSection.modules, index, {
                      title: e.target.value,
                    }),
                  })
                }
              />
            </div>
            <Textarea
              rows={2}
              placeholder="وصف المحور"
              disabled={disabled}
              value={module.description}
              onChange={(e) =>
                patchSection("modulesSection", {
                  modules: updateAt(detail.modulesSection.modules, index, {
                    description: e.target.value,
                  }),
                })
              }
            />
            <Input
              placeholder="تسمية الدروس"
              disabled={disabled}
              value={module.lessonsLabel}
              onChange={(e) =>
                patchSection("modulesSection", {
                  modules: updateAt(detail.modulesSection.modules, index, {
                    lessonsLabel: e.target.value,
                  }),
                })
              }
            />
            <StringListEditor
              label="الدروس"
              value={module.lessons}
              disabled={disabled}
              onChange={(lessons) =>
                patchSection("modulesSection", {
                  modules: updateAt(detail.modulesSection.modules, index, {
                    lessons,
                  }),
                })
              }
            />
            <MediaUploader
              label="صورة المحور"
              value={module.imageUrl}
              disabled={disabled}
              folder="courses"
              accept="image"
              hint={mediaSizeHint(ADMIN_MEDIA_SIZES.courseModule)}
              onChange={(imageUrl) =>
                patchSection("modulesSection", {
                  modules: updateAt(detail.modulesSection.modules, index, {
                    imageUrl,
                  }),
                })
              }
            />
            <RemoveRow
              disabled={disabled}
              onClick={() =>
                patchSection("modulesSection", {
                  modules: detail.modulesSection.modules.filter(
                    (_, i) => i !== index,
                  ),
                })
              }
            />
          </div>
        ))}
      </Section>

      <Section title="بالإضافة الى">
        <Field label="عنوان القسم">
          <Input
            disabled={disabled}
            value={detail.bonuses.title}
            onChange={(e) =>
              patchSection("bonuses", { title: e.target.value })
            }
          />
        </Field>
        <IconLabelListEditor
          label="عناصر الإضافات"
          items={detail.bonuses.items}
          disabled={disabled}
          onChange={(items) => patchSection("bonuses", { items })}
        />
      </Section>

      <Section title="دورة تفاعلية">
        <Field label="تسمية صغيرة">
          <Input
            disabled={disabled}
            value={detail.interactive.eyebrow}
            onChange={(e) =>
              patchSection("interactive", { eyebrow: e.target.value })
            }
          />
        </Field>
        <Field label="العنوان">
          <Input
            disabled={disabled}
            value={detail.interactive.title}
            onChange={(e) =>
              patchSection("interactive", { title: e.target.value })
            }
          />
        </Field>
        <Field label="الوصف">
          <Textarea
            rows={2}
            disabled={disabled}
            value={detail.interactive.description}
            onChange={(e) =>
              patchSection("interactive", { description: e.target.value })
            }
          />
        </Field>
        <ListActions
          disabled={disabled}
          onAdd={() =>
            patchSection("interactive", {
              items: [
                ...detail.interactive.items,
                { title: "", description: "" },
              ],
            })
          }
        />
        {detail.interactive.items.map((item, index) => (
          <div key={index} className="space-y-2 rounded-lg border p-3">
            <Input
              placeholder="العنوان"
              disabled={disabled}
              value={item.title}
              onChange={(e) =>
                patchSection("interactive", {
                  items: updateAt(detail.interactive.items, index, {
                    title: e.target.value,
                  }),
                })
              }
            />
            <Textarea
              rows={2}
              placeholder="الوصف"
              disabled={disabled}
              value={item.description}
              onChange={(e) =>
                patchSection("interactive", {
                  items: updateAt(detail.interactive.items, index, {
                    description: e.target.value,
                  }),
                })
              }
            />
            <RemoveRow
              disabled={disabled}
              onClick={() =>
                patchSection("interactive", {
                  items: detail.interactive.items.filter(
                    (_, i) => i !== index,
                  ),
                })
              }
            />
          </div>
        ))}
        <MediaUploader
          label="صورة القسم"
          value={detail.interactive.imageUrl}
          disabled={disabled}
          folder="courses"
          accept="image"
          hint={mediaSizeHint(ADMIN_MEDIA_SIZES.courseInteractive)}
          onChange={(imageUrl) => patchSection("interactive", { imageUrl })}
        />
      </Section>

      <Section title="التقييمات">
        <Field label="تسمية صغيرة">
          <Input
            disabled={disabled}
            value={detail.reviews.eyebrow}
            onChange={(e) =>
              patchSection("reviews", { eyebrow: e.target.value })
            }
          />
        </Field>
        <Field label="عنوان التقييمات">
          <Input
            disabled={disabled}
            value={detail.reviews.title}
            onChange={(e) =>
              patchSection("reviews", { title: e.target.value })
            }
          />
        </Field>
        <ListActions
          disabled={disabled}
          onAdd={() =>
            patchSection("reviews", {
              items: [
                ...detail.reviews.items,
                { quote: "", name: "", rating: 5 },
              ],
            })
          }
        />
        {detail.reviews.items.map((review, index) => (
          <div key={index} className="space-y-2 rounded-lg border p-3">
            <Textarea
              rows={3}
              placeholder="نص التقييم"
              disabled={disabled}
              value={review.quote}
              onChange={(e) =>
                patchSection("reviews", {
                  items: updateAt(detail.reviews.items, index, {
                    quote: e.target.value,
                  }),
                })
              }
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="اسم المتدرب"
                disabled={disabled}
                value={review.name}
                onChange={(e) =>
                  patchSection("reviews", {
                    items: updateAt(detail.reviews.items, index, {
                      name: e.target.value,
                    }),
                  })
                }
              />
              <Input
                type="number"
                min={1}
                max={5}
                placeholder="التقييم (١-٥)"
                disabled={disabled}
                value={review.rating}
                onChange={(e) => {
                  const rating = Math.min(
                    5,
                    Math.max(1, Number(e.target.value) || 1),
                  );
                  patchSection("reviews", {
                    items: updateAt(detail.reviews.items, index, { rating }),
                  });
                }}
              />
            </div>
            <RemoveRow
              disabled={disabled}
              onClick={() =>
                patchSection("reviews", {
                  items: detail.reviews.items.filter((_, i) => i !== index),
                })
              }
            />
          </div>
        ))}
      </Section>

      <Section title="المدرب">
        <Field label="تسمية القسم">
          <Input
            disabled={disabled}
            value={detail.instructor.eyebrow}
            onChange={(e) =>
              patchSection("instructor", { eyebrow: e.target.value })
            }
          />
        </Field>
        <Field label="اسم المدرب">
          <Input
            disabled={disabled}
            value={detail.instructor.name}
            onChange={(e) =>
              patchSection("instructor", { name: e.target.value })
            }
          />
        </Field>
        <Field label="نبذة المدرب">
          <Textarea
            rows={4}
            disabled={disabled}
            value={detail.instructor.bio}
            onChange={(e) =>
              patchSection("instructor", { bio: e.target.value })
            }
          />
        </Field>
        <MediaUploader
          label="صورة المدرب"
          value={detail.instructor.imageUrl}
          onChange={(imageUrl) => patchSection("instructor", { imageUrl })}
          disabled={disabled}
          folder="instructors"
          accept="image"
          hint={mediaSizeHint(ADMIN_MEDIA_SIZES.instructor)}
        />
        <ListActions
          disabled={disabled}
          onAdd={() =>
            patchSection("instructor", {
              socials: [
                ...detail.instructor.socials,
                { platform: "", url: "" },
              ],
            })
          }
        />
        {detail.instructor.socials.map((social, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder="المنصة مثل تويتر"
              disabled={disabled}
              value={social.platform}
              onChange={(e) =>
                patchSection("instructor", {
                  socials: updateAt(detail.instructor.socials, index, {
                    platform: e.target.value,
                  }),
                })
              }
            />
            <Input
              dir="ltr"
              className="text-start"
              placeholder="https://..."
              disabled={disabled}
              value={social.url}
              onChange={(e) =>
                patchSection("instructor", {
                  socials: updateAt(detail.instructor.socials, index, {
                    url: e.target.value,
                  }),
                })
              }
            />
            <Button
              type="button"
              size="icon-sm"
              variant="destructive"
              disabled={disabled}
              onClick={() =>
                patchSection("instructor", {
                  socials: detail.instructor.socials.filter(
                    (_, i) => i !== index,
                  ),
                })
              }
            >
              <Trash2Icon className="size-4" />
            </Button>
          </div>
        ))}
      </Section>

      <Section title="السعر">
        <Field label="عنوان عرض السعر">
          <Textarea
            rows={2}
            disabled={disabled}
            value={detail.pricing.title}
            onChange={(e) =>
              patchSection("pricing", { title: e.target.value })
            }
          />
        </Field>
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="السعر">
            <Input
              disabled={disabled}
              value={detail.pricing.price}
              onChange={(e) =>
                patchSection("pricing", { price: e.target.value })
              }
            />
          </Field>
          <Field label="السعر قبل الخصم">
            <Input
              disabled={disabled}
              value={detail.pricing.originalPrice}
              onChange={(e) =>
                patchSection("pricing", { originalPrice: e.target.value })
              }
            />
          </Field>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="نص زر التسجيل">
            <Input
              disabled={disabled}
              value={detail.pricing.ctaLabel}
              onChange={(e) =>
                patchSection("pricing", { ctaLabel: e.target.value })
              }
            />
          </Field>
          <Field label="رابط التسجيل">
            <Input
              dir="ltr"
              className="text-start"
              disabled={disabled}
              value={detail.pricing.ctaHref}
              onChange={(e) =>
                patchSection("pricing", { ctaHref: e.target.value })
              }
              placeholder="https://..."
            />
          </Field>
        </div>
        <Field label="ملاحظة الدفع الآمن">
          <Input
            disabled={disabled}
            value={detail.pricing.secureNote}
            onChange={(e) =>
              patchSection("pricing", { secureNote: e.target.value })
            }
          />
        </Field>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3 border-t pt-4 first:border-t-0 first:pt-0">
      <p className="text-sm font-semibold">{title}</p>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ListActions({
  disabled,
  onAdd,
}: {
  disabled?: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="flex justify-end">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={onAdd}
      >
        <PlusIcon className="size-4" />
        إضافة عنصر
      </Button>
    </div>
  );
}

function RemoveRow({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="text-destructive"
      disabled={disabled}
      onClick={onClick}
    >
      <Trash2Icon className="size-4" />
      حذف
    </Button>
  );
}

function IconSelect({
  value,
  onChange,
  disabled,
}: {
  value: CourseIconName;
  onChange: (value: CourseIconName) => void;
  disabled?: boolean;
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next as CourseIconName)}
      disabled={disabled}
    >
      <SelectTrigger className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {COURSE_ICON_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function StringListEditor({
  label,
  hint,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  label: string;
  hint?: string;
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Label>{label}</Label>
          {hint ? (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => onChange([...value, ""])}
        >
          <PlusIcon className="size-4" />
          إضافة
        </Button>
      </div>
      <div className="space-y-2">
        {value.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={item}
              disabled={disabled}
              placeholder={placeholder}
              onChange={(e) =>
                onChange(
                  value.map((row, i) => (i === index ? e.target.value : row)),
                )
              }
            />
            <Button
              type="button"
              size="icon-sm"
              variant="destructive"
              disabled={disabled}
              onClick={() => onChange(value.filter((_, i) => i !== index))}
            >
              <Trash2Icon className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function IconLabelListEditor({
  label,
  hint,
  items,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  items: { icon: CourseIconName; label: string }[];
  onChange: (items: { icon: CourseIconName; label: string }[]) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Label>{label}</Label>
          {hint ? (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => onChange([...items, { icon: "check", label: "" }])}
        >
          <PlusIcon className="size-4" />
          إضافة
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <IconSelect
              value={item.icon}
              disabled={disabled}
              onChange={(icon) =>
                onChange(updateAt(items, index, { icon }))
              }
            />
            <Input
              value={item.label}
              disabled={disabled}
              placeholder="النص"
              onChange={(e) =>
                onChange(updateAt(items, index, { label: e.target.value }))
              }
            />
            <Button
              type="button"
              size="icon-sm"
              variant="destructive"
              disabled={disabled}
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              <Trash2Icon className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImageListEditor({
  label,
  images,
  onChange,
  disabled,
  folder,
}: {
  label: string;
  images: string[];
  onChange: (images: string[]) => void;
  disabled?: boolean;
  folder: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => onChange([...images, ""])}
        >
          <PlusIcon className="size-4" />
          إضافة صورة
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {images.map((url, index) => (
          <div key={index} className="space-y-2 rounded-lg border p-3">
            <MediaUploader
              label={`صورة ${index + 1}`}
              value={url}
              disabled={disabled}
              folder={folder}
              accept="image"
              hint={mediaSizeHint(ADMIN_MEDIA_SIZES.courseGallery)}
              onChange={(next) =>
                onChange(images.map((row, i) => (i === index ? next : row)))
              }
            />
            <RemoveRow
              disabled={disabled}
              onClick={() => onChange(images.filter((_, i) => i !== index))}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
