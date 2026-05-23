# Architecture Decision Records — Job Portal

Format: **Keputusan → Alasan → Konsekuensi**

---

## ADR-001: Clerk menggantikan NextAuth.js v5

**Status:** Accepted
**Konteks:** PRD awal menetapkan NextAuth.js v5. Boilerplate yang digunakan sudah include Clerk.
**Keputusan:** Gunakan Clerk sesuai boilerplate.
**Konsekuensi:**
- ✅ Email verification, session, password, OAuth ditangani out-of-the-box
- ✅ Invitation API tersedia untuk onboarding admin baru
- ✅ Tidak perlu tabel VerificationToken di DB kita
- ⚠️ Role management via Clerk publicMetadata — bukan kolom DB biasa
- ⚠️ Clerk JWT template **harus dikonfigurasi** di Dashboard → Configure → Sessions: tambah `"metadata": "{{user.public_metadata}}"` agar role & isActive terbaca di middleware
- ⚠️ Vendor dependency; migrasi ke auth lain di masa depan butuh effort besar

---

## ADR-002: Drizzle ORM menggantikan Prisma

**Status:** Accepted
**Konteks:** PRD awal menetapkan Prisma. Boilerplate sudah configure Drizzle dengan PostgreSQL.
**Keputusan:** Gunakan Drizzle sesuai boilerplate.
**Konsekuensi:**
- ✅ Schema, migrations, studio sudah ter-configure (drizzle.config.ts)
- ✅ Type-safe queries dengan inferensi TypeScript langsung dari schema
- ✅ Lebih lightweight dari Prisma
- ⚠️ Syntax schema berbeda dari Prisma (function-based vs DSL)
- ⚠️ Ecosystem tools lebih kecil dibanding Prisma

---

## ADR-003: URL-based locale routing (bukan cookie)

**Status:** Accepted
**Konteks:** PRD awal menetapkan preferensi bahasa di cookie/localStorage. Boilerplate next-intl menggunakan URL-based routing dengan `localePrefix: 'as-needed'`.
**Keputusan:** Ikuti pola boilerplate — bahasa Indonesia tanpa prefix (`/jobs`), bahasa Inggris dengan prefix (`/en/jobs`).
**Konsekuensi:**
- ✅ Lebih baik untuk SEO — Google index kedua versi bahasa secara terpisah
- ✅ URL shareable dan bookmark-able dengan bahasa yang benar
- ✅ LocaleSwitcher sudah ada di boilerplate
- ⚠️ Jika user share URL dengan locale prefix, penerima lihat bahasa yang sama
- ⚠️ Pelamar perlu klik LocaleSwitcher secara aktif; tidak ada auto-detect dari browser preference (bisa ditambahkan nanti)

---

## ADR-004: Query filter untuk expired jobs (bukan Cron Job)

**Status:** Accepted
**Konteks:** Dua opsi untuk auto-inactive lowongan yang lewat deadline: (A) filter di query level, (B) Vercel Cron Job harian.
**Keputusan:** Opsi A — semua query publik filter `deadline > now()`. Status DB tidak diubah. Dashboard admin menampilkan badge "Expired" untuk lowongan lewat deadline.
**Konsekuensi:**
- ✅ Zero infrastructure tambahan; tidak butuh Vercel Pro atau konfigurasi cron
- ✅ Lebih simpel dan zero-maintenance
- ⚠️ Status di DB tetap "PUBLISHED" meski sudah expired — admin perlu terbiasa dengan badge "Expired"
- ⚠️ Jika admin lihat status "PUBLISHED" di DB via studio, bisa membingungkan tanpa context

---

## ADR-005: Clerk API untuk email admin (bukan field di DB)

**Status:** Accepted
**Konteks:** Notifikasi email ke semua admin butuh alamat email. Opsi: simpan email di UserProfile (denormalisasi), atau query Clerk API saat diperlukan.
**Keputusan:** Query Clerk API (`clerkClient.users.getUserList()`) saat hendak kirim notifikasi.
**Konsekuensi:**
- ✅ Clerk adalah single source of truth untuk data user; tidak ada risiko stale email
- ✅ Tidak ada denormalisasi di DB
- ⚠️ Extra API call ke Clerk setiap ada lamaran baru; untuk MVP (sedikit admin) ini acceptable
- ⚠️ Jika Clerk API lambat, email notifikasi sedikit tertunda

---

## ADR-006: Middleware check `isActive` untuk admin deaktivasi

