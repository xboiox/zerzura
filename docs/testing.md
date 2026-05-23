# Testing Guide — Job Portal

## Stack Testing

| Layer | Tool | Lokasi |
|---|---|---|
| Unit tests | Vitest | `src/**/*.test.ts(x)` |
| Component tests | Vitest + Browser | `src/**/*.test.tsx` |
| E2E tests | Playwright | `tests/e2e/*.e2e.ts` |
| Integration tests | Vitest | `tests/integration/*.integ.ts` |

## Menjalankan Tests

```bash
npm run test           # Unit tests (Vitest, sekali jalan)
npm run test:e2e       # E2E tests (Playwright)
npm run storybook:test # Component tests via Storybook
```

---

## Unit Tests (Vitest)

### Apa yang harus ditest

**Wajib:**
- Semua Zod validation schemas di `src/validations/`
- Helper functions di `src/utils/Helpers.ts`
- Status transition logic (forward vs backward) di `applicationActions.ts`

**Prioritas:**
```
src/validations/JobValidation.ts         → valid/invalid inputs
src/validations/ApplicationValidation.ts → CV file validation, cover letter limits
src/validations/ProfileValidation.ts     → optional fields
src/validations/CompanyValidation.ts     → required fields
```

### Pola penulisan test

```ts
// src/validations/JobValidation.test.ts
import { describe, it, expect } from 'vitest';
import { CreateJobSchema } from './JobValidation';

describe('CreateJobSchema', () => {
  it('accepts valid job input', () => {
    const result = CreateJobSchema.safeParse({
      title: 'Frontend Developer',
      jobType: 'REMOTE',
      // ...
    });
    expect(result.success).toBe(true);
  });

  it('rejects title shorter than 3 chars', () => {
    const result = CreateJobSchema.safeParse({ title: 'FE', /* ... */ });
    expect(result.success).toBe(false);
  });
});
```

---

## E2E Tests (Playwright)

### Critical flows yang harus dicover

| Flow | File |
|---|---|
| Pelamar: register + verifikasi email | `tests/e2e/ApplicantAuth.e2e.ts` |
| Pelamar: browse jobs + apply | `tests/e2e/ApplicationFlow.e2e.ts` |
| Admin: create job + review applicant | `tests/e2e/AdminJobManagement.e2e.ts` |
| Admin: update status lamaran | `tests/e2e/StatusUpdate.e2e.ts` |
| Language toggle ID ↔ EN | `tests/e2e/I18n.e2e.ts` |

### Contoh E2E test

```ts
// tests/e2e/ApplicationFlow.e2e.ts
import { test, expect } from '@playwright/test';

test('applicant can find and apply to a job', async ({ page }) => {
  // Browse ke listing
  await page.goto('/jobs');
  await expect(page.getByRole('heading', { name: /lowongan/i })).toBeVisible();

  // Klik lowongan pertama
  await page.getByTestId('job-card').first().click();

  // Klik Apply → redirect ke sign-in
  await page.getByRole('button', { name: /apply/i }).click();
  await expect(page).toHaveURL(/sign-in/);
});
```

### Test data strategy

- Gunakan Clerk test mode untuk auth di E2E (tidak kirim email nyata)
- Seed database test dengan data fixture minimal sebelum tiap test suite
- Cleanup data test setelah suite selesai

---

## Apa yang Tidak Perlu Ditest

- Drizzle query internals — Drizzle sudah ditest oleh maintainer-nya
- Clerk auth flows — Clerk sudah ditest oleh Clerk
- shadcn/ui components — sudah ditest oleh shadcn
- Next.js routing — sudah ditest oleh Vercel

Fokus test pada **business logic kita**: validasi, status transitions, permission checks.
