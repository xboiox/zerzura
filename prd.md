# Product Requirements Document — Job Portal

**Version:** 3.0
**Date:** 2026-05-22
**Status:** Final Draft
**Author:** Solo Developer

---

## Changelog

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 2026-05-21 | Initial draft |
| 2.0 | 2026-05-21 | Role-based admin, homepage company profile, language toggle, hapus soft-delete |
| 3.0 | 2026-05-22 | Sesuaikan dengan boilerplate: Clerk menggantikan NextAuth, Drizzle menggantikan Prisma, URL-based locale, revisi F-01/F-07/F-09, perbaiki routes |

---

## 1. Tujuan Produk

Membangun job portal web application yang mempertemukan **admin/recruiter** yang ingin memposting lowongan kerja dengan **pelamar** yang ingin mencari dan melamar pekerjaan. Produk ini dirancang sebagai MVP yang fungsional end-to-end, dengan fokus pada loop inti: *posting lowongan → pelamar apply → admin memproses lamaran*.

Platform mendukung **dua bahasa (Indonesia dan Inggris)** melalui URL-based locale routing.

### Problem Statement

Recruiter skala kecil dan menengah membutuhkan platform sederhana untuk memposting lowongan dan mengelola pelamar tanpa kompleksitas platform besar. Pelamar membutuhkan tempat untuk menemukan lowongan yang relevan dan melacak status lamaran mereka secara transparan.

### Tujuan Bisnis MVP

- Memvalidasi loop inti: posting → discovery → apply → status update
- Memberikan pengalaman yang lengkap bagi kedua persona tanpa fitur yang belum terbukti dibutuhkan
- Dapat di-deploy dan digunakan nyata sejak hari pertama

---

## 2. Target Pengguna

### Persona 1: Super Admin

- **Peran:** Pemilik atau IT admin yang memiliki akses penuh ke seluruh sistem
- **Kebutuhan utama:** Membuat akun admin untuk staf HR, mengelola konten company profile, serta memiliki semua kemampuan Admin
- **Akun dibuat via:** Sign-up biasa, lalu role di-assign manual melalui Clerk dashboard post-deploy

### Persona 2: Admin / Recruiter

- **Peran:** Staf HR atau hiring manager yang bertanggung jawab membuka lowongan
- **Kebutuhan utama:** Posting lowongan dengan cepat, melihat siapa saja yang melamar, memperbarui status lamaran
- **Akun dibuat via:** Undangan dari super admin melalui Clerk Invitation API
- **Pain point:** Platform besar terlalu kompleks dan berbayar untuk kebutuhan sederhana

### Persona 3: Pelamar (Job Seeker)

- **Peran:** Individu yang sedang mencari pekerjaan
- **Kebutuhan utama:** Menemukan lowongan yang relevan, apply dengan mudah, mengetahui status lamarannya
- **Pain point:** Tidak tahu apakah lamaran sudah dibaca atau diabaikan — tidak ada transparansi status

---

## 3. Tech Stack

| Layer | Teknologi | Keterangan |
|---|---|---|
| Framework | Next.js 16 (App Router) + TypeScript | Sudah di boilerplate |
| Styling | Tailwind CSS v4 + shadcn/ui | Tailwind sudah di boilerplate, shadcn/ui perlu install |
| Database | PostgreSQL via Neon | Perlu setup, sudah didukung boilerplate |
| ORM | Drizzle ORM | Sudah di boilerplate (menggantikan Prisma) |
| Auth | Clerk | Sudah di boilerplate (menggantikan NextAuth.js v5) |
| File Upload | Uploadthing | Perlu install dan konfigurasi |
| Email Notifikasi | Resend + React Email | Perlu install (khusus notifikasi status lamaran) |
| i18n | next-intl | Sudah di boilerplate |
| Rate Limiting | Arcjet | Sudah di boilerplate |
| Logging | Logtape | Sudah di boilerplate |
| Env Validation | @t3-oss/env-nextjs | Sudah di boilerplate |
| Deployment | Vercel | Zero-config untuk Next.js |

---

## 4. User Journey

### Super Admin — Membuat Akun Admin Baru

```
1. Login ke /sign-in dengan kredensial super admin
2. Dashboard → menu "User Management" (/admin/users)
3. Klik "Undang Admin Baru"
4. Isi form: nama lengkap + email
5. Submit → sistem memanggil Clerk Invitation API
6. Clerk mengirim email undangan ke calon admin
7. Admin baru klik link undangan → buat akun di Clerk
8. Clerk webhook otomatis assign role ADMIN
9. Admin baru dapat login dan akses /admin
```

