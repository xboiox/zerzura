import { SignOutButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { db } from '@/libs/DB';
import { Link } from '@/libs/I18nNavigation';
import { applicationTable } from '@/models/Schema';
import { AppConfig } from '@/utils/AppConfig';

type DashboardLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: DashboardLayoutProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'DashboardLayout' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function DashboardLayout(props: DashboardLayoutProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'DashboardLayout' });

  const { userId } = await auth();
  const unseenRows = userId
    ? await db
        .select({ id: applicationTable.id })
        .from(applicationTable)
        .where(
          and(
            eq(applicationTable.applicantClerkId, userId),
            eq(applicationTable.applicantSeen, false),
          ),
        )
    : [];
  const badgeCount = unseenRows.length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="flex h-16 items-center border-b border-gray-200 px-4">
          <Link href="/" className="text-base font-bold text-gray-900">
            {AppConfig.name}
          </Link>
        </div>

        <nav className="flex-1 px-2 py-4">
          <ul className="space-y-1">
            <li>
              <Link
                href="/dashboard"
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                {t('dashboard_link')}
                {badgeCount > 0 && (
                  <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
                    {badgeCount}
                  </span>
                )}
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/user-profile"
                className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                {t('user_profile_link')}
              </Link>
            </li>
            <li>
              <Link
                href="/jobs"
                className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                {t('browse_jobs_link')}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="flex items-center justify-between border-t border-gray-200 p-3">
          <SignOutButton>
            <button
              type="button"
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            >
              {t('sign_out')}
            </button>
          </SignOutButton>
          <LocaleSwitcher />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">{props.children}</main>
    </div>
  );
}
