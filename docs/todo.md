**Purpose**: Track current work and immediate priorities for ARKA MMS (Maintenance Monitoring System)
**Last Updated**: 2026-03-03

## Task Management Guidelines

### Entry Format

Each task entry must follow this format:
`[status] priority: task description [context] (completed: YYYY-MM-DD)`

### Context Information

Include relevant context in brackets to help with future AI-assisted coding:

- **Files**: `[app/api/plans/route.ts]` - specific file and line numbers
- **Functions**: `[createMaintenancePlan(), syncUnits()]` - relevant function names
- **APIs**: `[POST /api/plans, GET /api/units]` - API endpoints
- **Database**: `[maintenance_plans table, units.project_snapshot]` - tables/columns
- **Error Messages**: `["Hour meter validation failed"]` - exact errors
- **Dependencies**: `[blocked by unit sync API, needs MinIO setup]` - blockers

### Status Options

- `[ ]` - pending/not started
- `[WIP]` - work in progress
- `[blocked]` - blocked by dependency
- `[testing]` - testing in progress
- `[done]` - completed (add completion date)

### Priority Levels

- `P0` - Critical (app won't work without this)
- `P1` - Important (significantly impacts user experience)
- `P2` - Nice to have (improvements and polish)
- `P3` - Future (ideas for later)

---

# Current Tasks

## Working On Now

- (Siap task berikutnya: MinIO attachments / Scheduler)

## Recently Completed (API auth refactor)

- `[done] P2: Refactor src/pages/api/auth/* — src/lib/auth-api.js (JWT, cookie, mapUserData, signAccessToken); logout clear cookie dengan Secure di prod; me parseBearer + cek decoded.id; register mapRegisteredUser + blank line ESLint]` (completed: 2026-03-11)

## Recently Completed (Nav & Pages cleanup)

- `[done] P2: Hapus halaman selain Dashboard Maintenance, Plan, Actual, Type, Unit, User, Role, Permission; navigasi vertikal & horizontal hanya menu ARKA MMS; server-side menu (fake-db) dan app-bar search disesuaikan; UserDropdown hanya Dashboard + Sign Out; index redirect ke /dashboards/maintenance; getHomeRoute selalu ke maintenance]` (completed: 2026-03-09)

## Recently Completed (Role & Permission)

- `[done] P2: Role & Permission ala Spatie [Prisma: permissions, roles, role_permissions, user_roles; seed permissions + role-permission mapping + user_roles dari User.role; src/lib/permissions.js getPermissionsForUser, buildAbilityFromPermissions, getAbilityForUser; /api/auth/me & login kembalikan userData.permissions; acl.js buildAbilityFor(user) dari permissions; AclGuard pakai buildAbilityFor(auth.user); middleware tetap role-based]` (completed: 2026-03-06)

## Recently Completed

- `[done] P2: Grafik Achievement per Site (grid PLAN/ACTUAL/ACH) [Tab "Grafik per Site"; AchievementChartsGrid.js — satu chart per Maintenance Type × Site, filter Project/Tahun/Bulan; dual Y-axis, ACH 2 desimal, tooltip, responsive]` (completed: 2026-03-03)
- `[done] P2: Dashboard Maintenance + Achievement table [Route/nav mms→maintenance; GET /api/dashboard/achievement?year=; tabel PLAN/ACTUAL/ACH per site & program CBM, All Program & All Site Ach; pilih tahun]` (completed: 2026-03-03)
- `[done] P2: Dashboard widgets (Total Unit, Due This Month, Compliance, Overdue) [GET /api/dashboard/stats, src/pages/dashboards/maintenance, nav + home → /dashboards/maintenance]` (completed: 2026-03-03)
- `[done] P1: Access control user berdasarkan role [Next.js Middleware (src/middleware.js) + ACL; role di JWT + cookie HttpOnly; /apps/user/* hanya ADMIN_HO; nav subject user-list; API users require ADMIN_HO; POST /api/auth/logout]` (completed: 2026-03-03)
- `[done] P1: Attachment upload via JSON+base64 [POST /api/attachments/upload body JSON, max 3MB/file, 4MB body; view [id].js baca file→base64, satu request per file; menghindari ERR_CONNECTION_ABORTED multipart]` (completed: 2026-02-25)
- `[done] P1: Halaman detail Maintenance Actual [src/pages/apps/maintenance-actual/view/[id].js, GET /api/maintenance-actuals/[id], tampil plan/unit/date/time/hour meter/remarks/mechanics/created by; tombol View di list, link unit ke unit view]` (completed: 2026-02-26)
- `[done] P1: CRUD Maintenance Actual [maintenance_actuals: maintenancePlanId, unitId, maintenanceDate, maintenanceTime?, hourMeter, remarks?, mechanics?, createdById; GET/POST /api/maintenance-actuals, GET/PATCH/DELETE /api/maintenance-actuals/[id], list + filter (Plan, Unit, Date range) + Add/Edit drawer + delete toast confirm, nav Maintenance Actuals]` (completed: 2026-02-26)
- `[done] P1: Maintenance Plan export/import Excel [xlsx; Export dari list → maintenance-plans-YYYYMMDD.xlsx kolom: id, project_id, year, month, maintenance_type_id, maintenance_type_name, sum_plan; Import: POST /api/maintenance-plans/import { plans, createdById } → create/update by id, toast created/updated/errors]` (completed: 2026-02-26)
- `[done] P1: CRUD Maintenance Plan [maintenance_plans: projectId, year, month, maintenanceTypeId, sumPlan, createdById; GET/POST /api/maintenance-plans, GET/PATCH/DELETE /api/maintenance-plans/[id], list + Add/Edit drawer + toast delete confirm, nav]` (completed: 2026-02-26)
- `[done] P1: CRUD Maintenance Type — list, add, edit, delete [GET/POST /api/maintenance-types, GET/PATCH/DELETE /api/maintenance-types/[id], src/pages/apps/maintenance-type/list, store apps/maintenanceType, nav]` (completed: 2026-02-25)
- `[done] P1: Register page — register-v1 layout, only username/email/password; role default ADMIN_HO, status inactive [POST /api/auth/register, src/pages/register/index.js, authConfig.registerEndpoint]` (completed: 2026-02-25)
- `[done] P1: Unit sync from external API [GET /api/units, POST /api/units/sync, src/configs/arkFleetApi.js, ark-fleet equipments → units upsert]` (completed: 2026-02-23)
- `[done] P1: CRUD User (ulang) — template Vuexy + Next.js API + Prisma [src/pages/api/users, src/pages/apps/user/list, AddUserDrawer, EditUserDrawer, store apps/user]` (completed: 2026-02-23)
- `[done] P0: Set up MySQL + Prisma schema & koneksi ke database [prisma/schema.prisma, .env DATABASE_URL, db push, db:seed maintenance_types]` (completed: 2026-02-23)

## Up Next (Implementation Phase)

- `[done] P0: Initialize Next.js project with App Router [create-next-app, TypeScript]` (completed: 2026-02-19)
- `[done] P0: Set up MySQL + Prisma schema [prisma/schema.prisma, docs/maintenance-monitoring-system.md §5]` (completed: 2026-02-23)
- `[done] P0: Implement authentication & role-based access (ADMIN_HO, ADMIN_SITE, MECHANIC) [NextAuth/Auth.js]` (completed: 2026-02-19)
- `[done] P1: CRUD User [users table, API + halaman + nav, hanya ADMIN_HO]` (completed: 2026-02-19)
- `[done] P1: Unit sync from external API [GET /api/units, POST /api/units/sync]`
- `[done] P1: Maintenance Plan CRUD [maintenance_plans]` (completed: 2026-02-26)
- `[done] P1: Maintenance Actual CRUD [maintenance_actuals; mechanics = text field]` (completed: 2026-02-26)
- `[done] P2: Dashboard widgets (Total Unit, Due This Month, Compliance, Overdue) [§9]`
- `[ ] P2: Scheduler (MISSED status, unit sync) [Worker Node / cron]`

## Blocked/Waiting

- None currently

## Recently Completed

- `[done] P1: CRUD User [API GET/POST /api/users, GET/PATCH/DELETE /api/users/[id], halaman list/new/edit, nav Pengguna untuk ADMIN_HO]` (completed: 2026-02-19)
- `[done] P0: Implement authentication & role-based access [NextAuth v5, Credentials, JWT, role in session, /login, /dashboard, middleware]` (completed: 2026-02-19)
- `[done] P0: Set up MySQL + Prisma schema [prisma/schema.prisma, all models per design §5]` (completed: 2026-02-19)
- `[done] P0: Align project documentation with maintenance-monitoring-system.md [AGENTS.md, docs/architecture.md, docs/todo.md, docs/backlog.md]` (completed: 2026-02-19)

## Quick Notes

### Domain Reference

- **Design spec**: `docs/maintenance-monitoring-system.md`
- **Architecture**: `docs/architecture.md`

### Maintenance Types

Inspection, Washing, Greasing, Track Cleaning, PPU/CTS

### Plan Status

OPEN → DONE (when actual linked) | OPEN → MISSED (when past date without actual)

### CRUD User (implementasi saat ini — Pages Router + Vuexy)

1. **API routes** — `src/pages/api/users/index.js` (GET list, POST create), `src/pages/api/users/[id].js` (GET, PATCH, DELETE). Validasi di handler, hash password (bcryptjs) saat create/update.
2. **Store** — `src/store/apps/user/index.js`: fetchData → GET /api/users, addUser → POST /api/users, updateUser → PATCH /api/users/[id], deleteUser → DELETE /api/users/[id].
3. **Halaman list** — `src/pages/apps/user/list/index.js`: DataGrid (username, name, email, role, projectScope, isActive), filter role & status, Tambah/Edit drawer.
4. **Drawer** — `AddUserDrawer.js` (username, name, email, password, role, projectScope, isActive), `EditUserDrawer.js` (load by id, PATCH; password opsional).
5. **Navigasi** — Menu "User" → "List" ke `/apps/user/list` (Vuexy vertical nav). Restrict ke ADMIN_HO bisa ditambah via ACL/guard.

### Unit sync (ark-fleet → units table)

1. **Endpoint eksternal** — `http://192.168.32.15/ark-fleet/api/equipments` (config: `ARK_FLEET_EQUIPMENTS_URL` di .env).
2. **GET /api/units** — List unit dari DB (query: `q` search code/model/projectName, `project` filter by projectId/projectName).
3. **POST /api/units/sync** — Fetch equipments dari ark-fleet, upsert ke `units` (id, code=unit_no, model, projectId=project_id, projectName=project_code, lastSyncAt). Response: `{ ok, synced, created, updated }`.
4. **Mapping** — Satu item equipment: id→id, unit_no→code, model→model, project_id→projectId, project_code→projectName.

### Business Rules

- Hour meter must not be less than previous history
- Actual linked to plan → plan status becomes DONE
- Attachment: optional, multi file, cascade delete

### Documentation Maintenance

After every significant code change:

1. Update `docs/architecture.md` with current state
2. Update progress in `docs/todo.md`
3. Log decisions in `docs/decisions.md`
4. Note important discoveries in `MEMORY.md`
5. Move future ideas to `docs/backlog.md`