### Admin — Posting Lowongan Baru

```
1. Login di /sign-in → redirect ke /admin
2. Dashboard → klik "Posting Lowongan Baru"
3. Isi form: judul, deskripsi, requirement, tipe kerja, lokasi, gaji (opsional), deadline
4. Pilih status: Draft atau Langsung Publish → Submit
5. Redirect ke halaman detail lowongan dengan konfirmasi sukses
6. Tab "Daftar Pelamar" tersedia untuk dipantau
```

### Pelamar — Menemukan dan Apply Pekerjaan

```
1. Buka homepage → lihat company profile + 6 lowongan terbaru
2. Klik "Lihat Semua Lowongan" atau menu navigasi "Lowongan" → /jobs
3. Browse, search, dan filter lowongan
4. Klik kartu lowongan → halaman detail
5. Klik "Apply Sekarang" → jika belum login, redirect ke /sign-in dengan pesan
6. Daftar via /sign-up → cek email → verifikasi → akun aktif (ditangani Clerk)
7. Login → otomatis redirect kembali ke halaman lowongan yang ingin dilamar
8. Klik "Apply Sekarang" → isi form: upload CV (PDF) + cover letter → Submit
9. Konfirmasi "Lamaran berhasil dikirim" → redirect ke "Lamaran Saya"
10. Pantau status lamaran dari halaman "Lamaran Saya"
```

---

## 5. Fitur MVP

### F-01: Autentikasi & Manajemen Akun

**Deskripsi:** Sistem login berbasis role (SUPER_ADMIN, ADMIN, USER) menggunakan Clerk. Clerk mengelola seluruh alur autentikasi termasuk email verification, session, dan password.

**Acceptance Criteria:**

**Pelamar (role: USER — default):**
- [ ] Pelamar dapat mendaftar via halaman `/sign-up` (Clerk UI)
- [ ] Clerk otomatis mengirim email verifikasi; akun tidak dapat digunakan sebelum email diverifikasi
- [ ] Jika email sudah terdaftar namun belum diverifikasi, Clerk menampilkan notifikasi dan opsi kirim ulang (ditangani Clerk, bukan kode kita)
- [ ] Pelamar login via `/sign-in`; setelah login berhasil redirect ke `/dashboard`

**Admin (role: ADMIN) dan Super Admin (role: SUPER_ADMIN):**
- [ ] Admin tidak dapat mendaftar mandiri; akun dibuat melalui undangan Clerk dari super admin
- [ ] Role disimpan di Clerk `publicMetadata.role`; nilai yang valid: `SUPER_ADMIN`, `ADMIN` (tidak ada nilai = USER biasa)
- [ ] Super admin setup awal: buat akun via `/sign-up` biasa, lalu assign role `SUPER_ADMIN` secara manual melalui Clerk dashboard (`publicMetadata: { "role": "SUPER_ADMIN" }`)
- [ ] Admin login via `/sign-in`; setelah login berhasil redirect ke `/admin`

**Umum:**
- [ ] Satu halaman sign-in (`/sign-in`) untuk semua role; redirect berdasarkan role dilakukan di middleware
- [ ] Session dikelola sepenuhnya oleh Clerk
- [ ] Tombol sign-out tersedia di semua halaman setelah login
- [ ] Halaman `/admin/*` hanya dapat diakses role ADMIN atau SUPER_ADMIN; selain itu redirect ke homepage
- [ ] Halaman `/dashboard/*` hanya dapat diakses pelamar yang sudah login; selain itu redirect ke `/sign-in`
- [ ] Admin yang di-deaktivasi (`isActive = false` di DB) di-redirect ke homepage meski session Clerk masih valid (dicek di middleware)

---

### F-02: Manajemen Lowongan (Admin & Super Admin)

**Deskripsi:** Admin dan super admin dapat membuat, mengedit, dan mengelola status lowongan kerja. Lowongan tidak dapat dihapus.

**Status lowongan:** `Draft` ↔ `Published` ↔ `Inactive`

**Acceptance Criteria:**

- [ ] Admin/super admin dapat membuat lowongan dengan field: judul posisi, deskripsi pekerjaan, persyaratan, tipe kerja (remote/onsite/hybrid), lokasi, rentang gaji (opsional), dan deadline apply
- [ ] Lowongan dapat disimpan sebagai **Draft** atau langsung **Published**
- [ ] Admin/super admin dapat mengubah status lowongan secara bebas: `Draft ↔ Published`, `Published → Inactive`, `Inactive → Published`
- [ ] Lowongan tidak dapat dihapus dari sistem
- [ ] Lowongan yang sudah melewati deadline **tidak** diubah statusnya di database; query publik secara otomatis memfilter `deadline > sekarang`. Di dashboard admin, lowongan tersebut ditampilkan dengan badge **"Expired"**
- [ ] Admin/super admin dapat mengedit semua field lowongan yang sudah ada
- [ ] Dashboard admin menampilkan daftar semua lowongan dengan status masing-masing, termasuk Inactive dan Expired

