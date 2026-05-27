'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { createJob, updateJob } from '@/actions/jobActions';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Link } from '@/libs/I18nNavigation';
import { jobTypeEnum } from '@/models/Schema';
import { JobFormSchema } from '@/validations/JobValidation';
import type { JobFormValues } from '@/validations/JobValidation';

type JobFormProps = {
  mode: 'create' | 'edit';
  jobId?: string;
  defaultValues?: JobFormValues;
};

export function JobForm(props: JobFormProps) {
  const t = useTranslations('JobForm');
  const tType = useTranslations('JobType');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<JobFormValues>({
    resolver: zodResolver(JobFormSchema),
    defaultValues: props.defaultValues,
  });

  const submitLabel = props.mode === 'create' ? t('submit_create') : t('submit_update');

  const onSubmit = async (data: JobFormValues) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== '') {
        formData.set(key, value);
      }
    }

    await (props.mode === 'edit' && props.jobId
      ? updateJob(props.jobId, formData)
      : createJob(formData));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {props.mode === 'create' ? t('create_title') : t('edit_title')}
      </h1>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="space-y-5">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t('title_label')}
            </label>
            <Input {...register('title')} placeholder={t('title_placeholder')} />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>

          {/* Job type + Location row */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('job_type_label')}
              </label>
              <select
                {...register('jobType')}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring"
              >
                {jobTypeEnum.enumValues.map((v) => (
                  <option key={v} value={v}>
                    {tType(v)}
                  </option>
                ))}
              </select>
              {errors.jobType && (
                <p className="mt-1 text-xs text-red-600">{errors.jobType.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('location_label')}
              </label>
              <Input {...register('location')} placeholder={t('location_placeholder')} />
              {errors.location && (
                <p className="mt-1 text-xs text-red-600">{errors.location.message}</p>
              )}
            </div>
          </div>

          {/* Salary row */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('salary_min_label')}
              </label>
              <Input
                {...register('salaryMin')}
                type="number"
                min={0}
                placeholder={t('salary_min_placeholder')}
              />
              {errors.salaryMin && (
                <p className="mt-1 text-xs text-red-600">{errors.salaryMin.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('salary_max_label')}
              </label>
              <Input
                {...register('salaryMax')}
                type="number"
                min={0}
                placeholder={t('salary_max_placeholder')}
              />
              {errors.salaryMax && (
                <p className="mt-1 text-xs text-red-600">{errors.salaryMax.message}</p>
              )}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t('deadline_label')}
            </label>
            <Input {...register('deadline')} type="date" />
            {errors.deadline && (
              <p className="mt-1 text-xs text-red-600">{errors.deadline.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t('description_label')}
            </label>
            <Textarea
              {...register('description')}
              rows={6}
              placeholder={t('description_placeholder')}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Requirements */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t('requirements_label')}
            </label>
            <Textarea
              {...register('requirements')}
              rows={6}
              placeholder={t('requirements_placeholder')}
            />
            {errors.requirements && (
              <p className="mt-1 text-xs text-red-600">{errors.requirements.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Link href="/admin/jobs" className="text-sm font-medium text-gray-500 hover:text-gray-900">
          {t('cancel_button')}
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-gray-900 px-6 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {isSubmitting ? t('submitting') : submitLabel}
        </button>
      </div>
    </form>
  );
}
