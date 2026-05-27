# Architecture Decision Records — Job Portal

Format: **Keputusan → Alasan → Konsekuensi**

---

## ADR-013: clerkMiddleware berjalan di semua route (termasuk publik)

**Status:** Accepted
**Konteks:** Implementasi awal hanya menjalankan `clerkMiddleware()` untuk protected routes dan auth pages, dengan harapan menghemat overhead. Ketika `auth()` dipanggil di Server Component pada halaman publik (marketing layout, job detail page), Clerk melempar error: `"auth() was called but Clerk can't detect usage of clerkMiddleware()"`.
**Keputusan:** `clerkMiddleware()` sekarang selalu berjalan untuk semua route. Logic guard (role check, isActive, redirect) tetap hanya dieksekusi untuk protected routes — overhead tetap minimal.
**Konsekuensi:**
- ✅ `auth()` dapat dipanggil dari halaman mana pun (publik maupun protected) tanpa error
- ✅ Navbar bisa menampilkan "Dashboard" atau "Masuk/Daftar" berdasarkan status login
- ✅ Tombol "Masuk untuk Melamar" vs "Lamar Sekarang" di detail job bisa dibedakan server-side
- ⚠️ Sedikit tambahan latency (~1–5ms) per request karena Clerk middleware diinisialisasi lebih sering — acceptable

---

## ADR-014: Filter dan pagination halaman /jobs berbasis URL (link + form GET)

**Status:** Accepted
**Konteks:** Perlu memilih antara client-side state (useState + router.push) atau server-side (URL search params via links dan form GET) untuk filter tipe kerja dan search keyword.
**Keputusan:** Filter tipe kerja menggunakan link-based URL (setiap tipe = satu `<Link>` yang memperbarui `?type=`). Search keyword menggunakan form GET dengan submit button. Tidak ada client-side JavaScript untuk filtering.
**Konsekuensi:**
- ✅ Halaman sepenuhnya Server Component — tidak ada `'use client'`, tidak ada hydration overhead
- ✅ URL shareable — user bisa share hasil filter ke orang lain
- ✅ Back button browser bekerja natural
- ⚠️ Search membutuhkan klik tombol eksplisit (bukan real-time debounce) — acceptable untuk Phase 3

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

## ADR-012: Next.js 16 menggunakan `proxy.ts` sebagai middleware entry point

**Status:** Accepted
**Konteks:** Next.js 16 mengubah konvensi middleware. File `middleware.ts` deprecated; Next.js 16 menggunakan `proxy.ts` sebagai primary middleware file. Memiliki keduanya secara bersamaan menyebabkan error: `"Both middleware file ./src/middleware.ts and proxy file ./src/proxy.ts are detected."`.
**Keputusan:** Hapus `src/middleware.ts`. Semua logic middleware (Clerk, i18n, Arcjet, config export) berada di `src/proxy.ts`.
**Konsekuensi:**
- ✅ Sesuai konvensi Next.js 16 — tidak ada konflik file
- ✅ Config matcher (route patterns) dan logic middleware dalam satu file
- ⚠️ Berbeda dari dokumentasi Next.js lama dan boilerplate yang belum diupdate; jangan membuat `src/middleware.ts` baru
- ⚠️ `config` export **harus** ada di `src/proxy.ts` — tidak bisa dipindah ke file lain

---

## ADR-015: applicantSeen boolean untuk notifikasi in-app pelamar

**Status:** Accepted
**Konteks:** Pelamar perlu tahu kapan status lamarannya berubah tanpa harus selalu buka dashboard. Butuh mekanisme "unread notification" tanpa infrastruktur tambahan (WebSocket, polling, push notification).
**Keputusan:** Tambahkan kolom `applicantSeen: boolean DEFAULT true` ke `applicationTable`. Saat admin update status, set ke `false`. Saat pelamar buka dashboard, `MarkApplicationsSeen` client component fire server action untuk reset semua ke `true`. Badge di sidebar menampilkan count di mana `applicantSeen = false`.
**Konsekuensi:**
- ✅ Tidak butuh tabel terpisah atau infrastruktur real-time
- ✅ Badge akurat — hanya merah jika benar-benar ada perubahan yang belum dilihat
- ✅ Badge hilang otomatis setelah user mengunjungi dashboard (next navigation)
- ⚠️ "Seen" tracking berlaku per-device hanya jika user membuka dashboard — bukan saat hanya melihat badge
- ⚠️ Jika `markApplicationsSeen` gagal (network error), badge tetap merah sampai retry berhasil

