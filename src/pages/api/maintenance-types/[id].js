/**
 * GET /api/maintenance-types/[id] — Get one
 * PATCH /api/maintenance-types/[id] — Update (body: name)
 * DELETE /api/maintenance-types/[id]
 * ARKA MMS - Maintenance Type CRUD
 */
import prisma from 'src/lib/prisma'

function mapItem(m) {
  return {
    id: m.id,
    name: m.name,
    createdAt: m.createdAt?.toISOString?.() ?? m.createdAt
  }
}

export default async function handler(req, res) {
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'id required' })

  if (req.method === 'GET') {
    try {
      const item = await prisma.maintenanceType.findUnique({ where: { id } })
      if (!item) return res.status(404).json({ error: 'Maintenance type not found' })
      
return res.status(200).json(mapItem(item))
    } catch (e) {
      console.error('GET /api/maintenance-types/[id]', e)
      
return res.status(500).json({ error: e.message })
    }
  }

  if (req.method === 'PATCH') {
    try {
      const item = await prisma.maintenanceType.findUnique({ where: { id } })
      if (!item) return res.status(404).json({ error: 'Maintenance type not found' })
      const { name } = req.body || {}
      if (name !== undefined) {
        if (!String(name).trim()) {
          return res.status(400).json({ error: 'name cannot be empty' })
        }

        const existing = await prisma.maintenanceType.findFirst({
          where: {
            name: name.trim(),
            id: { not: id }
          }
        })
        if (existing) {
          return res.status(409).json({ error: 'Another maintenance type with this name already exists' })
        }
      }
      const data = {}
      if (name !== undefined) data.name = name.trim()
      const updated = await prisma.maintenanceType.update({ where: { id }, data })
      
return res.status(200).json(mapItem(updated))
    } catch (e) {
      console.error('PATCH /api/maintenance-types/[id]', e)
      
return res.status(500).json({ error: e.message })
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.maintenanceType.delete({ where: { id } })
      
return res.status(200).json({ success: true })
    } catch (e) {
      if (e.code === 'P2025') return res.status(404).json({ error: 'Maintenance type not found' })
      if (e.code === 'P2003') {
        return res.status(409).json({
          error: 'Cannot delete: this type is used in maintenance plans or actuals. Remove usage first.'
        })
      }
      console.error('DELETE /api/maintenance-types/[id]', e)
      
return res.status(500).json({ error: e.message })
    }
  }

  res.setHeader('Allow', ['GET', 'PATCH', 'DELETE'])
  
return res.status(405).end()
}
