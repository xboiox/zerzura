# Implementation Plan — Job Portal

Urutan berdasarkan dependency. Setiap fase harus selesai sebelum fase berikutnya dimulai kecuali disebutkan "dapat paralel".

---

## Phase 0: Project Setup & Configuration
*Fondasi. Semua fase lain bergantung pada ini.*

- [ ] Bersihkan boilerplate: hapus halaman `counter`, `about`, `portfolio` dan komponen demo (`DemoBanner`, `DemoBadge`, `Sponsors`, `Hello`, `CounterForm`, `CurrentCount`)
- [ ] Update `src/utils/AppConfig.ts`: ganti locales ke `['id', 'en']`, defaultLocale ke `'id'`
- [ ] Rename `src/locales/fr.json` → `src/locales/id.json`, update ClerkLocalizations di AppConfig untuk id/en
- [ ] Buat project di Clerk, tambahkan env vars (`CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`)
- [ ] Setup database lokal PostgreSQL, tambahkan `DATABASE_URL` ke env vars
- [ ] Buat akun Uploadthing, tambahkan env vars
- [ ] Buat akun Resend, tambahkan `RESEND_API_KEY` ke env vars
- [ ] Update `src/libs/Env.ts`: tambahkan `RESEND_API_KEY`, `UPLOADTHING_SECRET`, `UPLOADTHING_APP_ID`, `CLERK_WEBHOOK_SECRET`
- [ ] Install shadcn/ui: `npx shadcn@latest init`
- [ ] Verifikasi `npm run dev` berjalan tanpa error

---

## Phase 1: Database Schema
*Harus selesai sebelum Phase 2 dan seterusnya.*

- [ ] Tulis semua schema di `src/models/Schema.ts`:
  - `userProfileTable` (clerkId, isActive, phone, city, skills, defaultCvUrl)
  - `jobTable` (title, description, requirements, jobType, location, salary, deadline, status, createdByClerkId)
  - `applicationTable` (jobId, applicantClerkId, cvUrl snapshot, coverLetter, status) + unique constraint
  - `applicationStatusLogTable` (applicationId, fromStatus, toStatus, reason, changedByClerkId)
  - `companyProfileTable` (singleton: name, logoUrl, description, address)
- [ ] Jalankan `npm run db:generate`
- [ ] Jalankan `npm run db:migrate`
- [ ] Verifikasi tabel di `npm run db:studio`
- [ ] Buat seed script untuk `companyProfileTable` (`scripts/seed.ts`, jalankan `npm run db:seed`)

---

## Phase 2: Auth & Middleware
*Bergantung pada Phase 1 (perlu userProfileTable).*

- [ ] Update `src/app/[locale]/(auth)/layout.tsx`: Clerk `signInUrl`, `signUpUrl`, `afterSignOutUrl` sudah sesuai locale id/en (boilerplate sudah benar)
- [ ] Buat `src/app/api/webhooks/clerk/route.ts`:
  - Handle event `user.created`: buat row `UserProfile`
  - Verifikasi signature dengan svix + `CLERK_WEBHOOK_SECRET`
- [ ] Update `src/proxy.ts` (middleware):
  - Role-based redirect: ADMIN/SUPER_ADMIN → `/admin`, USER tetap di `/dashboard`
  - Block non-admin dari `/admin/*`, redirect ke `/`
  - Block `isActive = false` dari semua protected routes, redirect ke `/`
  - Protect `/admin/*` dan `/dashboard/*`
- [ ] Fix type errors: `locale: string` → `locale: Locale` di semua page/layout
- [ ] Fix tsconfig: hapus `.next/dev/types/**/*.ts` dari include (stale generated file)
- [ ] Test: sign-up sebagai pelamar → redirect ke `/dashboard` ✓
- [ ] Test: setup super admin di Clerk dashboard → redirect ke `/admin` (404 expected) ✓
- [ ] Fix Clerk JWT template: tambahkan `"metadata": "{{user.public_metadata}}"` di Clerk Dashboard → Configure → Sessions

---

## Phase 3: Homepage & Public Job Pages
*Bergantung pada Phase 1 (perlu jobTable) dan Phase 2 (perlu auth untuk tombol apply).*

- [ ] Buat komponen `src/components/jobs/JobCard.tsx`
- [ ] Update `src/app/[locale]/(marketing)/layout.tsx`: navbar dengan menu "Lowongan" + LocaleSwitcher
- [ ] Build homepage `src/app/[locale]/(marketing)/page.tsx`:
  - Section company profile (baca dari `companyProfileTable`)
  - 6 lowongan terbaru (PUBLISHED + deadline > now, createdAt desc)
  - Tombol "Lihat Semua Lowongan"
