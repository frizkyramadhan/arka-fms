/**
 * GET /api/permissions/[id] — Satu permission. Semua user login boleh baca (untuk keperluan form).
 * PATCH/DELETE — Hanya permission.manage atau all.manage.
 */
import prisma from 'src/lib/prisma'
import { requireAuth, requirePermission } from 'src/lib/permissions-server'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    if (await requireAuth(req, res)) return
  } else {
    if (await requirePermission(req, res, 'permission.manage')) return
  }
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'id required' })

  if (req.method === 'GET') {
    try {
      const permission = await prisma.permission.findUnique({
        where: { id },
        include: { roles: { include: { role: true } } }
      })
      if (!permission) return res.status(404).json({ error: 'Permission not found' })
      
return res.status(200).json({
        permission: {
          id: permission.id,
          name: permission.name,
          createdDate: permission.createdAt ? new Date(permission.createdAt).toLocaleString() : '—',
          assignedTo: permission.roles.map(r => r.role.name)
        }
      })
    } catch (e) {
      console.error('GET /api/permissions/[id]', e)
      
return res.status(500).json({ error: e.message })
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { name } = req.body || {}
      if (!name || !String(name).trim()) {
        return res.status(400).json({ error: 'name is required' })
      }
      const n = String(name).trim()
      const existing = await prisma.permission.findFirst({ where: { name: n, id: { not: id } } })
      if (existing) return res.status(409).json({ error: 'Permission name already exists' })

      const permission = await prisma.permission.update({
        where: { id },
        data: { name: n },
        include: { roles: { include: { role: true } } }
      })
      
return res.status(200).json({
        permission: {
          id: permission.id,
          name: permission.name,
          createdDate: new Date(permission.createdAt).toLocaleString(),
          assignedTo: permission.roles.map(r => r.role.name)
        }
      })
    } catch (e) {
      console.error('PATCH /api/permissions/[id]', e)
      
return res.status(500).json({ error: e.message })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const permission = await prisma.permission.findUnique({ where: { id } })
      if (!permission) return res.status(404).json({ error: 'Permission not found' })
      await prisma.rolePermission.deleteMany({ where: { permissionId: id } })
      await prisma.permission.delete({ where: { id } })
      
return res.status(200).json({ success: true })
    } catch (e) {
      console.error('DELETE /api/permissions/[id]', e)
      
return res.status(500).json({ error: e.message })
    }
  }

  res.setHeader('Allow', ['GET', 'PATCH', 'DELETE'])
  
return res.status(405).end()
}
