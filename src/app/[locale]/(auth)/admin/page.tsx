import { and, count, eq, gt, lte } from 'drizzle-orm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { db } from '@/libs/DB';
import { Link } from '@/libs/I18nNavigation';
import { jobTable } from '@/models/Schema';

type AdminDashboardPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminDashboardPage(props: AdminDashboardPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'AdminDashboard' });

  const now = new Date();

  const [totalResult, publishedResult, draftResult, expiredResult] = await Promise.all([
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
  ]);

  const stats = [
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
  ];

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-gray-900">{t('title')}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
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
  );
}