---

## ADR-016: ClerkProvider di root [locale]/layout.tsx

**Status:** Accepted
**Konteks:** `ClerkProvider` awalnya ada di `(auth)/layout.tsx`. Ketika `SignOutButton` ditambahkan ke navbar marketing (halaman publik), Clerk melempar error: `"SignOutButton can only be used within the <ClerkProvider /> component."` karena halaman marketing tidak ada di dalam `(auth)` route group.
**Keputusan:** Pindahkan `ClerkProvider` ke `src/app/[locale]/layout.tsx` (root locale layout) sehingga semua halaman — baik public maupun protected — punya Clerk context.
**Konsekuensi:**
- ✅ `SignOutButton` dan semua Clerk client components berfungsi di semua halaman
- ✅ Navbar marketing bisa tampilkan tombol Sign Out untuk user yang sedang login
- ⚠️ Sedikit overhead Clerk initialization di semua halaman publik — acceptable, minimal

---

## ADR-017: UploadThing token format untuk v7

**Status:** Accepted
**Konteks:** Upload CV gagal dengan error "Invalid token". UploadThing v7 mengubah format token: dari string API key biasa menjadi base64-encoded JSON `{ apiKey, appId, regions: NonEmptyArray<string> }`. Field `regions` wajib ada dan tidak boleh array kosong.
**Keputusan:** Buat fungsi `resolveToken()` di `api/uploadthing/route.ts` yang: (1) gunakan `UPLOADTHING_TOKEN` jika ada (sudah dalam format baru), atau (2) konstruksi token dari `UPLOADTHING_SECRET` + `UPLOADTHING_APP_ID` + default region `['fra1']`.
**Konsekuensi:**
- ✅ Backward compatible — deployment lama dengan `UPLOADTHING_SECRET/APP_ID` tetap berfungsi
- ✅ Deployment baru cukup set satu `UPLOADTHING_TOKEN`
- ⚠️ Region `fra1` di-hardcode sebagai default; perlu diubah jika deployment di region berbeda

---

## ADR-018: Warna merah sebagai primary brand color

**Status:** Accepted
**Konteks:** Warna default boilerplate adalah hitam/near-black. Logo PTNIP menggunakan merah.
**Keputusan:** Ubah `--primary` di `global.css` ke `oklch(0.45 0.207 25)` (setara red-700). Semua komponen shadcn/ui yang menggunakan `--primary` (Button, focus ring) otomatis ikut berubah tanpa modifikasi per-komponen.
**Konsekuensi:**
- ✅ Konsistensi brand menyeluruh dengan satu perubahan CSS variable
- ✅ Tidak ada perubahan per-komponen — mudah di-revert atau diganti warna lain
- ⚠️ Warna oklch perlu kalibrasi jika target browser lama tidak mendukung oklch (semua browser modern aman)

---

## ADR-019: Familjen Grotesk sebagai font dasar

**Status:** Accepted
**Konteks:** Boilerplate menggunakan font system-ui default. PTNIP memerlukan identitas tipografi yang lebih kuat.
**Keputusan:** Gunakan `next/font/google` untuk load Familjen Grotesk. Font di-host otomatis oleh Next.js (zero external network request di browser), variable CSS `--font-sans` di-inject via className di `<html>`.
**Konsekuensi:**
- ✅ Zero layout shift — Next.js preload dan inline font declaration di `<head>`
- ✅ GDPR-friendly — tidak ada request ke Google Fonts dari browser user
- ✅ Cukup satu baris perubahan di root layout untuk mengganti font seluruh aplikasi
- ⚠️ Menambah ~40–80KB ke initial bundle (font file), dapat dimitigasi dengan `display: swap`

