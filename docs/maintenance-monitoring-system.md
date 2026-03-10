# Maintenance Monitoring System

Web-Based Heavy Equipment Fundamental Maintenance Monitoring

## 1. Tujuan Sistem

Aplikasi ini digunakan untuk memonitor maintenance fundamental unit alat
berat pertambangan secara terpusat, terstruktur, dan dapat diaudit.

Jenis maintenance: - Inspection - Washing - Greasing - Track Cleaning -
PPU/CTS

Sistem mendukung: - Perencanaan maintenance (HO) - Pelaporan actual
maintenance (Site) - Monitoring compliance - Penyimpanan dokumen
maintenance - Reporting bulanan dan tahunan

------------------------------------------------------------------------

## 2. Arsitektur Sistem

### Stack Teknologi

Frontend + Backend: - Next.js (App Router, Fullstack)

Database: - MySQL (Laragon) - Prisma ORM

Storage Dokumen: - MinIO (S3 compatible, on-prem friendly)

Optional Infrastructure: - Redis (cache / queue) - Worker Node (cron job
& scheduler) - Docker Compose deployment

------------------------------------------------------------------------

## 3. Konsep Bisnis Utama

### 3.1 Unit

-   Data unit berasal dari API eksternal
-   Sistem hanya menyimpan cache
-   Unit dapat berpindah project mengikuti sistem sumber

### 3.2 Maintenance Plan vs Actual

HO: - membuat Maintenance Plan

Site / Mechanic: - menginput Maintenance Actual

Relasi: - Plan → optional Actual - Actual bisa tanpa Plan (unplanned
maintenance)

### 3.3 Project Snapshot

Project tidak direlasikan secara langsung ke tabel internal.

Setiap record maintenance menyimpan: - project_snapshot (string)

Tujuan: - histori tidak berubah saat unit pindah project

------------------------------------------------------------------------

## 4. Role Pengguna

### ADMIN_HO

-   membuat maintenance plan
-   melihat seluruh report
-   akses global

### ADMIN_SITE

-   input maintenance actual
-   melihat plan site

### MECHANIC

-   input maintenance actual
-   ditugaskan sebagai pelaksana maintenance

------------------------------------------------------------------------

## 5. Model Data (ERD)

### 5.1 Unit

units - id (PK, dari API eksternal) - code - model - project_id -
project_name - last_sync_at - created_at - updated_at

### 5.2 Maintenance Type

maintenance_types - id (PK) - name - created_at

### 5.3 User

users - id (PK) - username (unique) - name - email (opsional) - password_hash - role - project_scope -
is_active - created_at. Login menggunakan username (bukan email).

### 5.4 Maintenance Plan

maintenance_plans - id (PK) - unit_id (FK) - maintenance_type_id (FK) -
created_by (FK) - planned_date - planned_hour_meter - project_snapshot -
status (OPEN, DONE, MISSED) - notes - created_at - updated_at

Relasi: - 1 plan → 0..1 actual

### 5.5 Maintenance Actual

maintenance_actuals - id (PK) - plan_id (nullable FK) - unit_id (FK) -
maintenance_type_id (FK) - created_by (FK) - maintenance_date -
maintenance_time - hour_meter - project_snapshot - notes - created_at

Relasi: - actual bisa berdiri sendiri (unplanned)

### 5.6 Mechanic Assignment

maintenance_actual_mechanics - id (PK) - maintenance_actual_id (FK) -
user_id (FK) - role_snapshot - assigned_at

### 5.7 Attachment (Dokumen Maintenance)

attachments - id (PK) - entity_type (MAINTENANCE_PLAN \|
MAINTENANCE_ACTUAL) - entity_id - file_name - file_type - file_size -
storage_path - uploaded_by (FK) - uploaded_at

### 5.8 Monthly Report (Snapshot)

monthly_reports - id (PK) - year - month - generated_at

monthly_report_items - id (PK) - report_id (FK) - unit_id -
maintenance_type_id - project_snapshot - total_plan - total_actual -
compliance_rate - last_hour_meter

### 5.9 Yearly Report (Snapshot)

yearly_reports - id (PK) - year - generated_at

yearly_report_items - id (PK) - report_id (FK) - unit_id -
maintenance_type_id - project_snapshot - total_plan - total_actual -
compliance_rate

------------------------------------------------------------------------

## 6. Alur Proses Sistem

### Flow HO

1.  Login
2.  Sinkron unit dari API
3.  Membuat maintenance plan
4.  Plan tersedia untuk site

### Flow Site

1.  Melihat plan OPEN
2.  Melakukan maintenance
3.  Input actual maintenance
4.  Assign mechanic
5.  Upload dokumen (opsional)
6.  Plan berubah menjadi DONE

### Scheduler Sistem

-   Plan lewat tanggal tanpa actual → MISSED
-   Generate monthly report
-   Generate yearly report
-   Sinkron unit dari API eksternal

------------------------------------------------------------------------

## 7. Business Rules

Hour meter tidak boleh lebih kecil dari histori sebelumnya.

Actual yang sesuai plan akan mengubah status plan menjadi DONE.

Maintenance status: - OPEN - DONE - MISSED - UNPLANNED

Attachment: - optional - multi file - cascade delete

------------------------------------------------------------------------

## 8. API Endpoint Konseptual

Maintenance: - POST /api/maintenances - GET /api/maintenances

Plan: - POST /api/plans - GET /api/plans

Attachment: - POST /api/attachments - GET /api/attachments

Report: - POST /api/reports/monthly/generate - GET
/api/reports/monthly - GET /api/reports/yearly

Unit: - GET /api/units - POST /api/units/sync

------------------------------------------------------------------------

## 9. Dashboard Monitoring

Widget utama: - Total Unit Active - Maintenance Due Today - Compliance
Rate - Overdue Maintenance - Activity Log

Grafik: - Maintenance per type - Plan vs Actual trend - Hour meter trend

------------------------------------------------------------------------

## 10. Keunggulan Arsitektur

-   Mendukung audit operasional
-   Fleksibel terhadap perubahan project unit
-   Mendukung multi mechanic
-   Dokumentasi maintenance terpusat
-   Reporting berbasis snapshot
-   Siap deployment on-prem
-   Struktur scalable dan maintainable

------------------------------------------------------------------------

## 11. Status Rancangan

Desain sistem telah mencakup: - Domain model final - ERD final - Prisma
schema - Arsitektur aplikasi - Business flow - Reporting model - Storage
strategy

Sistem siap memasuki tahap implementasi.

---

## Dokumentasi Terkait

-   **Arsitektur**: `docs/architecture.md` — Ringkasan arsitektur dan referensi cepat
-   **Task**: `docs/todo.md` — Task implementasi saat ini
-   **Backlog**: `docs/backlog.md` — Fitur dan improvement masa depan
-   **Keputusan**: `docs/decisions.md` — Technical decision records
-   **AGENTS.md** — Panduan dokumentasi otomatis untuk AI agents
