import { and, count, eq, gt, inArray, lte } from 'drizzle-orm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { db } from '@/libs/DB';
import { Link } from '@/libs/I18nNavigation';
import { applicationTable, jobTable } from '@/models/Schema';

const EXPIRING_SOON_DAYS = 14;

type AdminDashboardPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminDashboardPage(props: AdminDashboardPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'AdminDashboard' });

  const now = new Date();
  const expiringCutoff = new Date(now.getTime() + EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000);

  const [
    totalResult,
    publishedResult,
    draftResult,
    expiredResult,
    expiringResult,
    unreviewedResult,
    reviewedResult,
    ongoingResult,
    closedResult,
  ] = await Promise.all([
    db.select({ value: count() }).from(jobTable),
    db
      .select({ value: count() })
      .from(jobTable)
      .where(and(eq(jobTable.status, 'PUBLISHED'), gt(jobTable.deadline, now))),
    db.select({ value: count() }).from(jobTable).where(eq(jobTable.status, 'DRAFT')),
    db
      .select({ value: count() })
      .from(jobTable)
      .where(and(eq(jobTable.status, 'PUBLISHED'), lte(jobTable.deadline, now))),
    db
      .select({ value: count() })
      .from(jobTable)
      .where(
        and(
          eq(jobTable.status, 'PUBLISHED'),
          gt(jobTable.deadline, now),
          lte(jobTable.deadline, expiringCutoff),
        ),
      ),
    db
      .select({ value: count() })
      .from(applicationTable)
      .where(eq(applicationTable.status, 'PENDING')),
    db
      .select({ value: count() })
      .from(applicationTable)
      .where(eq(applicationTable.status, 'REVIEWED')),
    db
      .select({ value: count() })
      .from(applicationTable)
      .where(inArray(applicationTable.status, ['INTERVIEWED', 'ASSESSMENT', 'OFFERING'])),
    db
      .select({ value: count() })
      .from(applicationTable)
      .where(inArray(applicationTable.status, ['ACCEPTED', 'REJECTED', 'WITHDRAWN'])),
  ]);

  const jobStats = [
    { label: t('total_jobs'), value: totalResult[0]?.value ?? 0, href: '/admin/jobs' },
    {
      label: t('published_jobs'),
      value: publishedResult[0]?.value ?? 0,
      href: '/admin/jobs?view=active',
    },
    { label: t('draft_jobs'), value: draftResult[0]?.value ?? 0, href: '/admin/jobs?view=draft' },
    {
      label: t('expired_jobs'),
      value: expiredResult[0]?.value ?? 0,
      href: '/admin/jobs?view=expired',
    },
    {
      label: t('expiring_jobs'),
      value: expiringResult[0]?.value ?? 0,
      href: '/admin/jobs?view=active',
    },
  ];

  const applicantStats = [
    {
      label: t('unreviewed_label'),
      value: unreviewedResult[0]?.value ?? 0,
      href: '/admin/applicants?status=PENDING',
    },
    {
      label: t('reviewed_label'),
      value: reviewedResult[0]?.value ?? 0,
      href: '/admin/applicants?status=REVIEWED',
    },
    {
      label: t('ongoing_label'),
      value: ongoingResult[0]?.value ?? 0,
      href: '/admin/applicants?status=ongoing',
    },
    {
      label: t('closed_label'),
      value: closedResult[0]?.value ?? 0,
      href: '/admin/applicants?status=closed',
    },
  ];

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {jobStats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-lg border border-gray-200 bg-white p-6 transition-colors hover:border-gray-300 hover:bg-gray-50"
          >
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="mb-4 text-base font-semibold text-gray-900">{t('new_applicants_title')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {applicantStats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-lg border border-gray-200 bg-white p-6 transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
