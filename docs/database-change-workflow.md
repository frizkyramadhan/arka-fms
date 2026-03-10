# Alur Perubahan Database (Prisma + Next.js)

Dokumen ini menjelaskan langkah-langkah yang harus dilakukan ketika ada perubahan dari sisi database pada proyek ARKA MMS (Next.js + Prisma + MySQL).

---

## Ringkasan Alur

1. **Ubah schema** di `prisma/schema.prisma`
2. **Buat/terapkan migrasi** (atau `db push`) agar MySQL mengikuti schema
3. **Regenerate Prisma Client** agar kode Node.js mengenal field/model baru
4. **Restart dev server** Next.js agar proses memuat client yang baru
5. **Ubah kode** (API, store, UI) jika perlu memakai field baru

---

## 1. Ubah Schema Prisma

Edit file **`prisma/schema.prisma`**:

- Tambah **field baru**: mis. `description String? @db.VarChar(255)` di model `Unit`
- Ubah tipe/constraint, hapus field, atau tambah model/relasi sesuai kebutuhan

Contoh menambah field opsional:

```prisma
model Unit {
  id           String    @id
  code         String
  model        String?
  description  String?   @db.VarChar(255)   // field baru
  projectId    String?   @map("project_id")
  // ...
}
```

Simpan file.

---

## 2. Sinkronkan Database dengan Schema

Pilih salah satu: **migrasi** (untuk tim/produksi) atau **db push** (cepat, development).

### Opsi A: Migrasi (disarankan untuk tim/produksi)

```bash
# Buat file migrasi baru dari perubahan schema
npx prisma migrate dev --name add_unit_description

# Di lingkungan production / server
npx prisma migrate deploy
```

- `migrate dev`: membuat folder di `prisma/migrations/` dan langsung menerapkan ke DB development.
- `migrate deploy`: hanya menerapkan migrasi yang belum jalan (tanpa mengubah schema file).

### Opsi B: Db push (development cepat)

```bash
npx prisma db push
```

- Langsung menyesuaikan struktur tabel di database dengan schema tanpa membuat file migrasi.
- Cocok untuk percobaan cepat; untuk history dan deploy konsisten lebih baik pakai migrasi.

Setelah ini, **tabel di MySQL sudah punya kolom/struktur baru**.

---

## 3. Regenerate Prisma Client

Setiap kali `schema.prisma` berubah, client yang dipakai di Node.js harus di-generate ulang:

```bash
npx prisma generate
```

- Menulis ulang kode di `node_modules/@prisma/client` (model, field, types).
- Tanpa langkah ini, kode yang memakai field baru (mis. `description`) akan error: **"Unknown argument `description`"**.

---

## 4. Restart Dev Server Next.js

Proses Node.js meng-cache modul yang sudah di-`require`. Setelah `prisma generate`:

1. **Stop** proses `npm run dev` (Ctrl+C).
2. **Jalankan lagi** `npm run dev`.

Tanpa restart, proses lama tetap memakai Prisma client lama yang tidak punya field baru.

---

## 5. Ubah Kode Aplikasi (API & Frontend)

Sesuaikan dengan field/model baru:

- **API** (`src/pages/api/...`): baca/tulis field baru di handler (create, update, list).
- **Store** (Redux/slice): tidak wajib diubah kecuali response API berubah.
- **UI** (form, list, filter): tampilkan atau input field baru jika diperlukan.

Tidak perlu langkah khusus Prisma di sini; cukup pakai object yang punya property baru (mis. `description`) seperti biasa.

---

## Checklist Singkat

| Urutan | Langkah | Perintah / tindakan |
|--------|--------|----------------------|
| 1 | Ubah schema | Edit `prisma/schema.prisma` |
| 2 | Update database | `npx prisma migrate dev --name <nama>` atau `npx prisma db push` |
| 3 | Update client | `npx prisma generate` |
| 4 | Reload server | Stop lalu jalankan lagi `npm run dev` |
| 5 | Update kode | Sesuaikan API & UI dengan field baru |

---

## Troubleshooting

- **"Unknown argument `description`"**  
  Client belum di-regenerate atau server belum di-restart. Lakukan **langkah 3 dan 4**.

- **"Unknown column 'description'"**  
  Database belum punya kolom. Lakukan **langkah 2** (`migrate deploy` atau `db push`).

- **Perubahan schema tidak muncul di TypeScript/IDE**  
  Jalankan `npx prisma generate`; kalau pakai VS Code/Cursor, kadang perlu reload window setelah generate.

---

## Referensi

- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma db push](https://www.prisma.io/docs/concepts/components/prisma-migrate/db-push)
- [Prisma Generate](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/generating-prisma-client)
