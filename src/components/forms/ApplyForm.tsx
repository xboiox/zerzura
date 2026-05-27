'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { applyToJob } from '@/actions/applicationActions';
import { useUploadThing } from '@/libs/UploadthingClient';

type ApplyFormProps = {
  jobId: string;
};

export function ApplyForm(props: ApplyFormProps) {
  const t = useTranslations('ApplyForm');
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [cvUrl, setCvUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { startUpload } = useUploadThing('cvUploader', {
    onClientUploadComplete: (res) => {
      const ufsUrl = res[0]?.ufsUrl;
      if (ufsUrl) {
        setCvUrl(ufsUrl);
      }
      setUploading(false);
    },
    onUploadError: () => {
      setUploadError(t('upload_error'));
      setUploading(false);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    setUploadError('');
    setUploading(true);
    setFileName(file.name);
    setCvUrl('');
    await startUpload([file]);
  };

  const handleRemoveCv = () => {
    setCvUrl('');
    setFileName('');
    setUploadError('');
    if (formRef.current) {
      const fileInput = formRef.current.querySelector<HTMLInputElement>('input[type="file"]');
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!cvUrl) {
      setUploadError(t('cv_required'));
      return;
    }
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.set('cvUrl', cvUrl);
    try {
      await applyToJob(formData);
    } catch {
      setSubmitting(false);
      router.refresh();
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="jobId" value={props.jobId} />

      {/* CV Upload */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('cv_label')}</label>

        {cvUrl && !uploading ? (
          <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-4 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="max-w-[180px] truncate font-medium">{fileName}</span>
            </div>
            <button
              type="button"
              onClick={handleRemoveCv}
              disabled={submitting}
              className="ml-3 shrink-0 text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              {t('remove_cv')}
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 transition hover:border-gray-400">
            <input
              type="file"
              accept="application/pdf"
              aria-label={t('cv_label')}
              className="sr-only"
              onChange={handleFileChange}
              disabled={uploading || submitting}
            />
            {uploading ? t('uploading') : t('cv_placeholder')}
          </label>
        )}

        {uploadError && <p className="mt-1 text-xs text-red-600">{uploadError}</p>}
      </div>

      {/* Cover Letter */}
      <div>
        <label htmlFor="coverLetter" className="mb-1.5 block text-sm font-medium text-gray-700">
          {t('cover_letter_label')}
        </label>
        <textarea
          id="coverLetter"
          name="coverLetter"
          aria-label={t('cover_letter_label')}
          rows={5}
          minLength={50}
          maxLength={2000}
          required
          placeholder={t('cover_letter_placeholder')}
          disabled={submitting}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={uploading || submitting || !cvUrl}
        className="w-full rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? t('submitting') : t('submit_button')}
      </button>
    </form>
  );
}
