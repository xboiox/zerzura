# Project Context — Job Portal

Dokumen ini adalah referensi cepat untuk memulai sesi development atau onboarding.

---

## Apa Ini

Job portal web app untuk satu perusahaan. Dua fungsi utama:
1. **Admin** posting dan mengelola lowongan kerja, mereview pelamar
2. **Pelamar** mencari dan melamar pekerjaan, memantau status lamaran secara real-time

## Status Saat Ini

**Fase:** Phase 8 + Admin Panel Improvements selesai ✅
**Selesai:** Phase 0–8 (termasuk Phase 7 & 9) + Admin Panel Improvements

**Fitur yang sudah live:**
- Auth & middleware (Clerk, role redirect, isActive guard)
- Halaman publik: homepage, /jobs listing (search + filter + pagination), /jobs/[id] detail
- Halaman marketing: /services, /portfolio, /about — konten dari DB
- Admin: manage jobs (CRUD, status workflow) + kolom jumlah pelamar per lowongan (clickable)
- Admin: manage marketing pages, company profile
- Admin: daftar pelamar per lowongan, update status lamaran (8 status), lihat cover letter, lihat profil pelamar
- Admin: dashboard dengan stat cards Job (total/published/draft/expired/expiring) + New Applicants (Unreviewed/Reviewed/Ongoing/Closed — clickable)
- Admin: halaman global semua pelamar `/admin/applicants` dengan filter status (Unreviewed/Reviewed/Ongoing/Closed)
- Admin: halaman profil pengguna `/admin/users/[clerkId]` — data pribadi (telepon, kota, skills) + riwayat lamaran
- Admin: halaman Manage Users dengan daftar admin, undangan tertunda, dan semua pengguna terdaftar (nama + jumlah lamaran)
- Pelamar: apply (upload CV via Uploadthing + cover letter), batalkan lamaran (PENDING only)
- Pelamar: dashboard (stat cards + filter by status + pagination), riwayat status tiap lamaran (8 status)
- Pelamar: My Profile (data pribadi: telepon, kota, skills + Clerk account management)
- Notifikasi email ke admin saat ada lamaran baru
- Notifikasi email ke pelamar saat status lamaran berubah
- Notifikasi in-app: badge merah di sidebar pelamar untuk status yang belum dilihat
- Super admin: undang admin baru (Clerk Invitation API), aktifkan/nonaktifkan admin, lihat daftar admin dan undangan tertunda
- Branding merah sesuai logo PTNIP; font Familjen Grotesk (Google Fonts)
- Footer kaya: 3-kolom (logo, menu, kontak + sosial media) — konten dari DB
- Halaman About: peta interaktif per kantor (klik alamat → ganti iframe Google Maps)
- Logo klien/mitra: admin-editable (tambah/hapus via `/admin/pages/portfolio`), infinite scroll marquee di homepage & portfolio

**Phase 2 manual steps: selesai ✅**
- Clerk JWT template dikonfigurasi (`metadata` masuk ke session claims)
- Clerk webhook aktif → `user.created` → insert `UserProfile` (verified: row terbuat di DB)
- Sign-up pelamar → redirect ke `/dashboard` ✓
- Super admin → redirect ke `/admin` ✓

## Tiga Role

| Role | Cara Buat | Kemampuan |
|---|---|---|
| `SUPER_ADMIN` | Manual via Clerk dashboard (post-deploy) | Semua + kelola admin + edit company profile |
| `ADMIN` | Diundang oleh super admin via Clerk Invitation API | Post job + review applicants + update status |
| `USER` | Register sendiri via `/sign-up` | Browse + apply + pantau status + batalkan lamaran PENDING |

Role disimpan di Clerk `publicMetadata.role`. Default (tidak ada value) = USER.

## Database: 9 Tabel

```
UserProfile          → data extra user (profil pelamar: telepon/kota/skills, isActive admin)
Job                  → lowongan (DRAFT/PUBLISHED/INACTIVE)
Application          → lamaran + CV snapshot URL + applicantSeen (notifikasi) + status (8 nilai)
ApplicationStatusLog → audit trail setiap perubahan status (diisi oleh updateApplicationStatus)
CompanyProfile       → singleton: nama, deskripsi, alamat, logo, kontak, sosial media
AboutContent         → singleton: konten halaman About Us (visi, misi, nilai, 3 kantor + peta)
ServicesContent      → singleton: konten halaman Services (kartu layanan, CTA)
PortfolioContent     → singleton: konten halaman Portfolio (statistik, pencapaian)
ClientLogo           → logo klien/mitra (unlimited rows, admin-editable)
```

Skema lengkap: [docs/architecture.md](architecture.md)

## Workflow Utama

### Pelamar Apply
1. Browse `/jobs` → klik lowongan → `/jobs/[id]`
2. Klik "Lamar Sekarang" (login required → redirect ke sign-in dulu)
3. `ApplyForm`: upload CV PDF via Uploadthing, tulis cover letter, submit
4. `applyToJob` action: validasi Zod → insert `applicationTable` → kirim email ke admin
5. Redirect ke `/jobs/[id]?applied=1` (banner konfirmasi)

### Admin Update Status
1. `/admin/jobs/[id]/applicants` → lihat daftar pelamar
2. Klik nama pelamar → `/admin/jobs/[id]/applicants/[applicationId]` (profil lengkap)
   - Atau update inline via dropdown `StatusUpdateForm` di tabel
3. `updateApplicationStatus` action: update DB → insert `ApplicationStatusLog` → set `applicantSeen = false` → kirim email ke pelamar
4. Status tersedia: PENDING → REVIEWED → INTERVIEWED → ASSESSMENT → OFFERING → ACCEPTED/REJECTED/WITHDRAWN

