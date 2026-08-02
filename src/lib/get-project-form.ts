import { getPrisma, withDbRetry } from "@/lib/prisma";
import {
  personalizeHeading,
  projectFormQuestionsSeed,
  toPublicFormQuestions,
  type ProjectFormQuestionType,
} from "@/lib/project-form";

export type PublicFormQuestionView = {
  id: string;
  key: string;
  heading: string;
  headingTemplate: string;
  subtext: string | null;
  type: ProjectFormQuestionType;
  required: boolean;
  options: string[] | null;
  order: number;
};

export type PublicProjectFormData = {
  designerName: string;
  contactEmail: string | null;
  title: string;
  questions: PublicFormQuestionView[];
};

function asOptions(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const items = value.filter((v): v is string => typeof v === "string");
  return items.length ? items : null;
}

function withTemplates(
  questions: ReturnType<typeof toPublicFormQuestions>,
): PublicFormQuestionView[] {
  return questions.map((q) => ({
    ...q,
    headingTemplate: q.heading,
    heading: personalizeHeading(q.heading, ""),
  }));
}

/** بيانات الاستمارة العامة — تُستخدم في الصفحة وواجهة API */
export async function getPublicProjectForm(): Promise<PublicProjectFormData> {
  let designerName = "منتظر";
  let contactEmail: string | null = null;
  let questions = withTemplates(
    toPublicFormQuestions(projectFormQuestionsSeed),
  );

  const prisma = getPrisma();
  if (!prisma) {
    return {
      designerName,
      contactEmail,
      title: `التواصل مع ${designerName}`,
      questions,
    };
  }

  try {
    const settingsPromise = withDbRetry((db) =>
      db.siteSettings.findUnique({ where: { id: "default" } }),
    );

    const formDb = prisma as {
      projectFormQuestion?: {
        findMany: (args: unknown) => Promise<
          Array<{
            id: string;
            key: string;
            heading: string;
            subtext: string | null;
            type: string;
            required: boolean;
            options: unknown;
            order: number;
          }>
        >;
      };
    };

    const questionsPromise = formDb.projectFormQuestion?.findMany
      ? withDbRetry((db) =>
          (db as typeof formDb).projectFormQuestion!.findMany({
            where: { enabled: true },
            orderBy: { order: "asc" },
          }),
        )
      : Promise.resolve([]);

    const [settings, rows] = await Promise.all([
      settingsPromise,
      questionsPromise,
    ]);

    designerName = settings?.designerName?.trim() || designerName;
    contactEmail = settings?.contactEmail ?? null;

    if (rows.length > 0) {
      questions = withTemplates(
        toPublicFormQuestions(
          rows.map((row) => ({
            ...row,
            options: asOptions(row.options),
          })),
        ),
      );
    }
  } catch (error) {
    console.error("[project-form:get]", error);
  }

  return {
    designerName,
    contactEmail,
    title: `التواصل مع ${designerName}`,
    questions,
  };
}
