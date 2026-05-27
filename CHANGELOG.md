# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Admin Panel Improvements

**Application Status Expansion (4 → 8 statuses):**
- `src/models/Schema.ts`: expand `applicationStatusEnum` ke 8 nilai: PENDING, REVIEWED, INTERVIEWED, ASSESSMENT, OFFERING, ACCEPTED, REJECTED, WITHDRAWN
- `src/components/admin/StatusUpdateForm.tsx`: dropdown update status diperluas ke 8 opsi
- `src/actions/applicationActions.ts`: label email Indonesian untuk semua 8 status
- Badge warna baru: biru untuk INTERVIEWED/ASSESSMENT/OFFERING, kuning untuk REVIEWED, merah untuk REJECTED/WITHDRAWN/ACCEPTED (hijau)
- Dashboard pelamar: filter bar + badge status diperluas ke 8 status
- Migration `0007_*`: `ALTER TYPE application_status ADD VALUE` untuk INTERVIEWED, ASSESSMENT, OFFERING, WITHDRAWN

**Admin Dashboard — Statistik Baru:**
- `src/app/[locale]/(auth)/admin/page.tsx`: tambah stat card "Expiring Soon" (konstanta `EXPIRING_SOON_DAYS = 14`)
- Section baru "New Applicants" dengan 4 stat cards clickable: Unreviewed (PENDING), Reviewed, Ongoing (INTERVIEWED+ASSESSMENT+OFFERING), Closed (ACCEPTED+REJECTED+WITHDRAWN)
- Stat cards New Applicants link ke `/admin/applicants?status=...`

**Manage Jobs — Kolom Pelamar:**
- `src/app/[locale]/(auth)/admin/jobs/page.tsx`: tambah kolom "Pelamar" dengan angka clickable → link ke halaman pelamar per lowongan

**Global Applicants Page (BARU):**
- `src/app/[locale]/(auth)/admin/applicants/page.tsx`: halaman baru — semua pelamar lintas lowongan dengan filter status (All / Unreviewed / Reviewed / Ongoing / Closed)
- Filter via URL search param `?status=` — pills linkable dan shareable
- Tabel: nama pelamar (→ profil per-job), judul lowongan (→ halaman pelamar per job), status badge, tanggal, download CV
- `AdminNav`: tambah link "Semua Pelamar" (`/admin/applicants`) — visible untuk semua admin (ADMIN + SUPER_ADMIN)

**Manage Users — Extended:**
- `src/app/[locale]/(auth)/admin/users/page.tsx`: tambah section "Semua Pengguna Terdaftar" — tabel nama (link → profil), email, jumlah lamaran
- `AdminNav`: link "Kelola Admin" sekarang tampil untuk semua admin (bukan hanya SUPER_ADMIN)
- `src/app/[locale]/(auth)/admin/layout.tsx`: pass `isAdmin` (ADMIN || SUPER_ADMIN) ke `AdminNav`

**User Profile Page for Admin (BARU):**
- `src/app/[locale]/(auth)/admin/users/[clerkId]/page.tsx`: halaman profil pengguna — nama, email, informasi pribadi (telepon, kota, skills), riwayat semua lamaran dengan status badge + download CV
- Back link ke `/admin/users`

**i18n:**
- Namespace baru: `AdminAllApplicantsPage` (filter pills, header kolom, empty state)
- Namespace baru: `AdminUserProfilePage` (judul section, label field, header kolom)
- Tambahan `AdminDashboard`: `expiring_jobs`, `new_applicants_title`, `unreviewed_label`, `reviewed_label`, `ongoing_label`, `closed_label`
- Tambahan `AdminJobsPage`: `table_applicants`
- Tambahan `AdminApplicantsPage`: `status_interviewed`, `status_assessment`, `status_offering`, `status_withdrawn`
- Tambahan `AdminUsersPage`: `all_users_title`, `col_applications`, `no_users`
- Tambahan `DashboardPage`: 4 keys status baru (interviewed, assessment, offering, withdrawn)
- Tambahan `AdminLayout`: `nav_applicants`

---

### Content & Branding Polish

