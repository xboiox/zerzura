'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/libs/DB';
import { companyProfileTable } from '@/models/Schema';
import type { CompanyFormValues } from '@/validations/CompanyValidation';
import { CompanyValidation } from '@/validations/CompanyValidation';

const toNull = (v: string | undefined) => (v?.length ? v : null);

function buildNullableFields(data: CompanyFormValues) {
  return {
    logoUrl: toNull(data.logoUrl),
    linkedinUrl: toNull(data.linkedinUrl),
    instagramUrl: toNull(data.instagramUrl),
    email: toNull(data.email),
    phone: toNull(data.phone),
    whatsappNumber: toNull(data.whatsappNumber),
  };
}

export async function updateCompanyProfile(formData: FormData): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const parsed = CompanyValidation.safeParse({
    name: formData.get('name'),
    address: formData.get('address'),
    email: formData.get('email') ?? undefined,
    phone: formData.get('phone') ?? undefined,
    logoUrl: formData.get('logoUrl') ?? undefined,
    linkedinUrl: formData.get('linkedinUrl') ?? undefined,
    whatsappNumber: formData.get('whatsappNumber') ?? undefined,
    instagramUrl: formData.get('instagramUrl') ?? undefined,
  });

  if (!parsed.success) {
    throw new Error('Invalid form data');
  }

  const { logoUrl, linkedinUrl, instagramUrl, email, phone, whatsappNumber, ...rest } = parsed.data;
  const nullableFields = buildNullableFields({
    logoUrl,
    linkedinUrl,
    instagramUrl,
    email,
    phone,
    whatsappNumber,
    ...rest,
  });

  await db
    .insert(companyProfileTable)
    .values({ id: 1, description: '', ...rest, ...nullableFields })
    .onConflictDoUpdate({
      target: companyProfileTable.id,
      set: { ...rest, ...nullableFields, updatedAt: new Date() },
    });

  revalidatePath('/');
  revalidatePath('/admin/company');
  redirect('/admin/company?toast=company_saved');
}
