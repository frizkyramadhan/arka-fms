/**
 * GET /api/roles — Daftar role (untuk dropdown Add/Edit User, dll).
 * Jika pemanggil bukan administrator (tidak punya all.manage), role administrator tidak disertakan.
 * POST /api/roles — Buat role baru. Hanya user dengan permission role.manage atau all.manage.
 */
import prisma from 'src/lib/prisma'
import { requireAuth, requirePermission, getUserIdFromRequest, getPermissionsForUser, getRoleNamesWithPermission } from 'src/lib/permissions-server'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    if (await requireAuth(req, res)) return
  } else {
    if (await requirePermission(req, res, 'role.manage')) return
  }

  if (req.method === 'GET') {
    try {
      const roles = await prisma.authRole.findMany({
        include: {
          _count: { select: { users: true, permissions: true } },
          permissions: { include: { permission: { select: { id: true, name: true } } } }
        },
        orderBy: { name: 'asc' }
      })

      let list = roles.map(r => ({
        id: r.id,
        name: r.name,
        userCount: r._count.users,
        permissionCount: r._count.permissions,
        permissionIds: r.permissions.map(p => p.permission.id),
        permissionNames: r.permissions.map(p => p.permission.name)
      }))

      // Non-admin: sembunyikan role yang punya all.manage (administrator)
      const userId = await getUserIdFromRequest(req)
      if (userId) {
        const permissions = await getPermissionsForUser(userId)
        if (!permissions.includes('all.manage')) {
          const adminRoleNames = await getRoleNamesWithPermission('all.manage')
          if (adminRoleNames.length) {
            list = list.filter(r => !adminRoleNames.includes(r.name))
          }
        }
      }

      return res.status(200).json({ roles: list, total: list.length })
    } catch (e) {
      console.error('GET /api/roles', e)
      
return res.status(500).json({ error: e.message })
    }
  }

  if (req.method === 'POST') {
    try {
      const { name } = req.body || {}
      if (!name || !String(name).trim()) {
        return res.status(400).json({ error: 'name is required' })
      }
      const n = String(name).trim()
      const existing = await prisma.authRole.findUnique({ where: { name: n } })
      if (existing) {
        return res.status(409).json({ error: 'Role name already exists' })
      }
      const role = await prisma.authRole.create({ data: { name: n } })
      
return res.status(201).json({
        role: { id: role.id, name: role.name, userCount: 0, permissionCount: 0, permissionIds: [], permissionNames: [] }
      })
    } catch (e) {
      console.error('POST /api/roles', e)
      
return res.status(500).json({ error: e.message })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  
return res.status(405).end()
}
