/**
 * GET /api/roles/[id] — Satu role dengan permissions.
 * PATCH/DELETE — Hanya user dengan permission role.manage atau all.manage.
 */
import prisma from 'src/lib/prisma'
import { requireAuth, requirePermission } from 'src/lib/permissions-server'

function mapRole(r) {
  return {
    id: r.id,
    name: r.name,
    userCount: r._count?.users ?? 0,
    permissionCount: r._count?.permissions ?? r.permissions?.length ?? 0,
    permissionIds: (r.permissions || []).map(p => p.permission?.id ?? p.permissionId),
    permissionNames: (r.permissions || []).map(p => p.permission?.name ?? '')
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    if (await requireAuth(req, res)) return
  } else {
    if (await requirePermission(req, res, 'role.manage')) return
  }
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'id required' })

  if (req.method === 'GET') {
    try {
      const role = await prisma.authRole.findUnique({
        where: { id },
        include: {
          _count: { select: { users: true, permissions: true } },
          permissions: { include: { permission: true } }
        }
      })
      if (!role) return res.status(404).json({ error: 'Role not found' })
      
return res.status(200).json({ role: mapRole(role) })
    } catch (e) {
      console.error('GET /api/roles/[id]', e)
      
return res.status(500).json({ error: e.message })
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { name, permissionIds } = req.body || {}
      const role = await prisma.authRole.findUnique({ where: { id } })
      if (!role) return res.status(404).json({ error: 'Role not found' })

      if (name !== undefined && String(name).trim()) {
        const n = String(name).trim()
        const existing = await prisma.authRole.findFirst({ where: { name: n, id: { not: id } } })
        if (existing) return res.status(409).json({ error: 'Role name already exists' })
        await prisma.authRole.update({ where: { id }, data: { name: n } })
      }

      if (Array.isArray(permissionIds)) {
        await prisma.rolePermission.deleteMany({ where: { roleId: id } })
        if (permissionIds.length > 0) {
          const permIds = permissionIds.filter(Boolean)
          const existing = await prisma.permission.findMany({ where: { id: { in: permIds } }, select: { id: true } })
          const validIds = existing.map(p => p.id)
          await prisma.rolePermission.createMany({
            data: validIds.map(permissionId => ({ roleId: id, permissionId }))
          })
        }
      }

      const updated = await prisma.authRole.findUnique({
        where: { id },
        include: { _count: { select: { users: true, permissions: true } }, permissions: { include: { permission: true } } }
      })
      
return res.status(200).json({ role: mapRole(updated) })
    } catch (e) {
      console.error('PATCH /api/roles/[id]', e)
      
return res.status(500).json({ error: e.message })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const role = await prisma.authRole.findUnique({ where: { id } })
      if (!role) return res.status(404).json({ error: 'Role not found' })
      await prisma.rolePermission.deleteMany({ where: { roleId: id } })
      await prisma.userRole.deleteMany({ where: { roleId: id } })
      await prisma.authRole.delete({ where: { id } })
      
return res.status(200).json({ success: true })
    } catch (e) {
      console.error('DELETE /api/roles/[id]', e)
      
return res.status(500).json({ error: e.message })
    }
  }

  res.setHeader('Allow', ['GET', 'PATCH', 'DELETE'])
  
return res.status(405).end()
}