---

## ADR-020: ClientLogo sebagai tabel terpisah (bukan array di PortfolioContent)

**Status:** Accepted
**Konteks:** Logo klien/mitra awalnya hardcoded di `src/data/clientLogos.ts`. Saat dijadikan admin-editable, ada dua opsi: (A) simpan sebagai JSON array di kolom PortfolioContent, (B) tabel terpisah `client_logo`.
**Keputusan:** Opsi B — tabel terpisah dengan `id`, `logoUrl`, `altText`, `createdAt`. Insert/delete per-baris.
**Konsekuensi:**
- ✅ Insert/delete individual logo tanpa serialize/deserialize JSON
- ✅ `createdAt` memungkinkan pengurutan berdasarkan waktu ditambahkan
- ✅ Mudah diperluas (tambah kolom `order`, `isActive`, dll.) tanpa migrasi besar
- ⚠️ Perlu migration + tabel baru vs hanya ubah kolom existing

---

## ADR-021: db.select() untuk clientLogoTable (bukan db.query relational API)

**Status:** Accepted
**Konteks:** `db.query.<table>.findMany()` (Drizzle relational query API) bergantung pada schema registry yang di-cache di `globalThis.cachedDrizzle`. Tabel baru yang ditambahkan setelah server dev pertama kali berjalan tidak ter-register dalam instance yang cached, menyebabkan `db.query.clientLogoTable` menjadi `undefined`.
**Keputusan:** Gunakan `db.select().from(clientLogoTable).orderBy(...)` (standard query builder) yang membaca langsung dari referensi tabel tanpa registry.
**Konsekuensi:**
- ✅ Tidak bergantung pada cache — berfungsi tanpa restart dev server
- ✅ Lebih eksplisit dan portable (tidak bergantung pada pola relational Drizzle)
- ⚠️ Tidak bisa gunakan `with: { relation }` inline — perlu join manual jika nanti ada relasi. Acceptable karena `clientLogoTable` tidak punya relasi.

---

## ADR-022: Infinite scroll marquee dengan CSS animation + pre-duplikasi array

**Status:** Accepted
**Konteks:** Untuk menampilkan logo klien di homepage dengan efek scroll otomatis. Opsi: (A) library carousel (embla, swiper), (B) pure CSS `@keyframes` + JavaScript, (C) pure CSS + duplikasi DOM.
**Keputusan:** Opsi C — duplikasi array logo di server, animasi `translateX(-50%)` dari 0% ke -50% (sehingga set pertama persis berakhir di posisi awal set kedua = seamless loop). Durasi adaptif berdasarkan jumlah logo (`max(15s, count × 3s)`).
**Konsekuensi:**
- ✅ Zero JavaScript runtime — Server Component, tidak ada `'use client'`
- ✅ Tidak ada dependency tambahan
- ✅ Pause on hover via `group-hover:[animation-play-state:paused]` (pure CSS)
- ⚠️ DOM nodes dua kali lipat — acceptable karena logo adalah `<img>` kecil
- ⚠️ Jika hanya 1–2 logo, duplikasi mungkin tidak cukup untuk loop visual yang baik — admin perlu isi minimal 4–5 logo

---

## ADR-011: Semua schema Drizzle dalam satu file Schema.ts

**Status:** Accepted
**Konteks:** Bisa split per domain (JobSchema.ts, ApplicationSchema.ts, dll.) atau satu file.
**Keputusan:** Satu file `src/models/Schema.ts` sesuai pola boilerplate.
**Konsekuensi:**
- ✅ Konsisten dengan konvensi boilerplate yang sudah ada
- ✅ Relasi antar tabel mudah dilihat dalam satu tempat
- ⚠️ File akan bertambah besar seiring schema berkembang; bisa di-split nanti jika perlu
