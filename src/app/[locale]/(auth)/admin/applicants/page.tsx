import { clerkClient } from '@clerk/nextjs/server';
import { desc, eq, inArray } from 'drizzle-orm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { db } from '@/libs/DB';
import { Link } from '@/libs/I18nNavigation';
import { applicationTable, jobTable } from '@/models/Schema';

type StatusGroup = 'PENDING' | 'REVIEWED' | 'ongoing' | 'closed';

type AdminAllApplicantsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
};

const ONGOING_STATUSES = ['INTERVIEWED', 'ASSESSMENT', 'OFFERING'] as const;
const CLOSED_STATUSES = ['ACCEPTED', 'REJECTED', 'WITHDRAWN'] as const;

function isStatusGroup(val: unknown): val is StatusGroup {
  return val === 'PENDING' || val === 'REVIEWED' || val === 'ongoing' || val === 'closed';
}

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

function pillClass(active: boolean) {
  return `rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
    active
      ? 'border-gray-900 bg-gray-900 text-white'
      : 'border-gray-300 text-gray-600 hover:border-gray-900 hover:text-gray-900'
  }`;
}

export default async function AdminAllApplicantsPage(props: AdminAllApplicantsPageProps) {
  const { locale } = await props.params;
  const { status: rawStatus } = await props.searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'AdminAllApplicantsPage' });
  const tStatus = await getTranslations({ locale, namespace: 'AdminApplicantsPage' });

  const activeGroup = isStatusGroup(rawStatus) ? rawStatus : undefined;

  const statusFilter = activeGroup
    ? (
        {
          PENDING: eq(applicationTable.status, 'PENDING'),
          REVIEWED: eq(applicationTable.status, 'REVIEWED'),
          ongoing: inArray(applicationTable.status, [...ONGOING_STATUSES]),
          closed: inArray(applicationTable.status, [...CLOSED_STATUSES]),
        } as const
      )[activeGroup]
    : undefined;

  const rows = await db
    .select({
      id: applicationTable.id,
      applicantClerkId: applicationTable.applicantClerkId,
      status: applicationTable.status,
      cvUrl: applicationTable.cvUrl,
      createdAt: applicationTable.createdAt,
      jobId: jobTable.id,
      jobTitle: jobTable.title,
    })
    .from(applicationTable)
    .innerJoin(jobTable, eq(applicationTable.jobId, jobTable.id))
    .where(statusFilter)
    .orderBy(desc(applicationTable.createdAt));

  const client = await clerkClient();
  const applicants = await Promise.all(
    rows.map(async (row) => {
      try {
        const user = await client.users.getUser(row.applicantClerkId);
        const nameParts = [user.firstName, user.lastName].filter(Boolean);
        const name =
          nameParts.length > 0
            ? nameParts.join(' ')
            : (user.emailAddresses[0]?.emailAddress ?? row.applicantClerkId);
        return { ...row, name };
      } catch {
        return { ...row, name: row.applicantClerkId };
      }
    }),
  );

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

  const filterPills: { key: string; label: string; value: StatusGroup | undefined }[] = [
    { key: 'all', label: t('filter_all'), value: undefined },
    { key: 'PENDING', label: t('filter_unreviewed'), value: 'PENDING' },
    { key: 'REVIEWED', label: t('filter_reviewed'), value: 'REVIEWED' },
    { key: 'ongoing', label: t('filter_ongoing'), value: 'ongoing' },
    { key: 'closed', label: t('filter_closed'), value: 'closed' },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">{t('title')}</h1>

      <div className="mb-6 flex flex-wrap gap-2">
        {filterPills.map((pill) => (
          <Link
            key={pill.key}
            href={pill.value ? `/admin/applicants?status=${pill.value}` : '/admin/applicants'}
            className={pillClass(activeGroup === pill.value)}
          >
            {pill.label}
          </Link>
        ))}
      </div>

      {applicants.length === 0 ? (
        <p className="text-sm text-gray-500">{t('no_applicants')}</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">{t('col_name')}</th>
                <th className="px-4 py-3">{t('col_job')}</th>
                <th className="px-4 py-3">{t('col_status')}</th>
                <th className="px-4 py-3">{t('col_date')}</th>
                <th className="px-4 py-3">{t('col_cv')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {applicants.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/jobs/${app.jobId}/applicants/${app.id}`}
                      className="font-medium text-gray-900 hover:text-red-700 hover:underline"
                    >
                      {app.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <Link
                      href={`/admin/jobs/${app.jobId}/applicants`}
                      className="hover:text-red-700 hover:underline"
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