**Status:** Accepted
**Konteks:** Untuk menonaktifkan admin, pilihan: (A) ban user di Clerk via API, (B) cek `isActive` di DB di middleware kita.
**Keputusan:** Opsi B — set `isActive = false` di DB, cek di middleware setelah Clerk auth.
**Konsekuensi:**
- ✅ Tidak butuh Clerk Management API call saat deaktivasi
- ✅ Mudah di-reverse (toggle `isActive` kembali ke true)
- ✅ Dicek setiap request, bukan hanya saat login
- ⚠️ Session Clerk admin tetap "valid" secara teknis; hanya redirect yang memblokir akses
- ⚠️ Jika seseorang bypass middleware (sangat tidak mungkin di Next.js), session masih accepted

---

## ADR-007: Satu halaman sign-in dengan role-based redirect

**Status:** Accepted
**Konteks:** PRD awal menetapkan halaman login terpisah untuk admin (`/admin/login`) dan pelamar (`/auth/login`). Clerk menggunakan satu sign-in page.
**Keputusan:** Satu halaman `/sign-in`; setelah auth, middleware redirect berdasarkan role (ADMIN/SUPER_ADMIN → `/admin`, lainnya → `/dashboard`).
**Konsekuensi:**
- ✅ Lebih sederhana; tidak perlu maintain dua halaman login
- ✅ Sesuai arsitektur Clerk out-of-the-box
- ⚠️ URL `/admin` bisa diketahui publik; dimitigasi dengan middleware guard yang ketat

---

## ADR-008: Clerk Invitation API untuk onboarding admin baru

**Status:** Accepted
**Konteks:** PRD awal mendeskripsikan alur custom — super admin isi email, kita kirim email dengan link set password via Resend.
**Keputusan:** Gunakan Clerk Invitation API. Super admin panggil API dari server action; Clerk kirim email invitation; webhook assign role saat admin accept.
**Konsekuensi:**
- ✅ Tidak perlu buat email template untuk invitation (sudah dari Clerk)
- ✅ Tidak perlu tabel custom untuk tracking invitation status
- ✅ Clerk handle kedaluwarsa dan resend invitation
- ⚠️ Tampilan email invitation mengikuti branding Clerk default (bisa dikustomisasi di Clerk dashboard)

---

## ADR-009: CV disimpan sebagai URL snapshot

**Status:** Accepted
**Konteks:** Saat pelamar apply, CV mereka diupload ke Uploadthing. Jika kita simpan FK ke file profil, CV akan berubah saat profil diupdate.
**Keputusan:** Simpan URL CV langsung di tabel Application (`cvUrl` varchar) pada saat apply. File lama di Uploadthing tidak pernah dihapus secara programatik.
**Konsekuensi:**
- ✅ CV di lamaran lama tidak pernah berubah — audit trail terjaga
- ✅ Sederhana; tidak perlu logika versioning
- ⚠️ File storage terus bertambah seiring waktu; untuk MVP dengan free tier 2GB ini acceptable
- ⚠️ Jika user ganti CV berkali-kali, ada file orphan di Uploadthing (tidak direferens siapapun)

---

## ADR-010: shadcn/ui untuk component library

**Status:** Accepted
**Konteks:** Perlu component library untuk UI yang konsisten. Opsi: Radix UI bare, shadcn/ui, atau library lain.
**Keputusan:** shadcn/ui — copy-paste components, tidak lock-in, berbasis Radix UI.
**Konsekuensi:**
- ✅ Components dimiliki oleh project — bisa dimodifikasi bebas
- ✅ Kompatibel dengan Tailwind v4 yang sudah ada di boilerplate
- ✅ Tidak ada dependency runtime tambahan yang tidak diperlukan
- ⚠️ Perlu install manual tiap component yang dibutuhkan (`npx shadcn@latest add`)

---

## ADR-011: Semua schema Drizzle dalam satu file Schema.ts

**Status:** Accepted
**Konteks:** Bisa split per domain (JobSchema.ts, ApplicationSchema.ts, dll.) atau satu file.
**Keputusan:** Satu file `src/models/Schema.ts` sesuai pola boilerplate.
**Konsekuensi:**
- ✅ Konsisten dengan konvensi boilerplate yang sudah ada
- ✅ Relasi antar tabel mudah dilihat dalam satu tempat
- ⚠️ File akan bertambah besar seiring schema berkembang; bisa di-split nanti jika perlu
