@AGENTS.md

# Job Portal — Claude Context

Baca [docs/context.md](docs/context.md) untuk ringkasan cepat proyek ini.

## Quick Reference

- **Stack:** Next.js 16 + TypeScript + Clerk + Drizzle ORM + PostgreSQL (local dev / Neon production)
- **Schema:** `src/models/Schema.ts` — semua tabel di satu file
- **Actions:** `src/actions/` — semua mutasi data
- **Validations:** `src/validations/` — Zod schemas, shared client+server
- **i18n:** `src/locales/id.json` (default) + `en.json`

## Jangan

- Jangan gunakan `console.log` — gunakan `logger` dari `src/libs/Logger.ts`
- Jangan akses `process.env` langsung — gunakan `Env` dari `src/libs/Env.ts`
- Jangan buat komponen client tanpa alasan — default adalah Server Component
- Jangan simpan email admin di DB — query Clerk API saat diperlukan
