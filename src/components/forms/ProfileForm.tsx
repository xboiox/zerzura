'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { saveUserProfile } from '@/actions/userProfileActions';
import { useUploadThing } from '@/libs/UploadthingClient';

type ProfileFormProps = {
  fullName: string | null;
  avatarUrl: string | null;
  gender: 'MALE' | 'FEMALE' | null;
  email: string;
  phone: string | null;
  city: string | null;
  skills: string[];
  facebookUrl: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
};

export function ProfileForm(props: ProfileFormProps) {
  const t = useTranslations('UserProfilePage');
  const [isPending, startTransition] = useTransition();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(props.avatarUrl);
  const [avatarUrlValue, setAvatarUrlValue] = useState<string>(props.avatarUrl ?? '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload } = useUploadThing('avatarUploader', {
    onClientUploadComplete: (res) => {
      const uploadedUrl = res[0]?.ufsUrl;
      if (uploadedUrl) {
        setAvatarPreview(uploadedUrl);
        setAvatarUrlValue(uploadedUrl);
      }
      setIsUploading(false);
    },
    onUploadError: () => {
      toast.error(t('avatar_upload_error'));
      setIsUploading(false);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    setIsUploading(true);
    void startUpload([file]);
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set('avatarUrl', avatarUrlValue);
    startTransition(async () => {
      const result = await saveUserProfile(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t('save_success'));
      }
    });
  };

  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none';
  const labelClass = 'mb-1.5 block text-sm font-medium text-gray-700';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar */}
      <div>
        <p className={labelClass}>{t('avatar_label')}</p>
        <div className="flex items-center gap-4">
          <div className="size-16 overflow-hidden rounded-full bg-gray-100">
            {avatarPreview ? (
              // biome-ignore lint/performance/noImgElement: avatar preview, external URL
              <img src={avatarPreview} alt={t('avatar_label')} className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-xl font-semibold text-gray-400">
                {props.fullName?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
          </div>
          <div>
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {isUploading ? t('avatar_uploading') : t('avatar_change')}
            </button>
            <p className="mt-1 text-xs text-gray-400">{t('avatar_help')}</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Nama & Gender */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fullName" className={labelClass}>
            {t('full_name_label')}
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            defaultValue={props.fullName ?? ''}
            placeholder={t('full_name_placeholder')}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="gender" className={labelClass}>
            {t('gender_label')}
          </label>
          <select
            id="gender"
            name="gender"
            defaultValue={props.gender ?? ''}
            className={inputClass}
          >
            <option value="">{t('gender_placeholder')}</option>
            <option value="MALE">{t('gender_male')}</option>
            <option value="FEMALE">{t('gender_female')}</option>
          </select>
        </div>
      </div>

      {/* Email (dari Clerk, read-only) */}
      <div>
        <label htmlFor="email" className={labelClass}>
          {t('email_label')}
        </label>
        <input
          id="email"
          type="email"
          value={props.email}
          readOnly
          className="w-full cursor-not-allowed rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-400">{t('email_help')}</p>
      </div>

      {/* Telepon & Kota */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className={labelClass}>
            {t('phone_label')}
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={props.phone ?? ''}
            placeholder={t('phone_placeholder')}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="city" className={labelClass}>
            {t('city_label')}
          </label>
          <input
            id="city"
            name="city"
            type="text"
            defaultValue={props.city ?? ''}
            placeholder={t('city_placeholder')}
            className={inputClass}
          />
        </div>
      </div>

      {/* Skills */}
      <div>
        <label htmlFor="skills" className={labelClass}>
          {t('skills_label')}
        </label>
        <input
          id="skills"
          name="skills"
          type="text"
          defaultValue={props.skills.join(', ')}
          placeholder={t('skills_placeholder')}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-gray-500">{t('skills_help')}</p>
      </div>

      {/* Social Media */}
      <div>
        <p className="mb-3 text-sm font-semibold text-gray-700">{t('social_section_label')}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="facebookUrl" className={labelClass}>
              Facebook
            </label>
            <input
              id="facebookUrl"
              name="facebookUrl"
              type="url"
              defaultValue={props.facebookUrl ?? ''}
              placeholder="https://facebook.com/username"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="instagramUrl" className={labelClass}>
              Instagram
            </label>
            <input
              id="instagramUrl"
              name="instagramUrl"
              type="url"
              defaultValue={props.instagramUrl ?? ''}
              placeholder="https://instagram.com/username"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Profil Profesional */}
      <div>
        <p className="mb-3 text-sm font-semibold text-gray-700">
          {t('professional_section_label')}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="linkedinUrl" className={labelClass}>
              LinkedIn
            </label>
            <input
              id="linkedinUrl"
              name="linkedinUrl"
              type="url"
              defaultValue={props.linkedinUrl ?? ''}
              placeholder="https://linkedin.com/in/username"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="githubUrl" className={labelClass}>
              GitHub
            </label>
            <input
              id="githubUrl"
              name="githubUrl"
              type="url"
              defaultValue={props.githubUrl ?? ''}
              placeholder="https://github.com/username"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending || isUploading}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {isPending ? t('saving_button') : t('save_button')}
      </button>
    </form>
  );
}