---

### F-03: Penemuan Lowongan (Pelamar & Publik)

**Deskripsi:** Halaman publik `/jobs` untuk menelusuri dan mencari lowongan yang aktif.

**Acceptance Criteria:**

- [ ] Halaman `/jobs` menampilkan semua lowongan berstatus Published DAN `deadline > sekarang`
- [ ] Lowongan diurutkan secara default dari yang terbaru (`createdAt` descending)
- [ ] Setiap kartu lowongan menampilkan: judul, lokasi, tipe kerja, dan deadline
- [ ] Tersedia filter berdasarkan: tipe kerja (remote/onsite/hybrid) dan lokasi
- [ ] Tersedia search berdasarkan keyword judul atau deskripsi lowongan
- [ ] Filter dan search dapat dikombinasikan
- [ ] Hasil filter/search tercermin di URL (query params) agar bisa di-bookmark dan dibagikan
- [ ] Halaman listing mendukung pagination (20 lowongan per halaman)
- [ ] Halaman detail lowongan menampilkan semua informasi lengkap
- [ ] Halaman `/jobs` dan detail lowongan dapat diakses tanpa login (SEO-friendly, Server-Side Rendered)

---

### F-04: Proses Lamaran (Pelamar)

**Deskripsi:** Pelamar yang sudah login dapat melamar pekerjaan dengan mengunggah CV dan cover letter.

**Acceptance Criteria:**

- [ ] Tombol "Apply Sekarang" terlihat oleh semua pengunjung
- [ ] Saat tombol diklik oleh pengguna yang belum login, mengarahkan ke `/sign-in` dengan pesan kontekstual
- [ ] Setelah login berhasil, pengguna otomatis diarahkan kembali ke halaman lowongan yang ingin dilamar (via `redirect` query param)
- [ ] Form apply memuat: upload file CV (format PDF, maksimal 5MB) dan input cover letter (teks, maksimal 1000 karakter)
- [ ] Sistem menolak file selain PDF dengan pesan error yang jelas (validasi MIME type, bukan hanya ekstensi)
- [ ] CV yang diupload saat apply tersimpan sebagai snapshot URL tetap di tabel Application; perubahan CV default di profil tidak memengaruhi lamaran yang sudah dikirim
- [ ] Setelah submit, pelamar melihat konfirmasi "Lamaran berhasil dikirim"
- [ ] Satu pelamar hanya dapat melamar satu lowongan yang sama satu kali; tombol apply berubah menjadi "Sudah Dilamar" jika sudah apply
- [ ] Semua pengguna dengan role ADMIN dan SUPER_ADMIN menerima notifikasi email via Resend saat ada lamaran baru (alamat email diambil dari Clerk API)

---

### F-05: Pelacakan Lamaran

**Deskripsi:** Pelamar dapat memantau status lamarannya, dan admin dapat memperbarui status beserta alasan saat diperlukan.

**Status yang tersedia:** `Pending` → `Reviewed` → `Accepted` / `Rejected`

**Definisi perubahan yang memerlukan reason:**
Reason **wajib diisi** untuk semua perubahan status **kecuali** tiga arah maju alami berikut:
- `Pending → Reviewed`
- `Reviewed → Accepted`
- `Reviewed → Rejected`

Semua perubahan lain (termasuk `Accepted → Rejected`, `Rejected → Reviewed`, `Accepted → Reviewed`, `Reviewed → Pending`, dll.) wajib menyertakan reason.

**Acceptance Criteria:**

- [ ] Pelamar memiliki halaman "Lamaran Saya" yang menampilkan semua lamaran yang pernah dikirim
- [ ] Setiap entri menampilkan: nama lowongan, tanggal apply, status terkini, dan reason terbaru dari admin (jika ada)
- [ ] Admin/super admin dapat melihat daftar semua pelamar untuk setiap lowongan
- [ ] Admin/super admin dapat mengubah status lamaran ke status manapun
- [ ] Saat perubahan status memerlukan reason (lihat definisi di atas), field reason wajib diisi sebelum perubahan disimpan
- [ ] Setiap perubahan status ditulis ke tabel `ApplicationStatusLog`
- [ ] Reason yang diisi admin ditampilkan di halaman "Lamaran Saya" milik pelamar dan disertakan dalam email notifikasi
- [ ] Pelamar menerima notifikasi email setiap kali status lamarannya diperbarui
- [ ] Email notifikasi menyebutkan nama posisi, status terbaru, dan reason (jika ada) secara eksplisit

