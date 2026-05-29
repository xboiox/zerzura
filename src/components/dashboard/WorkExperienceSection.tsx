'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { addWorkExperience, deleteWorkExperience } from '@/actions/workExperienceActions';

type WorkEntry = {
  id: string;
  companyName: string;
  position: string;
  startMonth: number;
  startYear: number;
  endMonth: number | null;
  endYear: number | null;
  isCurrent: boolean;
  description: string | null;
};

type WorkExperienceSectionProps = {
  entries: WorkEntry[];
};

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1949 }, (_, i) => CURRENT_YEAR - i);

function formatPeriod(entry: WorkEntry, currentLabel: string): string {
  const start = `${MONTH_NAMES[entry.startMonth - 1]} ${entry.startYear}`;
  const end = entry.isCurrent
    ? currentLabel
    : `${MONTH_NAMES[(entry.endMonth ?? 1) - 1]} ${entry.endYear}`;
  return `${start} – ${end}`;
}

export function WorkExperienceSection(props: WorkExperienceSectionProps) {
  const t = useTranslations('UserProfilePage');
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [isCurrent, setIsCurrent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleAdd = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set('isCurrent', String(isCurrent));
    startTransition(async () => {
      const result = await addWorkExperience(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t('work_add_success'));
        setShowForm(false);
        setIsCurrent(false);
        router.refresh();
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteWorkExperience(id);
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
  const selectClass = inputClass;

  return (
    <div>
      {props.entries.length === 0 && !showForm && (
        <p className="mb-4 text-sm text-gray-500">{t('work_empty')}</p>
      )}

      {/* List */}
      {props.entries.length > 0 && (
        <ul className="mb-4 divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          {props.entries.map((entry) => (
            <li key={entry.id} className="flex items-start justify-between gap-4 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{entry.position}</p>
                <p className="text-sm text-gray-600">{entry.companyName}</p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {formatPeriod(entry, t('work_current'))}
                </p>
                {entry.description && (
                  <p className="mt-1 text-xs text-gray-500">{entry.description}</p>
                )}
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
              <label htmlFor="work-company" className={labelClass}>
                {t('work_company')}
              </label>
              <input
                id="work-company"
                name="companyName"
                type="text"
                required
                placeholder={t('work_company_placeholder')}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="work-position" className={labelClass}>
                {t('work_position')}
              </label>
              <input
                id="work-position"
                name="position"
                type="text"
                required
                placeholder={t('work_position_placeholder')}
                className={inputClass}
              />
            </div>
          </div>

          {/* Mulai */}
          <div>
            <p className={labelClass}>{t('work_start_date')}</p>
            <div className="grid grid-cols-2 gap-4">
              <select name="startMonth" required className={selectClass}>
                <option value="">{t('work_month_placeholder')}</option>
                {MONTH_NAMES.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
              <select name="startYear" required className={selectClass}>
                <option value="">{t('work_year_placeholder')}</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Checkbox: masih bekerja */}
          <div className="flex items-center gap-2">
            <input
              id="isCurrent"
              type="checkbox"
              checked={isCurrent}
              onChange={(e) => {
                setIsCurrent(e.target.checked);
              }}
              className="size-4 rounded border-gray-300"
            />
            <label htmlFor="isCurrent" className="text-sm text-gray-700">
              {t('work_is_current')}
            </label>
          </div>

          {/* Selesai */}
          {!isCurrent && (
            <div>
              <p className={labelClass}>{t('work_end_date')}</p>
              <div className="grid grid-cols-2 gap-4">
                <select name="endMonth" className={selectClass}>
                  <option value="">{t('work_month_placeholder')}</option>
                  {MONTH_NAMES.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
                <select name="endYear" className={selectClass}>
                  <option value="">{t('work_year_placeholder')}</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Deskripsi */}
          <div>
            <label htmlFor="work-desc" className={labelClass}>
              {t('work_description')}{' '}
              <span className="font-normal text-gray-400">({t('optional')})</span>
            </label>
            <textarea
              id="work-desc"
              name="description"
              rows={3}
              placeholder={t('work_description_placeholder')}
              className={inputClass}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {isPending ? t('saving_button') : t('work_add_button')}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setIsCurrent(false);
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
          + {t('work_add_new')}
        </button>
      )}
    </div>
  );
}
