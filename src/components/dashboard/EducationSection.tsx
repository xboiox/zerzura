'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { addEducation, deleteEducation } from '@/actions/educationActions';

type EducationEntry = {
  id: string;
  institution: string;
  major: string;
  graduationYear: number;
  gpa: string | null;
};

type EducationSectionProps = {
  entries: EducationEntry[];
};

const CURRENT_YEAR = new Date().getFullYear();

export function EducationSection(props: EducationSectionProps) {
  const t = useTranslations('UserProfilePage');
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleAdd = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await addEducation(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t('education_add_success'));
        setShowForm(false);
        router.refresh();
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteEducation(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
      }
    });
  };

  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none';
  const labelClass = 'mb-1.5 block text-sm font-medium text-gray-700';

  return (
    <div>
      {props.entries.length === 0 && !showForm && (
        <p className="mb-4 text-sm text-gray-500">{t('education_empty')}</p>
      )}

      {/* List */}
      {props.entries.length > 0 && (
        <ul className="mb-4 divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          {props.entries.map((entry) => (
            <li key={entry.id} className="flex items-start justify-between gap-4 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{entry.institution}</p>
                <p className="text-sm text-gray-600">{entry.major}</p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {t('education_graduation_year')}: {entry.graduationYear}
                  {entry.gpa ? ` · ${t('education_gpa')}: ${entry.gpa}` : ''}
                </p>
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  handleDelete(entry.id);
                }}
                className="shrink-0 text-xs text-red-600 hover:underline disabled:opacity-50"
              >
                {t('delete_button')}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add form */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          className="mb-4 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edu-institution" className={labelClass}>
                {t('education_institution')}
              </label>
              <input
                id="edu-institution"
                name="institution"
                type="text"
                required
                placeholder={t('education_institution_placeholder')}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="edu-major" className={labelClass}>
                {t('education_major')}
              </label>
              <input
                id="edu-major"
                name="major"
                type="text"
                required
                placeholder={t('education_major_placeholder')}
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edu-year" className={labelClass}>
                {t('education_graduation_year')}
              </label>
              <input
                id="edu-year"
                name="graduationYear"
                type="number"
                required
                min={1950}
                max={CURRENT_YEAR}
                placeholder={String(CURRENT_YEAR)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="edu-gpa" className={labelClass}>
                {t('education_gpa')}{' '}
                <span className="font-normal text-gray-400">({t('optional')})</span>
              </label>
              <input
                id="edu-gpa"
                name="gpa"
                type="text"
                placeholder="3.75 / 4.00"
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {isPending ? t('saving_button') : t('education_add_button')}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
              }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('cancel_button')}
            </button>
          </div>
        </form>
      )}

      {!showForm && (
        <button
          type="button"
          onClick={() => {
            setShowForm(true);
          }}
          className="text-sm font-medium text-red-700 hover:underline"
        >
          + {t('education_add_new')}
        </button>
      )}
    </div>
  );
}