---

### F-06: Profil Pelamar

**Deskripsi:** Pelamar memiliki profil dasar untuk menyimpan informasi pribadi dan CV default.

**Acceptance Criteria:**

- [ ] Pelamar dapat mengisi dan mengedit: nama lengkap, nomor telepon, kota domisili, dan daftar skill (tag/teks bebas)
- [ ] Pelamar dapat mengupload CV default yang otomatis terisi di form apply
- [ ] CV default dapat diganti kapan saja
- [ ] Setelah CV default berhasil diganti, sistem menampilkan informational banner: *"CV kamu telah diperbarui. Lamaran yang sudah dikirim sebelumnya menggunakan CV lama dan tidak ikut berubah."*
- [ ] File CV lama di Uploadthing **tidak dihapus** saat CV default diganti; hanya referensi URL di profil yang diperbarui
- [ ] Profil tidak wajib diisi untuk bisa apply — semua field bersifat opsional

---

### F-07: User Management (Super Admin)

**Deskripsi:** Super admin dapat mengundang dan mengelola akun admin menggunakan Clerk Invitation API.

**Acceptance Criteria:**

- [ ] Super admin memiliki menu "User Management" di dashboard yang tidak terlihat oleh role ADMIN biasa
- [ ] Super admin dapat mengundang admin baru dengan mengisi nama lengkap dan email
- [ ] Setelah form disubmit, sistem memanggil Clerk Invitation API; Clerk mengirim email undangan ke calon admin (bukan Resend)
- [ ] Calon admin klik link undangan → buat akun di Clerk → Clerk webhook assign role `ADMIN` di `publicMetadata`
- [ ] Super admin dapat melihat daftar semua akun admin beserta statusnya (aktif / undangan pending)
- [ ] Super admin dapat menonaktifkan akun admin (`isActive = false`); akun yang dinonaktifkan di-redirect ke homepage oleh middleware meski session Clerk masih valid
- [ ] Tidak ada mekanisme promosi akun pelamar (USER) menjadi admin

---

### F-08: Homepage & Company Profile

**Deskripsi:** Homepage menampilkan profil perusahaan pemilik job portal dan 6 lowongan terbaru. Konten company profile hanya dapat dikelola oleh super admin.

**Acceptance Criteria:**

- [ ] Homepage (`/`) menampilkan section company profile: nama perusahaan, logo, deskripsi singkat, dan alamat
- [ ] Di bawah company profile, homepage menampilkan 6 lowongan terbaru berstatus Published dan belum expired, diurutkan `createdAt` descending
- [ ] Terdapat tombol "Lihat Semua Lowongan" yang mengarahkan ke `/jobs`
- [ ] Navigasi utama memiliki menu "Lowongan" yang mengarahkan ke `/jobs`
- [ ] Super admin dapat mengedit konten company profile dari halaman `/admin/company`
- [ ] Halaman `/admin/company` hanya dapat diakses role SUPER_ADMIN

---

### F-09: Language Toggle (ID/EN)

**Deskripsi:** Platform mendukung dua bahasa melalui URL-based locale routing menggunakan next-intl. Bahasa Indonesia adalah default.

**Acceptance Criteria:**

- [ ] Bahasa Indonesia (default) menggunakan URL tanpa prefix: `/`, `/jobs`, `/jobs/[id]`
- [ ] Bahasa Inggris menggunakan prefix `/en/`: `/en/`, `/en/jobs`, `/en/jobs/[id]`
- [ ] LocaleSwitcher tersedia di navbar semua halaman; mengubah URL locale saat dipilih
- [ ] Seluruh UI labels, navigasi, placeholder, tombol, dan pesan sistem tersedia dalam kedua bahasa
- [ ] Konten yang ditulis admin (judul lowongan, deskripsi, requirement) tidak diterjemahkan
- [ ] Default bahasa adalah Indonesia

---

## 6. Fitur yang Sengaja Di-exclude dari MVP

