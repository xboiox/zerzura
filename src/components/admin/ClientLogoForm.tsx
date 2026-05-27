'use client';

import { useRef, useState, useTransition } from 'react';
import { addClientLogo } from '@/actions/clientLogoActions';

type ClientLogoFormProps = {
  urlLabel: string;
  urlPlaceholder: string;
  nameLabel: string;
  namePlaceholder: string;
  addButton: string;
  addingLabel: string;
};

export function ClientLogoForm(props: ClientLogoFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await addClientLogo(formData);
      if (result.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
      }
    });
  };

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="flex flex-col gap-3 sm:flex-row sm:items-start"
    >
      <div className="flex flex-1 flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <input
            name="logoUrl"
            type="url"
            required
            placeholder={props.urlPlaceholder}
            aria-label={props.urlLabel}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="sm:w-48">
          <input
            name="altText"
            placeholder={props.namePlaceholder}
            aria-label={props.nameLabel}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="shrink-0 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {isPending ? props.addingLabel : props.addButton}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
