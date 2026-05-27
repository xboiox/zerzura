import { SignOutButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AdminNav } from '@/components/admin/AdminNav';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { db } from '@/libs/DB';
import { Link } from '@/libs/I18nNavigation';
import { AppConfig } from '@/utils/AppConfig';

type AdminLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AdminLayout(props: AdminLayoutProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'AdminLayout' });

  const [{ sessionClaims }, company] = await Promise.all([
    auth(),
    db.query.companyProfileTable.findFirst(),
  ]);
  const { role } = (sessionClaims?.metadata ?? {}) as { role?: string };
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="flex h-16 items-center border-b border-gray-200 px-4">
          <Link href="/" className="flex items-center gap-2">
            {company?.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="h-8 w-auto max-w-[120px] object-contain"
              />
            ) : (
              <span className="text-base font-bold text-gray-900">
                {company?.name ?? AppConfig.name}
              </span>
            )}
          </Link>
        </div>

        <AdminNav isSuperAdmin={isSuperAdmin} isAdmin={isAdmin} />

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
