# MEMORY - ARKA MMS

Catatan penting, keputusan teknis, dan pembelajaran untuk proyek Maintenance Monitoring System.

---

## 2026-03-06: Role & Permission ala Spatie (Next.js + Prisma + CASL)

- **Konteks**: Tidak ada package Next.js yang 1:1 seperti Spatie Laravel Permission; rekomendasi: schema Role/Permission di DB + CASL untuk ability.
- **Perubahan**: (1) Prisma: model `Permission` (name), `AuthRole` (name), `RolePermission`, `UserRole`; `User` dapat relasi `userRoles`. (2) Seed: 12 permission (all.manage, user.manage, plan._, actual._, report.read), 3 role, mapping role→permission, dan user_roles dari `User.role`. (3) `src/lib/permissions.js`: `getPermissionsForUser(userId)`, `buildAbilityFromPermissions(permissions)`, `getAbilityForUser(userId, roleLegacy)` (server-side). (4) `/api/auth/me` dan login menambahkan `userData.permissions`. (5) `src/configs/acl.js`: `buildAbilityFor(user, subject)` — jika `user.permissions` ada dipakai untuk build Ability, else fallback rules dari role. (6) AclGuard memanggil `buildAbilityFor(auth.user, subject)`.
- **Insight**: Format permission `"subject.action"` (e.g. plan.create, all.manage). Middleware tetap memakai role dari JWT (tidak akses DB). Untuk API yang butuh cek permission granular: `const ability = await getAbilityForUser(decoded.id, decoded.role); if (!ability.can('manage', 'user-list')) return res.status(403).json(...)`.

---

## 2026-02-25: Attachment Upload Pakai JSON + Base64 (Bukan Multipart)

- **Konteks**: Upload multipart (formidable) di `POST /api/attachments/upload` sering memicu `net::ERR_CONNECTION_ABORTED` di browser (file ~300KB–700KB+), tanpa response HTTP; kemungkinan streaming multipart di Next.js Pages Router + Windows.
- **Keputusan**: Upload diganti ke **JSON body** dengan file sebagai **base64**. API memakai body parser bawaan Next.js (`bodyParser: { sizeLimit: '4mb' }`), tanpa formidable. Satu request = satu file (max 3 MB per file) agar total body tetap di bawah 4MB. Frontend: `FileReader.readAsDataURL` → ambil base64 → POST JSON `{ entityType, entityId, uploadedById, files: [{ name, type?, data }] }`.
- **File**: `src/pages/api/attachments/upload.js` (baru), `src/pages/apps/maintenance-actual/view/[id].js` (uploadFiles pakai base64, maxSize 3MB, pesan error bahasa Inggris).
- **Insight**: Untuk file lebih besar atau banyak file sekaligus, pertimbangkan MinIO + presigned URL atau chunked upload nanti.
- **Chunked upload**: Untuk file >400 KB, client pakai **chunked upload** (upload-start → N× upload-chunk) agar setiap request kecil (~100 KB raw → ~133 KB base64) dan tidak kena ERR_CONNECTION_RESET. API: `POST /api/attachments/upload-start`, `POST /api/attachments/upload-chunk`. Temp file di `public/uploads/tmp/{uploadId}/`.
- **Diagnostik upload gagal (>700KB)**: (1) **Server**: cek terminal `npm run dev` — log `[upload-api] request received` dengan `contentLength`, `hasBody`, `totalBase64Length`. Jika log ini **tidak muncul** untuk file besar = request putus sebelum body selesai dibaca (timeout/connection aborted/proxy). Jika muncul = masalah setelah body (DB/disk). (2) **Client**: buka DevTools → Console — log `[upload] sending` (fileName, fileSizeBytes, estimatedBodySizeKB) dan `[upload] error` (message, code, status). `code: ECONNABORTED` = timeout; tidak ada `response` = koneksi putus sebelum server balas. Di development, log "sending" otomatis; untuk progress angka set `window.__ARKA_MMS_UPLOAD_DEBUG__ = true` lalu upload.

