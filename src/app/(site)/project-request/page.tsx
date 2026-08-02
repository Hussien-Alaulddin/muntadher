import type { Metadata } from "next";
import { ProjectRequestForm } from "@/components/project-request/project-request-form";
import { getPublicProjectForm } from "@/lib/get-project-form";

export const metadata: Metadata = {
  title: "استمارة طلب مشروع | منتظر",
  robots: { index: false, follow: false },
};

export const revalidate = 60;

export default async function ProjectRequestPage() {
  const data = await getPublicProjectForm();

  return (
    <main>
      <ProjectRequestForm
        title={data.title}
        contactEmail={data.contactEmail}
        questions={data.questions}
      />
    </main>
  );
}
