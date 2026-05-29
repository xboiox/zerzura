import { UserProfile } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { EducationSection } from '@/components/dashboard/EducationSection';
import { WorkExperienceSection } from '@/components/dashboard/WorkExperienceSection';
import { ProfileForm } from '@/components/forms/ProfileForm';
import { db } from '@/libs/DB';
import { educationTable, userProfileTable, workExperienceTable } from '@/models/Schema';
import { getI18nPath } from '@/utils/Helpers';

type DbProfile = InferSelectModel<typeof userProfileTable> | undefined;

const EMPTY_PROFILE = {
  fullName: null as string | null,
  avatarUrl: null as string | null,
  gender: null as 'MALE' | 'FEMALE' | null,
  phone: null as string | null,
  city: null as string | null,
  skills: [] as string[],
  facebookUrl: null as string | null,
  instagramUrl: null as string | null,
  linkedinUrl: null as string | null,
  githubUrl: null as string | null,
};

function buildProfileFormData(dbProfile: DbProfile) {
  if (!dbProfile) {
    return EMPTY_PROFILE;
  }
  return {
    fullName: dbProfile.fullName,
    avatarUrl: dbProfile.avatarUrl,
    gender: dbProfile.gender,
    phone: dbProfile.phone,
    city: dbProfile.city,
    skills: dbProfile.skills ?? [],
    facebookUrl: dbProfile.facebookUrl,
    instagramUrl: dbProfile.instagramUrl,
    linkedinUrl: dbProfile.linkedinUrl,
    githubUrl: dbProfile.githubUrl,
  };
}

export default async function UserProfilePage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'UserProfilePage' });

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return null;
  }

  const [dbProfile, educationEntries, workEntries] = await Promise.all([
    db.query.userProfileTable.findFirst({ where: eq(userProfileTable.clerkId, clerkUser.id) }),
    db.query.educationTable.findMany({ where: eq(educationTable.clerkId, clerkUser.id) }),
    db.query.workExperienceTable.findMany({ where: eq(workExperienceTable.clerkId, clerkUser.id) }),
  ]);

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? '';
  const profileFormData = buildProfileFormData(dbProfile);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-1 text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-gray-500">{t('subtitle')}</p>
      </div>

      {/* Personal info */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-gray-500 uppercase">
          {t('personal_info_title')}
        </h2>

        <ProfileForm {...profileFormData} email={email} />
      </section>

      {/* Education */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-gray-500 uppercase">
          {t('education_section_title')}
        </h2>
        <EducationSection entries={educationEntries} />
      </section>

      {/* Work Experience */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-gray-500 uppercase">
          {t('work_section_title')}
        </h2>
        <WorkExperienceSection entries={workEntries} />
      </section>

      {/* Clerk account management */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-gray-500 uppercase">
          {t('account_title')}
        </h2>
        <UserProfile
          path={getI18nPath('/dashboard/user-profile', locale)}
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'shadow-none border-0 rounded-none p-0 w-full',
              navbar: 'border-r border-gray-200 bg-transparent',
              scrollBox: 'p-0',
            },
          }}
        />
      </section>
    </div>
  );
}