---

## 2026-02-23: MySQL Terkoneksi & Schema Prisma Diterapkan

- **Konteks**: Database `arka_mms` sudah ada; yang dibutuhkan koneksi dan sinkron schema.
- **Perubahan**: `DATABASE_URL` ditambah di `.env` (`mysql://root:@localhost:3306/arka_mms`). Schema Prisma sudah ada di `prisma/schema.prisma`; Attachment polymorphic (tanpa relasi ke Plan/Actual), Plan–Actual one-to-one (`plan_id` @unique). Dijalankan: `npx prisma generate`, `npx prisma db push --accept-data-loss`, `npm run db:seed` (5 maintenance types).
- **Insight**: Prisma 6 dipakai (url di schema); Prisma 7 memakai prisma.config.ts. Query attachment nanti pakai `entityType` + `entityId`. Dokumentasi diperbarui per AGENTS.md: architecture.md, todo.md, decisions.md, MEMORY.md.

---

## 2026-02-19: Dokumentasi Diselaraskan dengan maintenance-monitoring-system.md

- **Konteks**: AGENTS.md dan docs/\* diperbarui agar mengacu ke `docs/maintenance-monitoring-system.md` sebagai sumber kebenaran desain.
- **Perubahan**: AGENTS.md (Project Context), architecture.md (MMS architecture), todo.md (task implementasi), backlog.md (fitur MMS), decisions.md (decision record), MEMORY.md (dibuat).
- **Insight**: Proyek arka-mms fokus pada Maintenance Monitoring System — Next.js, MySQL (Laragon), Prisma, MinIO. Desain lengkap di maintenance-monitoring-system.md. Status: siap implementasi.

---

## 2026-02-19: DBMS Diganti ke MySQL (Laragon)

- **Konteks**: Menggunakan MySQL yang sudah terinstall dari Laragon sebagai DBMS (bukan PostgreSQL).
- **Perubahan**: prisma/schema.prisma (provider → mysql), .env.example (DATABASE_URL MySQL), docs/architecture.md, docs/maintenance-monitoring-system.md, AGENTS.md, docs/todo.md.
- **Insight**: Connection string Laragon default: `mysql://root:@localhost:3306/arka_mms`. Buat database `arka_mms` di MySQL lalu jalankan `npx prisma migrate dev`.

---

## 2026-02-19: Auth Berbasis Username (bukan Email)

- **Konteks**: Login dan CRUD user dipindah dari email ke username.
- **Perubahan**: Prisma user: field `username` (unique, wajib), `email` opsional; auth (lib/auth.ts) authorize pakai `username` + password; login form & session pakai username; API user & halaman CRUD (list/form) pakai username; seed user `admin` / admin123; migrasi `20260220120000_add_username`.
- **Insight**: Login dengan **username** `admin` dan password `admin123`. Prisma enum di MySQL diekspor sebagai `user_role` (snake_case), bukan `UserRole`—gunakan `user_role` dari `@prisma/client` di types.

## 2026-02-19: Authentication & Role-Based Access

- **Konteks**: Task P0 implementasi login dan role (ADMIN_HO, ADMIN_SITE, MECHANIC).
- **Perubahan**: NextAuth v5 (Auth.js) dengan Credentials provider, JWT session, role dan project_scope di session; middleware proteksi route; halaman /login dan /dashboard; Prisma Client pakai @prisma/adapter-mariadb (Prisma 7); bcryptjs untuk password; seed user admin (username) / admin123.
- **Insight**: Middleware (edge) tidak boleh import Prisma/bcrypt—authorize pakai dynamic import. Production: set AUTH_SECRET dengan `npx auth secret`.

---

## Template Entry

**Tanggal**: YYYY-MM-DD

- **Konteks**: [Situasi atau masalah]
- **Keputusan/Solusi**: [Apa yang diputuskan atau dilakukan]
- **Insight**: [Pelajaran atau catatan untuk masa depan]