### Admin Lihat Semua Pelamar
1. Sidebar admin → klik "Semua Pelamar" → `/admin/applicants`
2. Filter via pill: All / Unreviewed / Reviewed / Ongoing / Closed (URL-based)
3. Tabel pelamar lintas semua lowongan: nama, lowongan, status, tanggal, CV
4. Klik nama pelamar → `/admin/jobs/[id]/applicants/[applicationId]` (profil per-job)

### Admin Lihat Profil Pengguna
1. `/admin/users` → section "Semua Pengguna Terdaftar" → klik nama user
2. `/admin/users/[clerkId]` → informasi pribadi (telepon, kota, skills dari UserProfile) + riwayat semua lamaran

### Notifikasi In-App Pelamar
1. Badge merah di sidebar: query `applicationTable` where `applicantSeen = false`
2. Pelamar buka dashboard → `MarkApplicationsSeen` client component fire `markApplicationsSeen()` on mount
3. Next navigation: badge hilang (layout re-render server-side, semua `applicantSeen = true`)

### Cancel Application
1. Pelamar di dashboard klik "Batalkan" (hanya PENDING)
2. Inline confirm: "Ya, batalkan" / "Batal"
3. `cancelApplication` action: delete record → `revalidatePath('/dashboard')`
4. User bisa apply lagi ke lowongan yang sama

## Keputusan Kunci

| Topik | Keputusan |
|---|---|
| Auth | Clerk (bukan NextAuth) — boilerplate sudah include |
| ORM | Drizzle (bukan Prisma) — boilerplate sudah include |
| i18n | URL-based (`/` = ID, `/en/` = EN), bukan cookie |
| Expired jobs | Query filter `deadline > now()`, bukan cron job |
| Admin emails | Query Clerk API saat diperlukan, tidak disimpan di DB |
| CV storage | URL snapshot di tabel Application — file tidak pernah dihapus |
| Admin deaktivasi | `isActive` field di DB, dicek di middleware |
| Notifikasi in-app | `applicantSeen` boolean di `applicationTable`, reset ke false setiap status update |
| Middleware entry | `src/proxy.ts` (Next.js 16 convention, bukan `middleware.ts`) |
| ClerkProvider | Di root `[locale]/layout.tsx` — wajib agar `SignOutButton` berfungsi di semua halaman |

Detail semua keputusan: [docs/decisions.md](decisions.md)

## File Penting

| File | Fungsi |
|---|---|
| `src/models/Schema.ts` | Semua Drizzle table definitions |
| `src/libs/Env.ts` | Semua environment variable definitions |
| `src/utils/AppConfig.ts` | Config app (locales, nama, dll) |
| `src/proxy.ts` | Clerk middleware (selalu berjalan), auth guard, role redirect, isActive check |
| `src/app/[locale]/layout.tsx` | Root layout — ClerkProvider, NextIntlClientProvider |
| `src/app/api/webhooks/clerk/route.ts` | Insert UserProfile saat user.created webhook diterima |
| `src/app/api/uploadthing/route.ts` | Uploadthing file handler (CV upload) |
| `src/actions/applicationActions.ts` | `applyToJob`, `updateApplicationStatus`, `markApplicationsSeen`, `cancelApplication` |
| `src/actions/jobActions.ts` | `createJob`, `updateJob`, `updateJobStatus` |
| `src/actions/userProfileActions.ts` | `saveUserProfile` (upsert data pribadi pelamar) |
| `src/components/forms/ApplyForm.tsx` | Form apply (upload CV + cover letter) |
| `src/components/forms/ProfileForm.tsx` | Form profil pelamar (telepon, kota, skills) |
| `src/components/admin/StatusUpdateForm.tsx` | Dropdown update status lamaran (admin) |
| `src/components/admin/CoverLetterToggle.tsx` | Toggle expand/collapse cover letter (admin) |
| `src/components/dashboard/CancelApplicationButton.tsx` | Tombol batalkan lamaran dengan inline confirm |
| `src/components/dashboard/MarkApplicationsSeen.tsx` | Client component — mark notifikasi sebagai seen on mount |
| `src/components/jobs/JobCard.tsx` | Card reusable untuk lowongan di homepage dan /jobs |
| `src/actions/pageActions.ts` | Server actions untuk update konten halaman marketing |
| `src/actions/clientLogoActions.ts` | `addClientLogo`, `deleteClientLogo` |
| `src/components/about/OfficeMapSelector.tsx` | Peta interaktif — klik kantor → ganti iframe Google Maps |
| `src/components/admin/ClientLogoForm.tsx` | Form tambah logo klien (URL + nama opsional) |
| `src/components/marketing/LogoMarquee.tsx` | Infinite scroll marquee logo klien |

## Konvensi Singkat

- Komponen: PascalCase (`JobCard.tsx`)
- Actions: camelCase (`jobActions.ts`)
- Validations: PascalCase + Validation suffix (`JobValidation.ts`)
- Jangan `console.log` — gunakan `logger` dari `src/libs/Logger.ts`
- Server Component by default, `'use client'` hanya jika butuh interaktivitas
- Props: gunakan type `FooProps` — tidak destructure, akses sebagai `props.foo`

Konvensi lengkap: [docs/conventions.md](conventions.md)

## Links Dokumen

| | |
|---|---|
| PRD | [prd.md](../prd.md) |
| Implementation Plan | [plan.md](../plan.md) |
| Architecture | [docs/architecture.md](architecture.md) |
| Decisions | [docs/decisions.md](decisions.md) |
| Conventions | [docs/conventions.md](conventions.md) |
| Testing | [docs/testing.md](testing.md) |
| Changelog | [CHANGELOG.md](../CHANGELOG.md) |
