import { enUS, idID } from '@clerk/localizations';
import type { LocalizationResource } from '@clerk/shared/types';
import type { LocalePrefixMode } from 'next-intl/routing';

/** Locale prefix strategy for next-intl routing. */
const localePrefix: LocalePrefixMode = 'as-needed';

/** Centralized application configuration */
export const AppConfig = {
  name: 'Job Portal',
  i18n: {
    locales: ['id', 'en'],
    defaultLocale: 'id',
    localePrefix,
  },
};

const supportedLocales: Record<string, LocalizationResource> = {
  id: idID,
  en: enUS,
};

export const ClerkLocalizations = {
  defaultLocale: idID,
  supportedLocales,
};