| Fitur | Alasan Exclude |
|---|---|
| AI/algoritma job matching | Butuh data historis dan model; overkill sebelum ada user base |
| Messaging real-time recruiter ↔ pelamar | WebSocket menambah kompleksitas infrastruktur signifikan |
| Resume builder in-app | Scope tersendiri yang bisa jadi produk mandiri |
| Skill assessment / tes online | Butuh sistem soal, timer, dan scoring engine terpisah |
| Interview scheduling terintegrasi | Integrasi Google Calendar API punya kompleksitas OAuth tersendiri |
| Social network / koneksi antar pengguna | Di luar scope job portal murni |
| Salary insight & benchmark | Butuh data aggregasi yang belum tersedia |
| Login via Google / OAuth sosial | Nice-to-have, bisa ditambahkan di iterasi berikutnya |
| Job alert otomatis per keyword | Butuh cron job dan subscription management; masuk iterasi kedua |
| Promosi akun pelamar menjadi admin | Admin hanya bisa dibuat langsung oleh super admin via undangan |
| Terjemahan konten lowongan (bilingual posting) | Beban tambahan bagi admin; cukup terjemahkan UI labels |
| Vercel Cron untuk auto-expire lowongan | Butuh konfigurasi tambahan; query filter sudah cukup untuk MVP |

---

## 7. Asumsi

### Asumsi Bisnis

1. **Role-based access** — Tiga role: SUPER_ADMIN, ADMIN, USER. Role disimpan di Clerk `publicMetadata`.
2. **Lowongan dari satu perusahaan** — Seluruh lowongan berasal dari satu perusahaan yang sama.
3. **Tidak ada payment/monetisasi** — MVP tidak menyertakan fitur berbayar atau premium.

### Asumsi Teknis

4. **Super admin setup manual** — Setelah deploy pertama, super admin buat akun via `/sign-up` biasa, lalu IT admin set role `SUPER_ADMIN` di Clerk dashboard. Tidak ada halaman setup atau DB seed untuk ini.
5. **DB seed untuk CompanyProfile** — Satu-satunya data yang perlu di-seed adalah entri default `CompanyProfile` agar homepage tidak kosong.
6. **CV file retention** — File CV di Uploadthing tidak pernah dihapus secara programatik; hanya referensi URL yang diperbarui. Ini menjamin snapshot CV di lamaran lama tetap valid.
7. **Expired jobs via query filter** — Lowongan kedaluwarsa tidak diubah statusnya di DB; disaring di query level (`deadline > now()`).
8. **Admin email via Clerk API** — Alamat email admin untuk notifikasi diambil dari Clerk API saat dibutuhkan, tidak disimpan di DB kita.
9. **File storage cukup dengan Uploadthing free tier** — Volume CV di fase awal tidak melebihi 2GB.
10. **Email cukup dengan Resend free tier** — 3000 email/bulan cukup untuk fase awal.

### Asumsi Pengguna

11. **Pelamar menggunakan desktop atau mobile browser** — Tidak ada rencana native app.
12. **Pelamar memiliki CV dalam format PDF** — Tidak ada tools convert in-app.
13. **Admin aktif memantau dashboard** — Tidak ada SLA atau auto-escalation.

---

## 8. Page Routes

Semua route berada di dalam `src/app/[locale]/`. Dengan `localePrefix: 'as-needed'`, default locale (id) tidak menambahkan prefix di URL.

```
/                              → Homepage (company profile + 6 latest jobs)
/jobs                          → Listing lowongan publik (search, filter, pagination)
/jobs/[id]                     → Detail lowongan (publik)

/sign-in                       → Halaman sign-in Clerk (semua role)
/sign-up                       → Halaman sign-up Clerk (pelamar saja)

/dashboard                     → Summary lamaran pelamar
/dashboard/applications        → Daftar semua lamaran pelamar
/dashboard/profile             → Edit profil pelamar

/admin                         → Dashboard admin (ringkasan statistik)
/admin/jobs                    → Daftar semua lowongan
/admin/jobs/new                → Form buat lowongan baru
/admin/jobs/[id]/edit          → Edit lowongan
/admin/jobs/[id]/applicants    → Daftar pelamar per lowongan
/admin/company                 → Edit company profile (SUPER_ADMIN only)
/admin/users                   → User management (SUPER_ADMIN only)

/api/webhooks/clerk            → Clerk webhook handler (role assignment)
/api/uploadthing               → Uploadthing file handler
```

---

## 9. Out of Scope (Non-Functional)

- Aksesibilitas WCAG AA penuh — best effort, bukan requirement
- Performa sub-100ms — optimasi post-launch berdasarkan data nyata
- Automated testing coverage 100% — fokus pada critical paths saja

---

*Dokumen ini akan diperbarui seiring dengan iterasi pengembangan.*