**Warna & Font:**
- `src/styles/global.css`: ubah `--primary` dari near-black menjadi merah (`oklch(0.45 0.207 25)`) + sesuaikan `--ring`
- `src/app/[locale]/layout.tsx`: ganti font dasar ke **Familjen Grotesk** (Google Fonts via `next/font/google`, variable `--font-sans`)

**Footer kaya:**
- `src/app/[locale]/(marketing)/layout.tsx`: footer 3-kolom — logo perusahaan, link menu, kontak (alamat/email/telepon) + ikon sosial media inline SVG (LinkedIn, WhatsApp, Instagram)
- Konten footer diambil dari `companyProfileTable`; i18n namespace `Footer` + key `home_link` di namespace `Navbar`

**Halaman About — peta interaktif:**
- `src/components/about/OfficeMapSelector.tsx`: Client Component baru — kartu alamat kantor clickable, Google Maps iframe pre-render dengan CSS show/hide (tanpa reload peta)
- `src/app/[locale]/(marketing)/about/page.tsx`: integrasi `OfficeMapSelector` (maksimal 3 kantor)
- `src/app/[locale]/(auth)/admin/pages/about/page.tsx`: tambah 3 slot kantor (nama, alamat, URL peta) + URL embed global

**Schema baru / perluasan:**
- `companyProfileTable`: tambah kolom `email`, `phone`, `linkedinUrl`, `whatsappNumber`, `instagramUrl`
- `aboutContentTable`: tambah kolom `office1Name/Address/MapUrl`, `office2Name/Address/MapUrl`, `office3Name/Address/MapUrl`, `mapEmbedUrl`
- `clientLogoTable` (BARU): `id uuid`, `logoUrl varchar(512)`, `altText varchar(256)?`, `createdAt timestamp`
- Migration `0003` – `0006` di-generate dan di-apply

**Logo klien — admin-editable:**
- `src/actions/clientLogoActions.ts`: `addClientLogo` (validasi Zod URL) + `deleteClientLogo`
- `src/components/admin/ClientLogoForm.tsx`: Client Component — input URL + nama opsional + submit dengan pending state
- `src/app/[locale]/(auth)/admin/pages/portfolio/page.tsx`: section "Jaringan Klien & Mitra" — form tambah logo + grid logo yang ada + tombol hapus per logo
- Halaman publik (`/` dan `/portfolio`): logo diambil dari `clientLogoTable` via `db.select()` (menggantikan file hardcoded `src/data/clientLogos.ts` yang dihapus)
- `scripts/seed.ts`: tambah 10 logo placeholder ke `clientLogoTable`

**Admin sidebar logo:**
- `src/app/[locale]/(auth)/admin/layout.tsx`: query `companyProfileTable`, tampilkan logo perusahaan (`<img>`) jika `logoUrl` ada, fallback ke nama perusahaan atau `AppConfig.name`

**Infinite scroll marquee (homepage):**
- `src/styles/global.css`: tambah `@keyframes marquee`
- `src/components/marketing/LogoMarquee.tsx`: komponen baru — logo array di-duplikasi untuk loop mulus, durasi animasi adaptif berdasarkan jumlah logo, edge fade via CSS mask, pause on hover (`group-hover`)
- Homepage (`/`): section klien menggunakan `LogoMarquee`, hanya tampil jika ada logo di DB

**i18n:**
- Namespace baru: `Footer` (6 keys)
- Tambahan `AdminPortfolioPage`: 9 keys untuk client logos section
- Tambahan `AdminAboutPage`: keys office/map
- Tambahan `AdminCompanyPage`: keys kontak + sosial media
- Tambahan `Navbar.home_link`, `HomePage.clients_*`, `PortfolioPage.clients_*`

