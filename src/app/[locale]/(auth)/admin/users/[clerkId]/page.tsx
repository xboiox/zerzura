import { clerkClient } from '@clerk/nextjs/server';
import { desc, eq } from 'drizzle-orm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { db } from '@/libs/DB';
import { Link } from '@/libs/I18nNavigation';
import { applicationTable, jobTable, userProfileTable } from '@/models/Schema';

type AdminUserProfilePageProps = {
  params: Promise<{ locale: string; clerkId: string }>;
};

function statusBadgeClass(status: string): string {
  if (status === 'ACCEPTED') {
    return 'bg-green-100 text-green-700';
  }
  if (status === 'REJECTED' || status === 'WITHDRAWN') {
    return 'bg-red-100 text-red-700';
  }
  if (status === 'OFFERING' || status === 'INTERVIEWED' || status === 'ASSESSMENT') {
    return 'bg-blue-100 text-blue-700';
  }
  if (status === 'REVIEWED') {
    return 'bg-yellow-100 text-yellow-700';
  }
  return 'bg-gray-100 text-gray-600';
}

export default async function AdminUserProfilePage(props: AdminUserProfilePageProps) {
  const { locale, clerkId } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'AdminUserProfilePage' });
  const tStatus = await getTranslations({ locale, namespace: 'AdminApplicantsPage' });

  const [profile, client] = await Promise.all([
    db.query.userProfileTable.findFirst({
      where: eq(userProfileTable.clerkId, clerkId),
    }),
    clerkClient(),
  ]);

  let clerkName = clerkId;
  let clerkEmail = '—';
  try {
    const user = await client.users.getUser(clerkId);
    const nameParts = [user.firstName, user.lastName].filter(Boolean);
    clerkName =
      nameParts.length > 0
        ? nameParts.join(' ')
        : (user.emailAddresses[0]?.emailAddress ?? clerkId);
    clerkEmail = user.emailAddresses[0]?.emailAddress ?? '—';
  } catch {
    if (!profile) {
      notFound();
    }
  }

  const applications = await db
    .select({
      id: applicationTable.id,
      status: applicationTable.status,
      cvUrl: applicationTable.cvUrl,
      createdAt: applicationTable.createdAt,
      jobId: jobTable.id,
      jobTitle: jobTable.title,
    })
    .from(applicationTable)
    .innerJoin(jobTable, eq(applicationTable.jobId, jobTable.id))
    .where(eq(applicationTable.applicantClerkId, clerkId))
    .orderBy(desc(applicationTable.createdAt));

  const dateFormatter = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const statusLabels: Record<string, string> = {
    PENDING: tStatus('status_pending'),
    REVIEWED: tStatus('status_reviewed'),
    INTERVIEWED: tStatus('status_interviewed'),
    ASSESSMENT: tStatus('status_assessment'),
    OFFERING: tStatus('status_offering'),
    ACCEPTED: tStatus('status_accepted'),
    REJECTED: tStatus('status_rejected'),
    WITHDRAWN: tStatus('status_withdrawn'),
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href="/admin/users" className="text-sm text-gray-500 hover:text-gray-700">
          ← {t('back_to_users')}
        </Link>
      </div>

      <div>
        <h1 className="mb-1 text-2xl font-bold text-gray-900">{clerkName}</h1>
        <p className="text-sm text-gray-500">{clerkEmail}</p>
      </div>

      {/* Personal info */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-gray-900">{t('personal_info_title')}</h2>
        {profile ? (
          <dl className="space-y-3 rounded-lg border border-gray-200 bg-white p-5">
            <div className="flex gap-4">
              <dt className="w-28 shrink-0 text-sm text-gray-500">{t('phone_label')}</dt>
              <dd className="text-sm text-gray-900">{profile.phone ?? '—'}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-28 shrink-0 text-sm text-gray-500">{t('city_label')}</dt>
              <dd className="text-sm text-gray-900">{profile.city ?? '—'}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-28 shrink-0 text-sm text-gray-500">{t('skills_label')}</dt>
              <dd className="text-sm text-gray-900">
                {profile.skills && profile.skills.length > 0 ? (
                  <span className="flex flex-wrap gap-1">
                    {profile.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </span>
                ) : (
                  '—'
                )}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-gray-500">{t('no_profile')}</p>
        )}
      </section>

      {/* Applications */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-gray-900">{t('applications_title')}</h2>
        {applications.length === 0 ? (
          <p className="text-sm text-gray-500">{t('no_applications')}</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">{t('col_job')}</th>
                  <th className="px-4 py-3">{t('col_status')}</th>
                  <th className="px-4 py-3">{t('col_date')}</th>
                  <th className="px-4 py-3">{t('col_cv')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/jobs/${app.jobId}/applicants/${app.id}`}
                        className="font-medium text-gray-900 hover:text-red-700 hover:underline"
                      >
                        {app.jobTitle}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(app.status)}`}
                      >
                        {statusLabels[app.status] ?? app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {dateFormatter.format(app.createdAt)}
                    </td>
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
      </section>
    </div>
  );
}
