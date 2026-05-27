# Implementation Plan — Job Portal

Urutan berdasarkan dependency. Setiap fase harus selesai sebelum fase berikutnya dimulai kecuali disebutkan "dapat paralel".

---

## Phase 0: Project Setup & Configuration ✅
*Fondasi. Semua fase lain bergantung pada ini.*

- [x] Bersihkan boilerplate: hapus halaman `counter`, `about`, `portfolio` dan komponen demo
- [x] Update `src/utils/AppConfig.ts`: ganti locales ke `['id', 'en']`, defaultLocale ke `'id'`
- [x] Rename `src/locales/fr.json` → `src/locales/id.json`, update ClerkLocalizations di AppConfig
- [x] Buat project di Clerk, tambahkan env vars
- [x] Setup database lokal PostgreSQL, tambahkan `DATABASE_URL` ke env vars
- [x] Buat akun Uploadthing, tambahkan env vars (`UPLOADTHING_TOKEN`)
- [x] Buat akun Resend, tambahkan `RESEND_API_KEY` ke env vars
- [x] Update `src/libs/Env.ts`: tambahkan semua env vars baru
- [x] Install shadcn/ui: `npx shadcn@latest init`
- [x] Verifikasi `npm run dev` berjalan tanpa error

---

## Phase 1: Database Schema ✅
*Harus selesai sebelum Phase 2 dan seterusnya.*

- [x] Tulis semua schema di `src/models/Schema.ts`:
  - `userProfileTable` (clerkId, isActive, phone, city, skills, defaultCvUrl)
  - `jobTable` (title, description, requirements, jobType, location, salary, deadline, status, createdByClerkId)
  - `applicationTable` (jobId, applicantClerkId, cvUrl snapshot, coverLetter, status, applicantSeen) + unique constraint
  - `applicationStatusLogTable` (applicationId, fromStatus, toStatus, reason, changedByClerkId)
  - `companyProfileTable` (singleton: name, logoUrl, description, address)
- [x] Jalankan `npm run db:generate` + `npm run db:migrate`
- [x] Buat seed script untuk `companyProfileTable`

---

## Phase 2: Auth & Middleware ✅
*Bergantung pada Phase 1 (perlu userProfileTable).*

- [x] Buat `src/app/api/webhooks/clerk/route.ts`: handle `user.created` → buat `UserProfile`
- [x] Update `src/proxy.ts`: role-based redirect, isActive guard, protect `/admin` dan `/dashboard`
- [x] Fix Next.js 16 middleware convention: hapus `src/middleware.ts`, pindahkan `config` ke `src/proxy.ts`
- [x] Pindahkan `ClerkProvider` ke root `[locale]/layout.tsx` (agar SignOutButton berfungsi di semua halaman)
- [x] Tambahkan `/api/uploadthing` ke middleware matcher (agar `auth()` berfungsi di upload route)
- [x] Test: sign-up → `/dashboard` ✓, super admin → `/admin` ✓

---

## Phase 3: Homepage & Public Job Pages ✅
*Bergantung pada Phase 1 + 2.*

- [x] Buat `JobCard.tsx`: badge tipe kerja, lokasi, gaji IDR, deadline, label "Berakhir"
- [x] Build `(marketing)/layout.tsx`: navbar baru — logo, links, auth buttons, sign-out jika login
- [x] Build homepage: company profile hero + 6 lowongan terbaru
- [x] Build `/jobs` listing: search (form GET) + filter tipe (link URL) + pagination
- [x] Build `/jobs/[id]` detail: sidebar info + `ApplyForm` (jika login) atau "Masuk untuk Melamar"
- [x] Bersihkan i18n keys, tambah namespace `Navbar`, `HomePage`, `JobsPage`, `JobDetailPage`, `JobCard`, `JobType`

---

## Phase 4: Admin Panel ✅
*Bergantung pada Phase 2 (perlu auth admin).*

- [x] Build admin layout: sidebar navigasi
- [x] Build `/admin` dashboard: statistik (total/aktif/draft/expired)
- [x] Buat `JobValidation.ts` + `jobActions.ts`: `createJob`, `updateJob`, `updateJobStatus`
- [x] Build `/admin/jobs`: tabel + filter status/tipe/search + pagination
- [x] Build `/admin/jobs/new` dan `/admin/jobs/[id]/edit`: form create/edit lowongan

**Dari Phase 8 (selesai lebih awal):**
- [x] `CompanyValidation.ts` + `companyActions.ts` + `/admin/company`: form edit company profile

