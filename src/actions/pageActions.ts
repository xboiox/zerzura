'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/libs/DB';
import { aboutContentTable } from '@/models/Schema';
import { OfficeLocationsValidation } from '@/validations/PageContentValidation';

const toNull = (v: string | undefined) => (v?.length ? v : null);

export async function updateOfficeLocations(formData: FormData): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const parsed = OfficeLocationsValidation.safeParse({
    office1Name: formData.get('office1Name') ?? undefined,
    office1Address: formData.get('office1Address') ?? undefined,
    office1MapUrl: formData.get('office1MapUrl') ?? undefined,
    office2Name: formData.get('office2Name') ?? undefined,
    office2Address: formData.get('office2Address') ?? undefined,
    office2MapUrl: formData.get('office2MapUrl') ?? undefined,
    office3Name: formData.get('office3Name') ?? undefined,
    office3Address: formData.get('office3Address') ?? undefined,
    office3MapUrl: formData.get('office3MapUrl') ?? undefined,
  });

  if (!parsed.success) {
    throw new Error('Invalid form data');
  }

  const nullableOffices = {
    office1Name: toNull(parsed.data.office1Name),
    office1Address: toNull(parsed.data.office1Address),
    office1MapUrl: toNull(parsed.data.office1MapUrl),
    office2Name: toNull(parsed.data.office2Name),
    office2Address: toNull(parsed.data.office2Address),
    office2MapUrl: toNull(parsed.data.office2MapUrl),
    office3Name: toNull(parsed.data.office3Name),
    office3Address: toNull(parsed.data.office3Address),
    office3MapUrl: toNull(parsed.data.office3MapUrl),
  };

  await db
    .insert(aboutContentTable)
    .values({
      id: 1,
      vision: '',
      mission: '',
      integrityTitle: '',
      integrityDesc: '',
      excellenceTitle: '',
      excellenceDesc: '',
      collaborationTitle: '',
      collaborationDesc: '',
      ...nullableOffices,
    })
    .onConflictDoUpdate({
      target: aboutContentTable.id,
      set: { ...nullableOffices, updatedAt: new Date() },
    });

  revalidatePath('/about');
  redirect('/admin/company?toast=offices_saved');
}