### Phase 8: Super Admin Features
- `src/proxy.ts`: tambah `isSuperAdminRoute` matcher — `/admin/users` dan `/admin/company` hanya bisa diakses SUPER_ADMIN; ADMIN redirect ke `/admin`
- `src/actions/userActions.ts`: `inviteAdmin` (Clerk Invitation API) + `toggleAdminStatus` (toggle `isActive` di DB)
- `src/app/[locale]/(auth)/admin/users/page.tsx`: tabel admin aktif (nama, email, role badge, status aktif/nonaktif) + tabel undangan tertunda (dari Clerk) + form undang admin baru
- `src/components/admin/InviteAdminForm.tsx`: form email + submit, toast sukses/error
- `src/components/admin/ToggleAdminStatusButton.tsx`: tombol aktifkan/nonaktifkan admin dengan inline confirm
- `src/components/admin/AdminNav.tsx`: tambah link "Kelola Admin" — hanya tampil untuk SUPER_ADMIN (via prop dari layout)
- `src/app/[locale]/(auth)/admin/layout.tsx`: ambil role dari `sessionClaims`, pass `isSuperAdmin` ke `AdminNav`
- i18n: tambah namespace `AdminUsersPage` (27 keys) + `nav_users` ke namespace `AdminLayout`

### Phase 7: Applicant Profile
- `src/actions/userProfileActions.ts`: `saveUserProfile` — upsert telepon, kota, skills ke `userProfileTable`
- `src/components/forms/ProfileForm.tsx`: form profil pelamar dengan `useTransition` + sonner toast
- `src/app/[locale]/(auth)/dashboard/user-profile/[[...user-profile]]/page.tsx`: header (avatar, nama, email dari Clerk) + `ProfileForm` + Clerk `<UserProfile>` panel untuk account management

### Phase 6: Application Status & Notifications
**Admin applicants page:**
- `/admin/jobs/[id]/applicants`: tambah kolom Cover Letter (toggle expand/collapse), status update inline via dropdown, nama pelamar jadi link ke profil
- `/admin/jobs/[id]/applicants/[applicationId]`: halaman profil lengkap pelamar — informasi pribadi (telepon, kota, skills dari `userProfileTable`), detail lamaran, cover letter, riwayat status
- `src/components/admin/StatusUpdateForm.tsx`: dropdown status + tombol Save, revalidate pada perubahan
- `src/components/admin/CoverLetterToggle.tsx`: toggle expand/collapse cover letter

**Actions:**
- `updateApplicationStatus`: update status di DB → set `applicantSeen = false` → insert `ApplicationStatusLog` → kirim email ke pelamar via Resend
- `markApplicationsSeen`: set `applicantSeen = true` untuk semua lamaran milik user saat ini
- `cancelApplication`: delete lamaran yang masih PENDING (pelamar dapat apply ulang)

**Dashboard pelamar:**
- Stat cards clickable (filter by status) + tabel lamaran dengan history inline per baris
- Pagination: 10 lamaran per halaman, URL-based (`?page=`)
- Tombol "Batalkan" per baris (hanya PENDING) dengan inline confirm dua langkah
- `MarkApplicationsSeen` client component: fire `markApplicationsSeen()` on mount untuk reset badge
- Notifikasi badge merah di sidebar (count `applicantSeen = false`) — hilang setelah dashboard dikunjungi

**Schema:**
- Tambah kolom `applicantSeen boolean DEFAULT true` ke `applicationTable`
- Migration `0002_sticky_vertigo.sql` di-generate dan di-apply

**i18n:**
- Tambah keys `DashboardPage`: `cancel_application`, `confirm_cancel`, `cancel_confirm_yes`, `cancel_confirm_no`, `history_title`, `page_info`, `page_prev`, `page_next`
- Tambah keys `AdminApplicantsPage`: `col_cover_letter`, `view_cover_letter`, `hide_cover_letter`, `update_status`, `status_*`
- Tambah namespace `AdminApplicantProfilePage` (14 keys)

### Phase 5: Application Flow
- `src/app/api/uploadthing/route.ts` + `src/libs/Uploadthing.ts`: CV upload (PDF, max 4MB)
  - Fix token format: UploadThing v7 memerlukan `regions: string[]` di token payload
  - Fix middleware: tambah `/api/uploadthing` ke matcher di `proxy.ts` agar `auth()` berfungsi