**Di luar scope plan asli — Marketing Pages:**
- [x] Halaman publik: `/services`, `/portfolio`, `/about` — konten dari DB
- [x] Tabel singleton: `about_content`, `services_content`, `portfolio_content`
- [x] `PageContentValidation.ts` + `pageActions.ts`
- [x] Admin forms: `/admin/pages/about`, `/admin/pages/services`, `/admin/pages/portfolio`

---

## Phase 5: Application Flow ✅
*Bergantung pada Phase 3 + 4.*

- [x] Setup Uploadthing: `src/app/api/uploadthing/route.ts` + `src/libs/Uploadthing.ts`
  - Fix: token v7 memerlukan field `regions: string[]` — buat `resolveToken()` dengan fallback
  - Fix: `/api/uploadthing` perlu ada di middleware matcher agar `auth()` berfungsi
- [x] Buat `ApplicationValidation.ts`
- [x] Buat `applicationActions.ts`: `applyToJob` (validasi + insert + email ke admin)
- [x] Build `ApplyForm.tsx`: upload CV PDF (Uploadthing) + cover letter + opsi hapus CV
- [x] Integrasikan `ApplyForm` di `/jobs/[id]`:
  - Tampil form jika login; redirect ke sign-in jika belum
  - Banner "Sudah Dilamar" jika sudah apply sebelumnya
- [x] Kirim notifikasi email ke semua admin saat apply (query Clerk API)
- [x] Build `/admin/jobs/[id]/applicants` page: tabel pelamar, status badge, download CV

---

## Phase 6: Application Status & Notifications ✅
*Bergantung pada Phase 5.*

- [x] `updateApplicationStatus` action: update DB + set `applicantSeen = false` + insert `ApplicationStatusLog` + kirim email ke pelamar
- [x] `markApplicationsSeen` action: set `applicantSeen = true` untuk semua lamaran user saat ini
- [x] `cancelApplication` action: delete lamaran PENDING (user dapat apply ulang)
- [x] `StatusUpdateForm` component: dropdown update status (inline di tabel admin applicants)
- [x] `CoverLetterToggle` component: expand/collapse cover letter di tabel admin
- [x] Update `/admin/jobs/[id]/applicants`: tambah kolom cover letter + status update inline + link ke profil
- [x] Buat `/admin/jobs/[id]/applicants/[applicationId]`: profil lengkap pelamar (info pribadi + lamaran + riwayat status)
- [x] Dashboard pelamar (`/dashboard`):
  - Stat cards (Total/Pending/Accepted) — clickable filter by status
  - Tabel lamaran dengan riwayat status per baris (inline, dari `ApplicationStatusLog`)
  - Pagination (10 per halaman)
  - Tombol "Batalkan" untuk lamaran PENDING (dengan inline confirm)
  - `MarkApplicationsSeen` client component — reset badge on mount
- [x] Notifikasi badge di sidebar dashboard: badge merah dengan count `applicantSeen = false`
- [x] Schema migration: tambah `applicantSeen boolean DEFAULT true` ke `applicationTable`

---

## Phase 7: Applicant Profile ✅
*Bergantung pada Phase 2 + 5.*

- [x] `userProfileActions.ts`: `saveUserProfile` (upsert phone, city, skills)
- [x] `ProfileForm.tsx`: form profil (telepon, kota, skills) dengan `useTransition` + sonner toast
- [x] `/dashboard/user-profile`: header (avatar + nama + email dari Clerk) + `ProfileForm` + Clerk `<UserProfile>` panel

---

## Phase 8: Super Admin Features ✅
*Bergantung pada Phase 2.*

- [x] Tambahkan SUPER_ADMIN guard di middleware untuk `/admin/company` dan `/admin/users`
- [x] Buat `src/actions/userActions.ts`: `inviteAdmin`, `toggleAdminStatus`
- [x] Build `/admin/users` `page.tsx`: daftar admin + status aktif/pending + tombol undang + tombol nonaktifkan
- [x] `/admin/company` page *(selesai di Phase 4)*

---

## Phase 9: i18n — Indonesian & English ✅
*Selesai bertahap bersama setiap fase.*

- [x] Semua keys untuk public pages, auth, dashboard, admin panel
- [x] Namespace: `Navbar`, `HomePage`, `JobsPage`, `JobDetailPage`, `JobCard`, `JobType`, `BaseTemplate`, `DashboardLayout`, `DashboardPage`, `ApplyForm`, `JobForm`, `UserProfilePage`, `AdminApplicantsPage`, `AdminApplicantProfilePage`, dll.
- [x] `npm run check:i18n` — no missing/undefined keys ✓

---

## Phase 4b: Content & Branding Polish ✅
*Diluar scope plan asli — dikerjakan setelah Phase 8.*

