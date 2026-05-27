import { eq } from 'drizzle-orm';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { JobForm } from '@/components/admin/JobForm';
import { db } from '@/libs/DB';
import { jobTable } from '@/models/Schema';

type AdminJobsEditPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function AdminJobsEditPage(props: AdminJobsEditPageProps) {
  const { locale, id } = await props.params;
  setRequestLocale(locale);

  const [job] = await db.select().from(jobTable).where(eq(jobTable.id, id)).limit(1);

  if (!job) {
    notFound();
  }

  const { title, description, requirements, jobType, location, salaryMin, salaryMax, deadline } =
    job;

  return (
    <JobForm
      mode="edit"
      jobId={id}
      defaultValues={{
        title,
        description,
        requirements,
        jobType,
        location,
        salaryMin: salaryMin === null ? undefined : String(salaryMin),
        salaryMax: salaryMax === null ? undefined : String(salaryMax),
        deadline: deadline.toISOString().slice(0, 10),
      }}
    />
  );
}
