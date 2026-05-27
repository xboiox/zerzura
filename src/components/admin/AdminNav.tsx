'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Link } from '@/libs/I18nNavigation';

type AdminNavProps = {
  isSuperAdmin: boolean;
  isAdmin: boolean;
};

export function AdminNav(props: AdminNavProps) {
  const t = useTranslations('AdminLayout');
  const pathname = usePathname();

  const isActive = (href: string) => {
    const stripped = pathname.replace(/^\/(en|id)/u, '');
    return href === '/admin' ? stripped === '/admin' : stripped.startsWith(href);
  };

  const linkClass = (href: string) =>
    `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      isActive(href)
        ? 'bg-gray-100 text-gray-900'
        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      <Link href="/admin" className={linkClass('/admin')}>
        {t('nav_dashboard')}
      </Link>
      <Link href="/admin/jobs" className={linkClass('/admin/jobs')}>
        {t('nav_jobs')}
      </Link>
      <Link href="/admin/applicants" className={linkClass('/admin/applicants')}>
        {t('nav_applicants')}
      </Link>
      {props.isSuperAdmin && (
        <Link href="/admin/company" className={linkClass('/admin/company')}>
          {t('nav_company')}
        </Link>
      )}
      {props.isAdmin && (
        <Link href="/admin/users" className={linkClass('/admin/users')}>
          {t('nav_users')}
        </Link>
      )}
    </nav>
  );
}
