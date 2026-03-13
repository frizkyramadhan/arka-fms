/**
 * ARKA MMS - Role & Permission helpers (SERVER-ONLY)
 * Load permissions dari DB. Hanya dipakai di API routes / server.
 * Jangan di-import dari komponen client (akan tarik Prisma/MariaDB ke bundle client).
 * Authorization berdasarkan permission (bukan nama role) agar nama role bisa diubah.
 */

import jwt from 'jsonwebtoken'
import prisma from 'src/lib/prisma'
import { buildAbilityFromPermissions, AppAbility } from 'src/lib/permissions'

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'arka-mms-secret'

/**
 * Decode JWT dari request, return userId atau null. Tidak mengirim response (untuk dipakai setelah requireAuth/requirePermission).
 * @param {object} req
 * @returns {Promise<string|null>}
 */
export async function getUserIdFromRequest(req) {
  const authHeader = req.headers.authorization
  const token = authHeader && (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader)
  if (!token) {
    return null
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET)

    return decoded?.id ?? null
  } catch {
    return null
  }
}

/**
 * Daftar nama role yang punya permission tertentu (mis. all.manage = role administrator).
 * @param {string} permissionName
 * @returns {Promise<string[]>}
 */
export async function getRoleNamesWithPermission(permissionName) {
  const perm = await prisma.permission.findUnique({ where: { name: permissionName } })
  if (!perm) {
    return []
  }

  const rps = await prisma.rolePermission.findMany({
    where: { permissionId: perm.id },
    include: { role: { select: { name: true } } }
  })

  return rps.map(rp => rp.role.name)
}

/**
 * Ambil daftar nama permission untuk user (dari user_roles -> role_permissions).
 * @param {string} userId
 * @returns {Promise<string[]>}
 */
export async function getPermissionsForUser(userId) {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } }
        }
      }
    }
  })
  const names = new Set()
  for (const ur of userRoles) {
    for (const rp of ur.role.permissions) {
      names.add(rp.permission.name)
    }
  }

  return Array.from(names)
}

/**
 * Build ability untuk user (server-side): load permissions dari DB lalu build Ability.
 * Fallback: jika permissions kosong, gunakan roleLegacy via configs/acl.
 * @param {string} userId
 * @param {string} [roleLegacy] - Nama role dari user_roles (untuk fallback)
 * @returns {Promise<Ability>}
 */
export async function getAbilityForUser(userId, roleLegacy) {
  const permissions = await getPermissionsForUser(userId)
  if (permissions.length > 0) {
    return buildAbilityFromPermissions(permissions)
  }
  if (roleLegacy) {
    const { buildAbilityFor } = await import('src/configs/acl')

    return buildAbilityFor(roleLegacy, 'all')
  }

  return new AppAbility([], {
    detectSubjectType: object => (object && object.type) || object
  })
}

/**
 * Cek hanya auth (JWT valid). Tidak cek permission. Untuk route yang boleh diakses semua user login.
 * @returns {Promise<boolean>} true = sudah kirim 401, false = boleh lanjut
 */
export async function requireAuth(req, res) {
  const authHeader = req.headers.authorization
  const token = authHeader && (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader)
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })

    return true
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (!decoded?.id) {
      res.status(401).json({ error: 'Unauthorized' })

      return true
    }

    return false
  } catch {
    res.status(401).json({ error: 'Unauthorized' })

    return true
  }
}

/**
 * Cek akses API berdasarkan permission (bukan nama role).
 * User boleh akses jika punya permission 'all.manage' atau permission yang diminta.
 * @param {object} req - Next API request (untuk Authorization header)
 * @param {object} res - Next API response
 * @param {string} requiredPermission - e.g. 'all.manage', 'user-list.manage'
 * @returns {Promise<boolean>} true = sudah kirim response (401/403), false = boleh lanjut
 */
export async function requirePermission(req, res, requiredPermission = 'all.manage') {
  const authHeader = req.headers.authorization
  const token = authHeader && (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader)
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })

    return true
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const userId = decoded?.id
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })

      return true
    }
    const permissions = await getPermissionsForUser(userId)
    const allowed = permissions.includes('all.manage') || permissions.includes(requiredPermission)
    if (!allowed) {
      res.status(403).json({ error: 'Forbidden: insufficient permission' })

      return true
    }

    return false
  } catch {
    res.status(401).json({ error: 'Unauthorized' })

    return true
  }
}

/**
 * Ambil roleId yang punya permission 'all.manage' (untuk default role pendaftaran).
 * Tidak bergantung nama role, jadi role bisa diganti nama.
 * @returns {Promise<string|null>}
 */
export async function getDefaultRoleIdByPermission(permissionName = 'all.manage') {
  const perm = await prisma.permission.findUnique({ where: { name: permissionName } })
  if (!perm) return null

  const rp = await prisma.rolePermission.findFirst({
    where: { permissionId: perm.id },
    select: { roleId: true }
  })

  return rp?.roleId ?? null
}
