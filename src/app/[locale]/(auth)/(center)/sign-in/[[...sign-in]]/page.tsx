import { SignIn } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getI18nPath } from '@/utils/Helpers';

type SignInPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirect_url?: string }>;
};

export async function generateMetadata(props: SignInPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'SignIn',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function SignInPage(props: SignInPageProps) {
  const { locale } = await props.params;
  const { redirect_url } = await props.searchParams;
  setRequestLocale(locale);

  return (
    <SignIn
      path={getI18nPath('/sign-in', locale)}
      fallbackRedirectUrl={redirect_url ?? '/dashboard'}
    />
  );
}
