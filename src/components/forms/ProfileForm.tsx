'use client';

import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { saveUserProfile } from '@/actions/userProfileActions';

type ProfileFormProps = {
  phone: string | null;
  city: string | null;
  skills: string[];
};

export function ProfileForm(props: ProfileFormProps) {
  const t = useTranslations('UserProfilePage');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await saveUserProfile(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t('save_success'));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-gray-700">
            {t('phone_label')}
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            aria-label={t('phone_label')}
            defaultValue={props.phone ?? ''}
            placeholder={t('phone_placeholder')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="city" className="mb-1.5 block text-sm font-medium text-gray-700">
            {t('city_label')}
          </label>
          <input
            id="city"
            name="city"
            type="text"
            aria-label={t('city_label')}
            defaultValue={props.city ?? ''}
            placeholder={t('city_placeholder')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="skills" className="mb-1.5 block text-sm font-medium text-gray-700">
          {t('skills_label')}
        </label>
        <input
          id="skills"
          name="skills"
          type="text"
          aria-label={t('skills_label')}
          defaultValue={props.skills.join(', ')}
          placeholder={t('skills_placeholder')}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-500">{t('skills_help')}</p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {isPending ? t('saving_button') : t('save_button')}
      </button>
    </form>
  );
}
