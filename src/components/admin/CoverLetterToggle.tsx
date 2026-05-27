'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

type CoverLetterToggleProps = {
  coverLetter: string;
};

export function CoverLetterToggle(props: CoverLetterToggleProps) {
  const t = useTranslations('AdminApplicantsPage');
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
        }}
        className="text-xs font-medium text-red-700 hover:underline"
      >
        {open ? t('hide_cover_letter') : t('view_cover_letter')}
      </button>
      {open && (
        <p className="mt-2 max-w-lg text-xs leading-relaxed whitespace-pre-wrap text-gray-700">
          {props.coverLetter}
        </p>
      )}
    </div>
  );
}
