import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata, Viewport } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Familjen_Grotesk } from 'next/font/google';
import { notFound } from 'next/navigation';
import { Toaster } from 'sonner';
import { routing } from '@/libs/I18nRouting';
import { ClerkLocalizations } from '@/utils/AppConfig';
import '@/styles/global.css';

const familjenGrotesk = Familjen_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  icons: [
    {
      rel: 'apple-touch-icon',
      url: '/apple-touch-icon.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      url: '/favicon-32x32.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      url: '/favicon-16x16.png',
    },
    {
      rel: 'icon',
      url: '/favicon.ico',
    },
  ],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const clerkLocale =
    ClerkLocalizations.supportedLocales[locale] ?? ClerkLocalizations.defaultLocale;

  return (
    <html lang={locale} className={familjenGrotesk.variable}>
      <body>
        <ClerkProvider
          appearance={{ cssLayerName: 'clerk' }}
          localization={clerkLocale}
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
          afterSignOutUrl="/"
        >
          <NextIntlClientProvider>
            {props.children}
            <Toaster richColors position="top-right" />
          </NextIntlClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
