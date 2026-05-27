'use client';

import { useAuth, SignOutButton } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import React from 'react';
import { createPortal } from 'react-dom';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { buttonVariants } from '@/components/ui/button';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { cn } from '@/lib/utils';
import { Link } from '@/libs/I18nNavigation';

type SiteHeaderProps = {
  companyName: string;
  companyLogoUrl: string | null;
};

type UserMetadata = {
  role?: 'ADMIN' | 'SUPER_ADMIN' | 'USER';
};

function useScroll(threshold: number) {
  const [scrolled, setScrolled] = React.useState(false);

  const onScroll = React.useCallback(() => {
    setScrolled(window.scrollY > threshold);
  }, [threshold]);

  React.useEffect(() => {
    window.addEventListener('scroll', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [onScroll]);

  React.useEffect(() => {
    onScroll();
  }, [onScroll]);

  return scrolled;
}

type MobileMenuProps = {
  open: boolean;
  children: React.ReactNode;
};

function MobileMenu(props: MobileMenuProps) {
  if (!props.open || typeof window === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      id="mobile-menu"
      className={cn(
        'fixed top-16 right-0 bottom-0 left-0 z-40 flex flex-col overflow-hidden border-t border-gray-200 md:hidden',
        'bg-white/95 backdrop-blur-lg supports-[backdrop-filter]:bg-white/60',
      )}
    >
      <div
        data-slot="open"
        className="flex size-full flex-col justify-between p-4 ease-out data-[slot=open]:animate-in data-[slot=open]:zoom-in-97"
      >
        {props.children}
      </div>
    </div>,
    document.body,
  );
}

export function SiteHeader(props: SiteHeaderProps) {
  const t = useTranslations('Navbar');
  const { userId, sessionClaims } = useAuth();
  const scrolled = useScroll(10);
  const [open, setOpen] = React.useState(false);

  const metadata = (sessionClaims?.metadata ?? {}) as UserMetadata;
  const isAdmin = metadata.role === 'ADMIN' || metadata.role === 'SUPER_ADMIN';

  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const navLinks = [
    { href: '/jobs', label: t('jobs_link') },
    { href: '/services', label: t('service_link') },
    { href: '/portfolio', label: t('portfolio_link') },
    { href: '/about', label: t('about_link') },
  ];

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b border-transparent transition-[border-color,background-color] duration-200',
        scrolled &&
          'border-gray-200 bg-white/95 backdrop-blur-lg supports-[backdrop-filter]:bg-white/60',
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center">
            {props.companyLogoUrl ? (
              <img
                src={props.companyLogoUrl}
                alt={props.companyName}
                className="h-9 w-auto object-contain"
              />
            ) : (
              <span className="text-lg font-bold text-gray-900">{props.companyName}</span>
            )}
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {userId ? (
            <>
              <Link
                href={isAdmin ? '/admin' : '/dashboard'}
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                {isAdmin ? t('admin_link') : t('dashboard_link')}
              </Link>
              <SignOutButton>
                <button
                  type="button"
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  {t('sign_out_link')}
                </button>
              </SignOutButton>
            </>
          ) : (
            <>
              <Link href="/sign-in" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                {t('sign_in_link')}
              </Link>
              <Link href="/sign-up" className={buttonVariants({ size: 'sm' })}>
                {t('sign_up_link')}
              </Link>
            </>
          )}
          <LocaleSwitcher />
        </div>

        <button
          type="button"
          onClick={() => {
            setOpen(!open);
          }}
          className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'md:hidden')}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label="Toggle menu"
        >
          <MenuToggleIcon open={open} className="size-5" duration={300} />
        </button>
      </nav>

      <MobileMenu open={open}>
        <nav className="flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => {
                setOpen(false);
              }}
              className="rounded-md px-3 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-2">
          {userId ? (
            <>
              <Link
                href={isAdmin ? '/admin' : '/dashboard'}
                onClick={() => {
                  setOpen(false);
                }}
                className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
              >
                {isAdmin ? t('admin_link') : t('dashboard_link')}
              </Link>
              <SignOutButton>
                <button type="button" className={cn(buttonVariants(), 'w-full')}>
                  {t('sign_out_link')}
                </button>
              </SignOutButton>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                onClick={() => {
                  setOpen(false);
                }}
                className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
              >
                {t('sign_in_link')}
              </Link>
              <Link
                href="/sign-up"
                onClick={() => {
                  setOpen(false);
                }}
                className={cn(buttonVariants(), 'w-full')}
              >
                {t('sign_up_link')}
              </Link>
            </>
          )}
          <div className="flex justify-center pt-2">
            <LocaleSwitcher />
          </div>
        </div>
      </MobileMenu>
    </header>
  );
}