- [ ] Build `/jobs` listing `src/app/[locale]/(marketing)/jobs/page.tsx`:
  - Pagination 20/page
  - Filter tipe kerja + lokasi via URL params
  - Search keyword via URL params
  - Komponen `src/components/jobs/JobFilters.tsx`
- [ ] Build `/jobs/[id]` detail `src/app/[locale]/(marketing)/jobs/[id]/page.tsx`:
  - Detail lengkap lowongan
  - Tombol "Apply Sekarang" (visible semua, redirect ke sign-in jika belum login)
- [ ] Verifikasi halaman di-render server-side (tidak ada loading flicker untuk konten utama)

---

## Phase 4: Admin Panel — Job Management
*Bergantung pada Phase 2 (perlu auth admin).*

- [ ] Build admin layout `src/app/[locale]/(auth)/admin/layout.tsx`: sidebar navigasi
- [ ] Build dashboard `/admin` `page.tsx`: statistik ringkasan (total jobs, total applications)
- [ ] Buat `src/validations/JobValidation.ts` (Zod schema untuk create/edit job)
- [ ] Buat `src/actions/jobActions.ts`: `createJob`, `updateJob`, `updateJobStatus`
- [ ] Build `/admin/jobs` `page.tsx`: tabel semua lowongan + badge "Expired" untuk lewat deadline
- [ ] Build `/admin/jobs/new` `page.tsx`: form create job menggunakan `JobValidation`
- [ ] Build `/admin/jobs/[id]/edit` `page.tsx`: form edit job
- [ ] Install shadcn/ui components yang diperlukan (Table, Form, Select, Badge, dll.)

---

## Phase 5: Application Flow
*Bergantung pada Phase 3 (perlu halaman job detail) dan Phase 4 (perlu jobs exist di DB).*

- [ ] Setup Uploadthing: buat `src/app/api/uploadthing/route.ts` + `src/libs/Uploadthing.ts`
- [ ] Buat `src/validations/ApplicationValidation.ts`
- [ ] Buat `src/actions/applicationActions.ts`: `applyToJob`
- [ ] Build komponen `src/components/forms/ApplyForm.tsx` (CV upload PDF + cover letter)
- [ ] Integrasikan ApplyForm di `/jobs/[id]`:
  - Tampil form apply jika sudah login
  - Redirect ke sign-in dengan `?redirect=/jobs/[id]` jika belum login
  - Tampil "Sudah Dilamar" jika sudah apply (cek unique constraint)
- [ ] Implementasi redirect-back setelah sign-in (baca query param `redirect`)
- [ ] Buat `src/libs/Resend.ts` + email template "Lamaran Baru"
- [ ] Kirim notifikasi email ke semua admin saat apply berhasil (query Clerk API untuk daftar admin)
- [ ] Build `/admin/jobs/[id]/applicants` `page.tsx`: tabel pelamar + link download CV + current status

---

## Phase 6: Application Status & Notifications
*Bergantung pada Phase 5 (perlu applications exist).*

- [ ] Update `src/actions/applicationActions.ts`: tambahkan `updateApplicationStatus`
  - Validasi apakah perubahan memerlukan reason (lihat definisi di F-05 PRD)
  - Tulis `ApplicationStatusLog` setiap perubahan
- [ ] Buat komponen `src/components/admin/StatusUpdater.tsx`: dropdown/modal update status + field reason
- [ ] Integrasikan StatusUpdater di halaman `/admin/jobs/[id]/applicants`
- [ ] Buat email template "Status Lamaran Diperbarui" (Resend + React Email)
- [ ] Kirim notifikasi email ke pelamar setiap kali status berubah
- [ ] Build `/dashboard` `page.tsx`: summary count per status (Pending, Reviewed, Accepted, Rejected)
- [ ] Build `/dashboard/applications` `page.tsx`: daftar semua lamaran + status + reason terbaru

---

## Phase 7: Applicant Profile & Default CV
*Bergantung pada Phase 2 (perlu auth) dan Phase 5 (terkait CV di apply). Dapat paralel dengan Phase 6.*

- [ ] Buat `src/validations/ProfileValidation.ts`
- [ ] Buat `src/actions/profileActions.ts`: `updateProfile`, `updateDefaultCv`
- [ ] Build `/dashboard/profile` `page.tsx`:
  - Form profil (nama, telepon, kota, skills)
  - Upload CV default dengan Uploadthing
  - Informational banner setelah CV diganti