- [x] **Warna & Font:** `--primary` merah (oklch) di `global.css`; Familjen Grotesk via `next/font/google`
- [x] **Footer kaya:** 3-kolom (logo, menu, kontak + sosial media) di `(marketing)/layout.tsx` — konten dari `companyProfileTable`
- [x] **Company profile diperluas:** tambah kolom `email`, `phone`, `linkedinUrl`, `whatsappNumber`, `instagramUrl` + form admin
- [x] **About — peta interaktif:** `OfficeMapSelector` (client component) + hingga 3 kantor masing-masing dengan URL peta per-kantor
- [x] **About content diperluas:** tambah kolom 3 kantor + `mapEmbedUrl` + form admin
- [x] **Logo klien admin-editable:** tabel `clientLogoTable` baru, `clientLogoActions.ts`, `ClientLogoForm` component, section di `/admin/pages/portfolio`
- [x] **Admin sidebar logo:** tampilkan logo perusahaan dari DB (fallback ke nama / AppConfig.name)
- [x] **Infinite scroll marquee:** `LogoMarquee` component + `@keyframes marquee` di `global.css`; logo public pages fetch dari DB
- [x] **Seed:** 10 logo placeholder + data kantor + kontak perusahaan

---

## Phase 4c: Admin Panel Improvements ✅
*Diluar scope plan asli — dikerjakan setelah Phase 4b.*

- [x] **Application status expansion:** expand enum dari 4 → 8 nilai (PENDING, REVIEWED, INTERVIEWED, ASSESSMENT, OFFERING, ACCEPTED, REJECTED, WITHDRAWN)
  - Migration `0007_*` di-generate dan di-apply
  - `StatusUpdateForm`, `applicationActions.ts`, halaman pelamar, dashboard pelamar semua diperluas ke 8 status
- [x] **Admin dashboard — statistik baru:** stat card "Expiring Soon" (`EXPIRING_SOON_DAYS = 14`) + section New Applicants dengan 4 stat cards clickable (Unreviewed/Reviewed/Ongoing/Closed)
- [x] **Manage Jobs — kolom pelamar:** kolom "Pelamar" dengan angka clickable → halaman pelamar per lowongan
- [x] **Halaman global pelamar:** `/admin/applicants` — semua pelamar lintas lowongan, filter status via URL param, tabel dengan link ke profil
- [x] **Admin nav:** tambah link "Semua Pelamar" untuk semua admin
- [x] **Manage Users extended:** section "Semua Pengguna Terdaftar" di `/admin/users` — nama (clickable), email, jumlah lamaran; link Users nav visible untuk semua admin
- [x] **Halaman profil pengguna:** `/admin/users/[clerkId]` — data pribadi (telepon, kota, skills) + riwayat lamaran

---

## Phase 10: Security & Rate Limiting
*Setelah semua fitur core selesai.*

- [ ] Extend Arcjet di sign-in/sign-up: tambahkan rate limiting rule
- [ ] Extend Arcjet di `applyToJob` action: cegah spam apply
- [ ] Verifikasi validasi MIME type PDF (bukan hanya ekstensi)
- [ ] Verifikasi semua Server Actions memiliki auth check

---

## Phase 11: Testing
*Setelah semua fitur selesai.*

- [ ] Unit test: semua Zod validation schemas (`src/validations/`)
- [ ] Unit test: helper functions
- [ ] E2E test (Playwright): register pelamar + apply flow end-to-end
- [ ] E2E test: admin create job + review applicant + update status
- [ ] E2E test: cancel application flow
- [ ] E2E test: language toggle (ID ↔ EN)

---

## Phase 12: Pre-Deploy Polish
*Terakhir, setelah semua test pass.*

- [ ] Cek mobile responsiveness di halaman utama
- [ ] Tambahkan Suspense boundary di halaman yang fetch data
- [ ] Update `src/app/sitemap.ts`: include `/jobs` dan `/jobs/[id]`
- [ ] Deploy ke Vercel
- [ ] **Post-deploy checklist:**
  - [ ] Setup database Neon, set `DATABASE_URL` di Vercel env vars
  - [ ] Set semua env vars (Clerk, Uploadthing, Resend, Arcjet) di Vercel
  - [ ] Setup Clerk webhook endpoint: `https://[domain]/api/webhooks/clerk`
  - [ ] Konfigurasi Clerk JWT template: tambah `"metadata": "{{user.public_metadata}}"`
  - [ ] Buat akun super admin: sign-up → Clerk dashboard → set `{ "role": "SUPER_ADMIN" }`
  - [ ] Isi company profile via `/admin/company`
  - [ ] Smoke test semua critical flows di production
