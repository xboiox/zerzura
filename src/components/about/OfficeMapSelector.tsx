'use client';

import { useState } from 'react';

type Office = {
  name: string;
  address: string;
  mapUrl: string;
};

type OfficeMapSelectorProps = {
  offices: Office[];
};

export function OfficeMapSelector(props: OfficeMapSelectorProps) {
  const [selected, setSelected] = useState(0);

  if (props.offices.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Daftar alamat */}
      <div className="flex flex-col gap-2 lg:col-span-2">
        {props.offices.map((office, i) => (
          <button
            key={office.name}
            type="button"
            onClick={() => {
              setSelected(i);
            }}
            className={`rounded-lg border p-4 text-left transition-all duration-150 ${
              selected === i
                ? 'border-red-200 bg-red-50 shadow-sm'
                : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
            }`}
          >
            <p
              className={`mb-1.5 text-sm font-bold ${
                selected === i ? 'text-red-700' : 'text-gray-700'
              }`}
            >
              {selected === i && (
                <span className="mr-1.5 inline-block size-1.5 rounded-full bg-red-600 align-middle" />
              )}
              {office.name}
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-line text-gray-500">
              {office.address}
            </p>
          </button>
        ))}
      </div>

      {/* Peta */}
      <div className="overflow-hidden rounded-xl border border-gray-200 lg:col-span-3">
        {props.offices.map((office, i) => (
          <iframe
            key={office.mapUrl}
            src={office.mapUrl}
            width="100%"
            height="420"
            style={{ border: 0 }}
            allowFullScreen
            loading={i === 0 ? 'eager' : 'lazy'}
            referrerPolicy="no-referrer-when-downgrade"
            title={office.name}
            className={`block ${selected === i ? '' : 'hidden'}`}
          />
        ))}
      </div>
    </div>
  );
}