- [ ] Update `ApplyForm.tsx`: auto-populate CV dari `defaultCvUrl` di profil (jika ada)

---

## Phase 8: Super Admin Features
*Bergantung pada Phase 2 (perlu auth + Clerk webhook working).*

- [ ] Tambahkan SUPER_ADMIN guard di middleware untuk `/admin/company` dan `/admin/users`
- [ ] Buat `src/actions/userActions.ts`: `inviteAdmin`, `toggleAdminStatus`
- [ ] Build `/admin/users` `page.tsx`: daftar admin + status aktif/pending + tombol undang + tombol nonaktifkan
- [ ] Buat `src/validations/CompanyValidation.ts`
- [ ] Buat `src/actions/companyActions.ts`: `updateCompanyProfile`
- [ ] Build `/admin/company` `page.tsx`: form edit company profile + upload logo
- [ ] Update Clerk webhook: handle `organizationInvitation.accepted` → assign role `ADMIN`

---

## Phase 9: i18n — Indonesian & English
*Dapat dimulai setelah Phase 3 selesai. Dapat paralel dengan Phase 7 dan 8.*

- [ ] Bersihkan `id.json` dan `en.json`: hapus semua boilerplate keys
- [ ] Tambahkan semua translation keys untuk public pages (homepage, jobs listing, job detail)
- [ ] Tambahkan translation keys untuk auth pages
- [ ] Tambahkan translation keys untuk dashboard pelamar (semua form, pesan, label)
- [ ] Tambahkan translation keys untuk admin panel
- [ ] Tambahkan translation keys untuk semua email templates (atau buat versi terpisah per bahasa)
- [ ] Test locale switching di semua halaman (ganti ke `/en/` dan balik)
- [ ] Jalankan `npm run check:i18n` untuk verifikasi tidak ada missing keys

---

## Phase 10: Security & Rate Limiting
*Setelah semua fitur core selesai (Phase 5–8).*

- [ ] Extend Arcjet di sign-in/sign-up: tambahkan rate limiting rule
- [ ] Extend Arcjet di `applyToJob` action: cegah spam apply
- [ ] Extend Arcjet di admin routes: tambahkan sliding window rate limit
- [ ] Verifikasi validasi PDF MIME type (bukan hanya ekstensi file)
- [ ] Verifikasi semua Server Actions memiliki auth check (`auth()` dari Clerk)
- [ ] Verifikasi tidak ada sensitive data di client-side bundle (cek Network tab)

---

## Phase 11: Testing
*Setelah semua fitur selesai.*

- [ ] Unit test: semua Zod validation schemas (`src/validations/`)
- [ ] Unit test: helper functions (`src/utils/Helpers.ts`)
- [ ] E2E test (Playwright): register pelamar + email verification flow
- [ ] E2E test: browse jobs + apply flow end-to-end
- [ ] E2E test: admin create job + review applicant + update status
- [ ] E2E test: language toggle switch (ID ↔ EN)
- [ ] Jalankan `npm run test` dan `npm run test:e2e` — semua harus pass

---

## Phase 12: Pre-Deploy Polish
*Terakhir, setelah semua test pass.*

- [ ] Update `src/app/sitemap.ts`: include `/jobs` dan `/jobs/[id]` dynamic routes
- [ ] Tambahkan `metadata` (title, description) di semua halaman publik
- [ ] Cek mobile responsiveness di halaman utama (homepage, /jobs, /jobs/[id], /dashboard/applications)
- [ ] Tambahkan Suspense boundary di halaman yang fetch data
- [ ] Tambahkan proper 404 handling (`not-found.tsx`) untuk `/jobs/[id]` yang tidak exist
- [ ] Deploy ke Vercel
- [ ] **Post-deploy checklist:**
  - [ ] Buat database di Neon (neon.tech), set `DATABASE_URL` ke Neon production DB di Vercel env vars
  - [ ] Set semua env vars Clerk, Uploadthing, Resend di Vercel
  - [ ] Setup Clerk webhook: tambahkan endpoint `https://[domain]/api/webhooks/clerk`
  - [ ] Buat akun super admin pertama via `/sign-up`
  - [ ] Assign role `SUPER_ADMIN` di Clerk dashboard: Users → pilih user → Edit metadata → `{ "role": "SUPER_ADMIN" }`
  - [ ] Login sebagai super admin, isi company profile via `/admin/company`
  - [ ] Smoke test semua critical flows di production