- `src/validations/ApplicationValidation.ts`: Zod schema (jobId uuid, cvUrl url, coverLetter 50–2000 chars)
- `src/actions/applicationActions.ts`: `applyToJob` — validasi → insert (onConflictDoNothing) → email notifikasi admin
- `src/components/forms/ApplyForm.tsx`: upload CV PDF + hapus CV + textarea cover letter + submit
- `/jobs/[id]`: `ApplyForm` terintegrasi — tampil jika login, banner "Sudah Dilamar" jika sudah apply
- `/admin/jobs/[id]/applicants`: tabel pelamar (nama, email dari Clerk, status badge, tanggal, download CV)
- Notifikasi email ke admin saat ada lamaran baru (query Clerk API untuk daftar admin)
- `applicants_button` di admin jobs table: link ke halaman pelamar
- Tambah `remove_cv` ke `ApplyForm` i18n namespace

---

## [0.0.2] - 2026-05-22

### Phase 4: Admin Panel & Marketing Pages

**Admin Job Management:**
- `/admin`: dashboard statistik (total/aktif/draft/expired)
- `/admin/jobs`: tabel kelola lowongan — filter (status aktif/draft/inactive/expired, tipe kerja, search), sort, pagination
- Status workflow: `DRAFT → PUBLISHED → INACTIVE`, tombol dua-langkah inline confirm
- Toast notification via URL param (`?toast=KEY`) + `ToastFromUrl` client component
- Form buat/edit lowongan dengan validasi Zod (`JobValidation.ts`)
- `/admin/company`: form edit profil perusahaan (upsert singleton)

**Marketing Pages (publik):**
- `/services`: hero + 4 kartu layanan + CTA — konten dari DB
- `/portfolio`: hero + 3 statistik + 3 pencapaian + CTA — konten dari DB
- `/about`: hero + visi/misi + 3 nilai + alamat + CTA — konten dari DB
- Navbar marketing: tambah link Services, Portfolio, About Us

**Admin — Kelola Halaman Marketing:**
- 3 tabel singleton baru: `about_content`, `services_content`, `portfolio_content`
- Migration `0001_busy_tinkerer.sql`
- `PageContentValidation.ts` + `pageActions.ts`
- `/admin/pages/about`, `/admin/pages/services`, `/admin/pages/portfolio`

### Phase 3: Homepage & Public Job Pages
- `JobCard.tsx`: badge tipe kerja, lokasi, gaji IDR, deadline, label "Berakhir"
- Navbar marketing baru: logo, link Lowongan/Services/Portfolio/About, auth links, sign-out
- Homepage: company profile hero + 6 lowongan terbaru
- `/jobs` listing: search (form GET) + filter tipe (link URL) + pagination prev/next
- `/jobs/[id]` detail: sidebar info + tombol apply/sign-in
- i18n: namespace `Navbar`, `HomePage`, `JobsPage`, `JobDetailPage`, `JobCard`, `JobType`
- Fix `proxy.ts`: `clerkMiddleware` selalu berjalan — diperlukan agar `auth()` tersedia di halaman publik

### Phase 2: Auth & Middleware
- `proxy.ts`: proteksi `/admin/*` dan `/dashboard/*`, role redirect, isActive guard
- `api/webhooks/clerk/route.ts`: `user.created` → insert `UserProfile`
- `ClerkProvider` dipindahkan ke root `[locale]/layout.tsx`
- Fix Next.js 16: hapus `src/middleware.ts`, pindahkan `config` ke `src/proxy.ts`

### Phase 1: Database Schema
- Schema: 5 tabel (userProfile, job, application, applicationStatusLog, companyProfile)
- 3 enum: `job_type`, `job_status`, `application_status`
- Unique constraint: `application(jobId, applicantClerkId)`
- Migration `0000_remarkable_boomer.sql`

---

## [0.0.1] - 2026-05-22

### Added
- Initial project setup dari Next.js boilerplate (ixartz/Next.js-Boilerplate)
- Stack: Next.js 16, Tailwind CSS v4, TypeScript, Clerk, Drizzle ORM, next-intl, Arcjet, Logtape
- Project documentation: PRD, architecture, decisions, conventions, plan
