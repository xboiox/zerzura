# Code Conventions — Job Portal

Konvensi ini mengikuti pola yang sudah ada di boilerplate untuk konsistensi.

---

## Penamaan File

| Jenis | Konvensi | Contoh |
|---|---|---|
| React components | PascalCase | `JobCard.tsx`, `ApplyForm.tsx` |
| Lib configs | PascalCase | `DB.ts`, `Env.ts`, `Resend.ts` |
| Drizzle schema | PascalCase | `Schema.ts` |
| Zod validations | PascalCase + Validation suffix | `JobValidation.ts` |
| Server actions | camelCase + Actions suffix | `jobActions.ts` |
| Utils | PascalCase | `AppConfig.ts`, `Helpers.ts` |
| Next.js pages | lowercase `page.tsx` | `page.tsx` |
| Next.js layouts | lowercase `layout.tsx` | `layout.tsx` |
| Test files | Colocated, `.test.tsx` atau `.e2e.ts` | `JobCard.test.tsx` |

---

## Komponen React

**Default: Server Component.** Tambahkan `'use client'` hanya jika benar-benar butuh:
- Event handlers (`onClick`, `onChange`, dll.)
- React hooks (`useState`, `useEffect`, dll.)
- Browser-only APIs

```tsx
// Server Component (default) — tidak ada 'use client'
export default async function JobList() {
  const jobs = await db.query.jobTable.findMany();
  return <ul>{jobs.map(job => <JobCard key={job.id} job={job} />)}</ul>;
}

// Client Component — hanya saat diperlukan
'use client';
export function ApplyButton({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState(false);
  // ...
}
```

**Props:** Selalu gunakan named interface atau type, jangan anonymous object type inline.

```tsx
// SALAH
export function JobCard({ title, location }: { title: string; location: string }) {}

// BENAR
interface JobCardProps {
  title: string;
  location: string;
}
export function JobCard({ title, location }: JobCardProps) {}
```

Jangan gunakan `React.FC` — gunakan plain function component.

---

## Server Actions

Semua mutasi data ada di `src/actions/`. Setiap action:
1. Validasi input dengan Zod di awal
2. Ambil session dengan `auth()` dari Clerk
3. Kembalikan typed result object, jangan throw

```ts
// src/actions/jobActions.ts
export async function createJob(input: unknown) {
  const parsed = CreateJobSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() };
  }

  const { userId } = await auth();
  if (!userId) return { success: false, error: 'Unauthorized' };

  await db.insert(jobTable).values({ ...parsed.data, createdByClerkId: userId });
  revalidatePath('/admin/jobs');
  return { success: true };
}
```

---

## Zod Validations

Schema Zod ada di `src/validations/`, digunakan bersama oleh client (react-hook-form resolver) dan server action.

```ts
// src/validations/JobValidation.ts
import { z } from 'zod';

export const CreateJobSchema = z.object({
  title: z.string().min(3).max(100),
  // ...
});

export type CreateJobInput = z.infer<typeof CreateJobSchema>;
```

Di client (react-hook-form):
```ts
const form = useForm<CreateJobInput>({
  resolver: zodResolver(CreateJobSchema),
});
```

---

## Drizzle Schema

Semua tabel di `src/models/Schema.ts`. Ikuti pola existing:
- Primary key: `uuid` dengan `crypto.randomUUID()`
- Selalu ada `createdAt` dan `updatedAt`
- Enum didefinisikan dengan `pgEnum` di atas table definition

```ts
// src/models/Schema.ts
export const jobTypeEnum = pgEnum('job_type', ['REMOTE', 'ONSITE', 'HYBRID']);

export const jobTable = pgTable('job', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar('title', { length: 100 }).notNull(),
  jobType: jobTypeEnum('job_type').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});
```

---

## i18n (next-intl)

- Semua string UI ada di `src/locales/id.json` (default) dan `en.json`
- Gunakan namespace per halaman/komponen: `"JobCard": { "apply_button": "Lamar" }`
- Server component: `getTranslations({ locale, namespace })`
- Client component: `useTranslations('namespace')`
- Konten dari DB (judul lowongan, deskripsi) tidak ditranslasi — tampil apa adanya

```ts
// Server component
const t = await getTranslations({ locale, namespace: 'JobCard' });
return <button>{t('apply_button')}</button>;

// Client component
const t = useTranslations('JobCard');
return <button>{t('apply_button')}</button>;
```

---

## Logging

Jangan pernah gunakan `console.log` di production code. Gunakan `logger` dari `src/libs/Logger.ts`.

```ts
import { logger } from '@/libs/Logger';

// SALAH
console.log('Job created', jobId);

// BENAR
logger.info(`Job created: ${jobId}`);
logger.error(`Failed to send email: ${error.message}`);
```

---

## Error Handling

Gunakan `unknown` untuk caught errors, narrowing dengan `instanceof Error`.

```ts
try {
  await sendEmail(/* ... */);
} catch (error: unknown) {
  if (error instanceof Error) {
    logger.error(`Email failed: ${error.message}`);
  }
  return { success: false, error: 'Failed to send notification' };
}
```

---

## Environment Variables

Tambahkan semua env vars baru ke `src/libs/Env.ts` menggunakan `@t3-oss/env-nextjs`. Jangan akses `process.env` langsung di luar file ini.

```ts
// src/libs/Env.ts
export const Env = createEnv({
  server: {
    RESEND_API_KEY: z.string().min(1),
    // ...
  },
});
```

---

## URL State untuk Filter

Gunakan URL search params untuk state filter, search, dan pagination — bukan `useState`.

```ts
// page.tsx (Server Component)
export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>;
}) {
  const { q, type, page } = await searchParams;
  const jobs = await db.query.jobTable.findMany({
    where: and(
      q ? ilike(jobTable.title, `%${q}%`) : undefined,
      type ? eq(jobTable.jobType, type) : undefined,
    ),
  });
}
```
