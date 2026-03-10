/**
 * GET /api/permissions — Daftar permission (untuk RoleFormDialog, dll). User dengan permission.read atau all.manage boleh baca.
 * POST /api/permissions — Buat permission baru. Hanya permission.manage atau all.manage.
 */
import prisma from 'src/lib/prisma'
import { requireAuth, requirePermission } from 'src/lib/permissions-server'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    if (await requireAuth(req, res)) return
  } else {
    if (await requirePermission(req, res, 'permission.manage')) return
  }

  if (req.method === 'GET') {
    try {
      const { q = '' } = req.query

      const permissions = await prisma.permission.findMany({
        include: {
          roles: { include: { role: { select: { name: true } } } }
        },
        orderBy: { name: 'asc' }
      })

      let list = permissions.map(p => ({
        id: p.id,
        name: p.name,
        createdDate: p.createdAt ? new Date(p.createdAt).toLocaleString() : '—',
        assignedTo: p.roles.map(r => r.role.name)
      }))
      const queryLowered = (q || '').toLowerCase().trim()
      if (queryLowered) {
        list = list.filter(
          p =>
            p.name.toLowerCase().includes(queryLowered) ||
            p.assignedTo.some(r => r.toLowerCase().includes(queryLowered)) ||
            p.createdDate.toLowerCase().includes(queryLowered)
        )
      }
      
return res.status(200).json({ permissions: list, total: list.length, params: req.query })
    } catch (e) {
      console.error('GET /api/permissions', e)
      
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
      const existing = await prisma.permission.findUnique({ where: { name: n } })
      if (existing) {
        return res.status(409).json({ error: 'Permission name already exists' })
      }
      const permission = await prisma.permission.create({ data: { name: n } })
      
return res.status(201).json({
        permission: {
          id: permission.id,
          name: permission.name,
          createdDate: new Date(permission.createdAt).toLocaleString(),
          assignedTo: []
        }
      })
    } catch (e) {
      console.error('POST /api/permissions', e)
      
return res.status(500).json({ error: e.message })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  
return res.status(405).end()
}
