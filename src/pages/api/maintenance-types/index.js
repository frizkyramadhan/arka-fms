/**
 * GET /api/maintenance-types — List (query: q)
 * POST /api/maintenance-types — Create (body: name)
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
  if (req.method === 'GET') {
    try {
      const { q = '' } = req.query
      const where = {}
      if (q && q.trim()) {
        where.name = { contains: q.trim() }
      }

      const items = await prisma.maintenanceType.findMany({
        where,
        orderBy: { name: 'asc' }
      })

      const allData = await prisma.maintenanceType.findMany({
        orderBy: { name: 'asc' }
      })
      
return res.status(200).json({
        allData: allData.map(mapItem),
        maintenanceTypes: items.map(mapItem),
        total: items.length,
        params: req.query
      })
    } catch (e) {
      console.error('GET /api/maintenance-types', e)
      
return res.status(500).json({ error: e.message })
    }
  }

  if (req.method === 'POST') {
    try {
      const { name } = req.body || {}
      if (!name || !String(name).trim()) {
        return res.status(400).json({ error: 'name is required' })
      }

      const existing = await prisma.maintenanceType.findFirst({
        where: { name: name.trim() }
      })
      if (existing) {
        return res.status(409).json({ error: 'Maintenance type with this name already exists' })
      }

      const created = await prisma.maintenanceType.create({
        data: { name: name.trim() }
      })
      
return res.status(201).json({ maintenanceType: mapItem(created) })
    } catch (e) {
      console.error('POST /api/maintenance-types', e)
      
return res.status(500).json({ error: e.message })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  
return res.status(405).end()
}
