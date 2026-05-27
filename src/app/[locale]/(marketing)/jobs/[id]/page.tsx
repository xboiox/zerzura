import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ApplyForm } from '@/components/forms/ApplyForm';
import { buttonVariants } from '@/components/ui/button';
import { db } from '@/libs/DB';
import { Link } from '@/libs/I18nNavigation';
import { applicationTable, jobTable } from '@/models/Schema';

const formatSalary = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

type JobDetailPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata(props: JobDetailPageProps): Promise<Metadata> {
  const { locale, id } = await props.params;

  const [job, company] = await Promise.all([
    db.query.jobTable.findFirst({
      where: and(eq(jobTable.id, id), eq(jobTable.status, 'PUBLISHED')),
    }),
    db.query.companyProfileTable.findFirst(),
  ]);

  if (!job) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: 'JobDetailPage' });
  return {
    title: t('meta_title', { title: job.title, company: company?.name ?? '' }),
    description: t('meta_description', { title: job.title, company: company?.name ?? '' }),
  };
}

export default async function JobDetailPage(props: JobDetailPageProps) {
  const { locale, id } = await props.params;
  setRequestLocale(locale);

  const { userId } = await auth();

  const [job, company, existingApplication] = await Promise.all([
    db.query.jobTable.findFirst({
      where: and(eq(jobTable.id, id), eq(jobTable.status, 'PUBLISHED')),
    }),
    db.query.companyProfileTable.findFirst(),
    userId
      ? db.query.applicationTable.findFirst({
          where: and(eq(applicationTable.jobId, id), eq(applicationTable.applicantClerkId, userId)),
        })
      : Promise.resolve(null),
  ]);

  if (!job) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'JobDetailPage' });
  const tType = await getTranslations({ locale, namespace: 'JobType' });

  const isExpired = job.deadline < new Date();
  const hasApplied = Boolean(existingApplication);

  const deadlineFormatted = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(job.deadline);

  const salaryText = (() => {
    if (job.salaryMin && job.salaryMax) {
      return `${formatSalary(job.salaryMin)} – ${formatSalary(job.salaryMax)}`;
    }
    if (job.salaryMin) {
      return `${formatSalary(job.salaryMin)}+`;
    }
    return null;
  })();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Link
        href="/jobs"
        className="mb-8 inline-block text-sm font-medium text-red-700 hover:underline"
      >
        ← {t('back_to_jobs')}
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="mb-2 flex items-start gap-3">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{job.title}</h1>
          </div>
          {company && <p className="mb-6 text-sm text-gray-500">{company.name}</p>}

          {isExpired && (
            <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {t('expired_notice')}
            </div>
          )}

          <div className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">{t('description_title')}</h2>
            <div className="whitespace-pre-line text-gray-700">{job.description}</div>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">{t('requirements_title')}</h2>
            <div className="whitespace-pre-line text-gray-700">{job.requirements}</div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            {/* Apply section */}
            {!isExpired && (
              <div className="mb-6">
                {!userId && (
                  <Link
                    href={`/sign-in?redirect_url=/jobs/${job.id}`}
                    className={buttonVariants({ size: 'lg', className: 'w-full justify-center' })}
                  >
                    {t('sign_in_to_apply')}
                  </Link>
                )}
                {userId && hasApplied && (
                  <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-700">
                    {t('already_applied')}
                  </div>
                )}
                {userId && !hasApplied && <ApplyForm jobId={job.id} />}
              </div>
            )}

            {/* Job info */}
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="font-medium text-gray-500">{t('job_type_label')}</dt>
                <dd className="mt-1 text-gray-900">{tType(job.jobType)}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">{t('location_label')}</dt>
                <dd className="mt-1 text-gray-900">{job.location}</dd>
              </div>
              {salaryText && (
                <div>
                  <dt className="font-medium text-gray-500">{t('salary_label')}</dt>
                  <dd className="mt-1 text-gray-900">{salaryText}</dd>
                </div>
              )}
              <div>
                <dt className="font-medium text-gray-500">{t('deadline_label')}</dt>
                <dd className={`mt-1 ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                  {deadlineFormatted}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
