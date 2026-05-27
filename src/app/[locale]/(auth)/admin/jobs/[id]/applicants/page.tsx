import { clerkClient } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { CoverLetterToggle } from '@/components/admin/CoverLetterToggle';
import { StatusUpdateForm } from '@/components/admin/StatusUpdateForm';
import { db } from '@/libs/DB';
import { Link } from '@/libs/I18nNavigation';
import { applicationTable, jobTable } from '@/models/Schema';

type AdminApplicantsPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

function statusBadgeClass(status: string): string {
  if (status === 'ACCEPTED') {
    return 'bg-green-100 text-green-700';
  }
  if (status === 'REJECTED') {
    return 'bg-red-100 text-red-700';
  }
  if (status === 'REVIEWED') {
    return 'bg-red-100 text-red-700';
  }
  return 'bg-gray-100 text-gray-600';
}

export default async function AdminApplicantsPage(props: AdminApplicantsPageProps) {
  const { locale, id } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'AdminApplicantsPage' });

  const job = await db.query.jobTable.findFirst({ where: eq(jobTable.id, id) });
  if (!job) {
    notFound();
  }

  const applications = await db
    .select()
    .from(applicationTable)
    .where(and(eq(applicationTable.jobId, id)))
    .orderBy(applicationTable.createdAt);

  const client = await clerkClient();
  const applicantData = await Promise.all(
    applications.map(async (app) => {
      try {
        const user = await client.users.getUser(app.applicantClerkId);
        const nameParts = [user.firstName, user.lastName].filter(Boolean);
        const name =
          nameParts.length > 0
            ? nameParts.join(' ')
            : (user.emailAddresses[0]?.emailAddress ?? app.applicantClerkId);
        const email = user.emailAddresses[0]?.emailAddress ?? '—';
        return { ...app, name, email };
      } catch {
        return { ...app, name: app.applicantClerkId, email: '—' };
      }
    }),
  );

  const dateFormatter = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/jobs" className="text-sm text-gray-500 hover:text-gray-700">
          ← {t('back_to_jobs')}
        </Link>
      </div>

      <h1 className="mb-1 text-2xl font-bold text-gray-900">{t('title')}</h1>
      <p className="mb-8 text-sm text-gray-500">{job.title}</p>

      {applicantData.length === 0 ? (
        <p className="text-sm text-gray-500">{t('no_applicants')}</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">{t('col_name')}</th>
                <th className="px-4 py-3">{t('col_email')}</th>
                <th className="px-4 py-3">{t('col_status')}</th>
                <th className="px-4 py-3">{t('col_cover_letter')}</th>
                <th className="px-4 py-3">{t('col_date')}</th>
                <th className="px-4 py-3">{t('col_cv')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {applicantData.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/jobs/${id}/applicants/${app.id}`}
                      className="font-medium text-gray-900 hover:text-red-700 hover:underline"
                    >
                      {app.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{app.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2">
                      <span
                        className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(app.status)}`}
                      >
                        {
                          (
                            {
                              PENDING: t('status_pending'),
                              REVIEWED: t('status_reviewed'),
                              ACCEPTED: t('status_accepted'),
                              REJECTED: t('status_rejected'),
                            } as Record<string, string>
                          )[app.status]
                        }
                      </span>
                      <StatusUpdateForm applicationId={app.id} currentStatus={app.status} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <CoverLetterToggle coverLetter={app.coverLetter} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{dateFormatter.format(app.createdAt)}</td>
                  <td className="px-4 py-3">
                    <a
                      href={app.cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-700 hover:underline"
                    >
                      {t('download_cv')}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
