# ARKA MMS — Panduan Deployment Production

Panduan ini merujuk pada [Production Checklist](https://nextjs.org/docs/app/building-your-application/deploying/production-checklist) dan [Self-Hosting](https://nextjs.org/docs/app/guides/self-hosting) Next.js. Target: **server Windows dengan XAMPP** (IP internal 192.168.32.37).

---

## 1. Ringkasan Arsitektur di Production

| Komponen        | Di production                                      |
|----------------|-----------------------------------------------------|
| **Aplikasi**   | Next.js (Node.js) — **bukan** dijalankan oleh Apache |
| **Database**   | MySQL dari XAMPP (localhost di server)             |
| **Storage**    | MinIO (S3 compatible) — bisa di server sama/terpisah |
| **Web server** | Opsional: Apache (XAMPP) sebagai reverse proxy ke Next.js |

**Penting:** Next.js adalah aplikasi Node.js. XAMPP menyediakan Apache + MySQL; aplikasi ARKA MMS dijalankan dengan `next start` (Node), bukan sebagai situs PHP di Apache. Apache bisa dipakai hanya sebagai reverse proxy di depan Next.js jika diinginkan.

---

## 2. Yang Harus Disiapkan di Server Windows (192.168.32.37)

### 2.1 Node.js

- Pasang **Node.js LTS** (mis. 18.x atau 20.x) dari [nodejs.org](https://nodejs.org).
- Pastikan `node` dan `npm` bisa dijalankan dari Command Prompt/PowerShell.

### 2.2 XAMPP (MySQL)

- MySQL dari XAMPP dipakai sebagai database.
- Buat database `arka_mms` jika belum ada.
- Jalankan migration Prisma di server (lihat bawah).

### 2.3 MinIO (jika dipakai)

- Pasang dan jalankan MinIO di server (atau di mesin lain di jaringan).
- Buat bucket `arka-mms` dan isi env MinIO di server.

### 2.4 Kode & build

- Clone/copy proyek ke server (atau deploy hasil build).
- Install dependency production: `npm ci --omit=dev` (atau `npm install --production`).
- Generate Prisma Client: `npx prisma generate`.
- Build: `npm run build`.

---

## 3. Langkah Deployment Berdasarkan Dokumentasi Next.js

### 3.1 Build production (wajib)

```bash
# Di folder proyek (setelah clone/copy)
npm ci --omit=dev
npx prisma generate
npm run build
```

- `next build` menghasilkan output production (minified, optimized).
- Pastikan tidak ada error saat build; perbaiki dulu bila ada.

### 3.2 Menjalankan production server

```bash
npm run start
```

- Ini menjalankan `next start` (mode production).
- **Port:** Default 3000. Next.js **tidak** membaca `PORT` dari file `.env` saat `next start`. Untuk port lain:
  - Opsi A: `next start -p 3000` (ubah di `package.json` script `start` jika perlu).
  - Opsi B: Set variabel lingkungan `PORT` di level process/system (mis. di PM2 atau Windows Service), bukan hanya di `.env`.

Contoh script `start` dengan port tetap (mis. 8080):

```json
"start": "next start -p 8080"
```

### 3.3 Environment variables di server

- Buat file `.env` di **root proyek** di server (jangan commit; sudah ada di `.gitignore`).
- Isi sesuai `.env.example`, dengan nilai production:

| Variable | Contoh production (server 192.168.32.37) |
|----------|------------------------------------------|
| `DATABASE_URL` | `mysql://root:PASSWORD@localhost:3306/arka_mms` |
| `JWT_SECRET` | Nilai rahasia kuat (server-only) |
| `NEXT_PUBLIC_JWT_EXPIRATION` | Mis. `7d` (Remember Me) |
| `NEXT_PUBLIC_JWT_EXPIRATION_SESSION` | Mis. `8h` |
| `MINIO_*` | Endpoint/credentials MinIO production |
| `NEXT_PUBLIC_APP_URL` | `http://192.168.32.37:3000` (atau URL yang dipakai user) |
| `PROJECTS_API_URL` / `ARK_FLEET_*` | URL API eksternal yang valid dari server |

- **Keamanan (Next.js):** File `.env` tidak boleh di-commit; hanya variabel yang perlu di browser yang pakai prefix `NEXT_PUBLIC_`.

### 3.4 Database migration di server

Sekali saja (atau tiap deploy jika ada migration baru):

```bash
npx prisma migrate deploy
```

Atau jika memakai `db push`: `npx prisma db push` (sesuai kebijakan tim).

---

## 4. Menjalankan sebagai Proses yang Persisten (Windows)

Agar aplikasi tetap jalan setelah logout/restart, gunakan process manager.

### 4.1 PM2 (disarankan)

- Pasang: `npm install -g pm2`
- Jalankan:

```bash
cd C:\path\to\arka-fms
set PORT=3000
pm2 start npm --name "arka-mms" -- run start
pm2 save
pm2 startup
```

- Untuk port tetap tanpa bergantung pada `PORT` di env, ubah `package.json`:  
  `"start": "next start -p 3000"` lalu `pm2 start npm --name "arka-mms" -- run start`.

### 4.2 NSSM (Windows Service)

- Download NSSM, install sebagai service dengan:
  - Path: `node.exe` (atau path penuh ke `node`)
  - Arguments: `node_modules\next\dist\bin\next start -p 3000`
  - Startup directory: folder proyek.
- Set environment variables di NSSM (Environment) untuk `DATABASE_URL`, `JWT_SECRET`, dll.

### 4.3 Tanpa process manager

- Untuk uji coba: jalankan di Command Prompt `npm run start` dan biarkan jendela terbuka.
- Tidak disarankan untuk production jangka panjang.

---

## 5. Reverse Proxy dengan Apache (XAMPP) — Opsional

Jika ingin user mengakses lewat `http://192.168.32.37` (port 80) tanpa mengetik `:3000`:

1. Pastikan Next.js jalan di satu port (mis. 3000).
2. Aktifkan modul proxy Apache: `mod_proxy`, `mod_proxy_http`.
3. Tambah konfigurasi VirtualHost atau di `httpd.conf`:

```apache
ProxyPreserveHost On
ProxyPass / http://127.0.0.1:3000/
ProxyPassReverse / http://127.0.0.1:3000/
```

4. Restart Apache. Akses: `http://192.168.32.37/`.

**Streaming (Next.js):** Jika pakai nginx, dokumentasi Next.js menyarankan `X-Accel-Buffering: no`. Untuk Apache, proxy biasa ke Node umumnya sudah cukup; jika ada masalah dengan streaming, bisa dicoba konfigurasi buffer Apache.

---

## 6. Checklist Sebelum Go-Live (berdasarkan dokumentasi Next.js)

- [ ] **Build:** `npm run build` sukses tanpa error.
- [ ] **Env:** Semua variabel production di-set (`.env` di server, tidak di-commit).
- [ ] **Database:** Migration dijalankan; koneksi MySQL dari server OK.
- [ ] **JWT/Secret:** `JWT_SECRET` kuat dan unik; cookie/expiration sesuai kebijakan.
- [ ] **NEXT_PUBLIC_APP_URL:** Sesuai URL yang dipakai user (mis. `http://192.168.32.37:3000` atau `http://192.168.32.37` jika pakai proxy).
- [ ] **MinIO:** Konfigurasi dan bucket siap; upload attachment diuji.
- [ ] **Process manager:** PM2 atau NSSM mengatur `next start` dan auto-start setelah reboot.
- [ ] **Graceful shutdown:** Saat stop/restart, gunakan SIGTERM/SIGINT (PM2: `pm2 stop` / `pm2 delete`); Next.js akan menyelesaikan request yang sedang berjalan.

---

## 7. Ringkasan Perintah di Server

```bash
# Setup awal
npm ci --omit=dev
npx prisma generate
npm run build
npx prisma migrate deploy

# Set .env lalu jalankan
npm run start

# Atau dengan PM2 (port 3000)
pm2 start npm --name "arka-mms" -- run start
pm2 save && pm2 startup
```

Akses dari jaringan internal: `http://192.168.32.37:3000` (atau lewat Apache di port 80 jika proxy sudah dikonfigurasi).

---

## Referensi

- [Next.js — Production Checklist](https://nextjs.org/docs/app/building-your-application/deploying/production-checklist)
- [Next.js — Self-Hosting](https://nextjs.org/docs/app/guides/self-hosting)
- [Next.js — Environment Variables](https://nextjs.org/docs/app/guides/environment-variables)
- Proyek: `docs/maintenance-monitoring-system.md`, `.env.example`
