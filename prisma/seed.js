/**
 * ARKA MMS - Seed data (Prisma 7 + adapter)
 * Maintenance types, roles, permissions, default admin user.
 * Semua input: cek dulu apakah data sudah ada; jika sudah ada di-skip (tidak overwrite).
 */

require('dotenv/config')
const { PrismaClient } = require('@prisma/client')
const { PrismaMariaDb } = require('@prisma/adapter-mariadb')
const bcrypt = require('bcryptjs')

function getAdapterConfig() {
  const url = process.env.DATABASE_URL
  if (!url) return { host: 'localhost', port: 3306, user: 'root', password: '', database: 'arka_mms' }
  try {
    const u = new URL(url.replace(/^mysql:\/\//, 'http://'))
    return {
      host: u.hostname || 'localhost',
      port: u.port ? parseInt(u.port, 10) : 3306,
      user: u.username || 'root',
      password: u.password || '',
      database: (u.pathname || '').replace(/^\//, '') || 'arka_mms'
    }
  } catch {
    return { host: 'localhost', port: 3306, user: 'root', password: '', database: 'arka_mms' }
  }
}

const adapter = new PrismaMariaDb(getAdapterConfig())
const prisma = new PrismaClient({ adapter })

const MAINTENANCE_TYPES = ['Inspection', 'Washing', 'Greasing', 'Track Cleaning', 'PPU/CTS']

const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'admin123',
  name: 'Administrator',
  email: 'admin@arka-mms.local',
  role: 'Administrator'
}

/**
 * Daftar permission (subject.action). all.manage = full access.
 * Dipakai untuk seed tabel permissions dan role_permissions.
 */
const PERMISSION_NAMES = [
  'all.manage',
  'user.manage',
  'user.read',
  'role.read',
  'role.manage',
  'permission.read',
  'permission.manage',
  'unit.read',
  'unit.create',
  'unit.update',
  'unit.delete',
  'maintenance-type.read',
  'maintenance-type.create',
  'maintenance-type.update',
  'maintenance-type.delete',
  'maintenance-plan.read',
  'maintenance-plan.create',
  'maintenance-plan.update',
  'maintenance-plan.delete',
  'maintenance-actual.read',
  'maintenance-actual.create',
  'maintenance-actual.update',
  'maintenance-actual.delete'
]

/** Nama role: Administrator, Superuser, User. */
const ROLE_NAMES = ['Administrator', 'Superuser', 'User']

/**
 * Mapping role -> permission names.
 * - Administrator: bisa semua (all.manage).
 * - Superuser: CRUD unit, maintenance-type, plan, actual, + user-list (manage user); tidak bisa role/permission.
 * - User: dashboard (plan.read), actual (create, read, update), baca unit & maintenance-type.
 */
const ROLE_PERMISSIONS = {
  Administrator: ['all.manage'],
  Superuser: [
    'user.read',
    'user.manage',
    'unit.read',
    'maintenance-type.read',
    'maintenance-type.create',
    'maintenance-type.update',
    'maintenance-type.delete',
    'maintenance-plan.read',
    'maintenance-plan.create',
    'maintenance-plan.update',
    'maintenance-plan.delete',
    'maintenance-actual.read',
    'maintenance-actual.create',
    'maintenance-actual.update',
    'maintenance-actual.delete'
  ],
  User: [
    'unit.read',
    'maintenance-type.read',
    'maintenance-plan.read',
    'maintenance-actual.read',
    'maintenance-actual.create',
    'maintenance-actual.update'
  ]
}

async function seedRolesAndPermissions() {
  let permissionsCreated = 0
  for (const name of PERMISSION_NAMES) {
    const existing = await prisma.permission.findUnique({ where: { name } })
    if (!existing) {
      await prisma.permission.create({ data: { name } })
      permissionsCreated++
    }
  }
  console.log(
    'Permissions: total',
    PERMISSION_NAMES.length,
    '| created',
    permissionsCreated,
    '| skipped',
    PERMISSION_NAMES.length - permissionsCreated
  )

  const roleIds = {}
  let rolesCreated = 0
  for (const name of ROLE_NAMES) {
    let r = await prisma.authRole.findUnique({ where: { name } })
    if (!r) {
      r = await prisma.authRole.create({ data: { name } })
      rolesCreated++
    }
    roleIds[name] = r.id
  }
  console.log(
    'Roles: total',
    ROLE_NAMES.length,
    '| created',
    rolesCreated,
    '| skipped',
    ROLE_NAMES.length - rolesCreated
  )

  let rolePermsCreated = 0
  for (const roleName of ROLE_NAMES) {
    const permNames = ROLE_PERMISSIONS[roleName] || []
    const roleId = roleIds[roleName]
    for (const permName of permNames) {
      const perm = await prisma.permission.findUnique({ where: { name: permName } })
      if (!perm) continue
      const existing = await prisma.rolePermission.findUnique({
        where: { roleId_permissionId: { roleId, permissionId: perm.id } }
      })
      if (!existing) {
        await prisma.rolePermission.create({
          data: { roleId, permissionId: perm.id }
        })
        rolePermsCreated++
      }
    }
  }
  console.log('Role_permissions: created', rolePermsCreated, '(existing skipped)')

  const users = await prisma.user.findMany({ include: { userRoles: true } })
  const defaultRoleId = roleIds['Administrator']
  let userRolesCreated = 0
  for (const user of users) {
    if (user.userRoles.length === 0 && defaultRoleId) {
      const existing = await prisma.userRole.findUnique({
        where: { userId_roleId: { userId: user.id, roleId: defaultRoleId } }
      })
      if (!existing) {
        await prisma.userRole.create({
          data: { userId: user.id, roleId: defaultRoleId }
        })
        userRolesCreated++
      }
    }
  }
  console.log('User_roles (backfill): created', userRolesCreated, '(existing skipped)')
}

async function main() {
  await seedRolesAndPermissions()

  let maintenanceTypesCreated = 0
  for (const name of MAINTENANCE_TYPES) {
    const existing = await prisma.maintenanceType.findFirst({ where: { name } })
    if (!existing) {
      await prisma.maintenanceType.create({ data: { name } })
      maintenanceTypesCreated++
    }
  }
  console.log(
    'Maintenance_types: total',
    MAINTENANCE_TYPES.length,
    '| created',
    maintenanceTypesCreated,
    '| skipped',
    MAINTENANCE_TYPES.length - maintenanceTypesCreated
  )

  const existingAdmin = await prisma.user.findUnique({
    where: { username: DEFAULT_ADMIN.username },
    include: { userRoles: { include: { role: true } } }
  })
  const adminRoleId = (await prisma.authRole.findUnique({ where: { name: DEFAULT_ADMIN.role } }))?.id

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, 10)
    const admin = await prisma.user.create({
      data: {
        username: DEFAULT_ADMIN.username,
        name: DEFAULT_ADMIN.name,
        email: DEFAULT_ADMIN.email,
        passwordHash,
        isActive: true
      }
    })
    if (adminRoleId) {
      const roleLink = await prisma.userRole.findUnique({
        where: { userId_roleId: { userId: admin.id, roleId: adminRoleId } }
      })
      if (!roleLink) {
        await prisma.userRole.create({ data: { userId: admin.id, roleId: adminRoleId } })
      }
    }
    console.log('Admin user: created', DEFAULT_ADMIN.username, '(password: admin123)')
  } else {
    const hasAdminRole = existingAdmin.userRoles.some(ur => ur.role?.name === DEFAULT_ADMIN.role)
    if (!hasAdminRole && adminRoleId) {
      const roleLink = await prisma.userRole.findUnique({
        where: { userId_roleId: { userId: existingAdmin.id, roleId: adminRoleId } }
      })
      if (!roleLink) {
        await prisma.userRole.create({
          data: { userId: existingAdmin.id, roleId: adminRoleId }
        })
        console.log('Admin user: assigned role Administrator (was missing)')
      }
    }
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
