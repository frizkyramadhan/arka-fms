/**
 * GET /api/maintenance-plans/[id] — Get one
 * PATCH /api/maintenance-plans/[id] — Update (body: sumPlan; optional: projectId, year, month, maintenanceTypeId)
 * DELETE /api/maintenance-plans/[id]
 * ARKA MMS - Maintenance Plan CRUD
 */
import prisma from 'src/lib/prisma'

function mapPlan(p) {
  return {
    id: p.id,
    projectId: p.projectId,
    year: p.year,
    month: p.month,
    maintenanceTypeId: p.maintenanceTypeId,
    maintenanceTypeName: p.maintenanceType?.name ?? null,
    sumPlan: p.sumPlan,
    createdById: p.createdById,
    createdByUsername: p.createdBy?.username ?? null,
    createdAt: p.createdAt?.toISOString?.() ?? p.createdAt,
    updatedAt: p.updatedAt?.toISOString?.() ?? p.updatedAt
  }
}

export default async function handler(req, res) {
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'id required' })

  if (req.method === 'GET') {
    try {
      const plan = await prisma.maintenancePlan.findUnique({
        where: { id },
        include: {
          maintenanceType: { select: { id: true, name: true } },
          createdBy: { select: { id: true, username: true } }
        }
      })
      if (!plan) return res.status(404).json({ error: 'Maintenance plan not found' })
      
return res.status(200).json(mapPlan(plan))
    } catch (e) {
      console.error('GET /api/maintenance-plans/[id]', e)
      
return res.status(500).json({ error: e.message })
    }
  }

  if (req.method === 'PATCH') {
    try {
      const plan = await prisma.maintenancePlan.findUnique({ where: { id } })
      if (!plan) return res.status(404).json({ error: 'Maintenance plan not found' })
      const { projectId, year, month, maintenanceTypeId, sumPlan } = req.body || {}
      const data = {}
      if (sumPlan !== undefined) {
        const sum = parseInt(sumPlan, 10)
        if (isNaN(sum) || sum < 0) return res.status(400).json({ error: 'sumPlan must be a non-negative number' })
        data.sumPlan = sum
      }
      if (projectId !== undefined) data.projectId = String(projectId).trim()
      if (year !== undefined) {
        const y = parseInt(year, 10)
        if (isNaN(y)) return res.status(400).json({ error: 'year must be a number' })
        data.year = y
      }
      if (month !== undefined) {
        const m = parseInt(month, 10)
        if (isNaN(m) || m < 1 || m > 12) return res.status(400).json({ error: 'month must be 1-12' })
        data.month = m
      }
      if (maintenanceTypeId !== undefined) data.maintenanceTypeId = String(maintenanceTypeId).trim()
      if (Object.keys(data).length === 0) {
        return res.status(200).json(mapPlan(plan))
      }

      const composite = {
        projectId: data.projectId ?? plan.projectId,
        year: data.year ?? plan.year,
        month: data.month ?? plan.month,
        maintenanceTypeId: data.maintenanceTypeId ?? plan.maintenanceTypeId
      }

      const existingOther = await prisma.maintenancePlan.findFirst({
        where: {
          id: { not: id },
          projectId: composite.projectId,
          year: composite.year,
          month: composite.month,
          maintenanceTypeId: composite.maintenanceTypeId
        }
      })
      if (existingOther) {
        return res.status(409).json({
          error: 'Another plan already exists for this project, year, month and maintenance type'
        })
      }

      const updated = await prisma.maintenancePlan.update({
        where: { id },
        data,
        include: {
          maintenanceType: { select: { name: true } },
          createdBy: { select: { username: true } }
        }
      })
      
return res.status(200).json(mapPlan(updated))
    } catch (e) {
      console.error('PATCH /api/maintenance-plans/[id]', e)
      
return res.status(500).json({ error: e.message })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const plan = await prisma.maintenancePlan.findUnique({ where: { id }, include: { actuals: true } })
      if (!plan) return res.status(404).json({ error: 'Maintenance plan not found' })
      if (plan.actuals && plan.actuals.length > 0) {
        return res.status(409).json({
          error: 'Cannot delete: plan has linked actuals. Remove or unlink actuals first.'
        })
      }
      await prisma.maintenancePlan.delete({ where: { id } })
      
return res.status(200).json({ success: true })
    } catch (e) {
      if (e.code === 'P2025') return res.status(404).json({ error: 'Maintenance plan not found' })
      console.error('DELETE /api/maintenance-plans/[id]', e)
      
return res.status(500).json({ error: e.message })
    }
  }

  res.setHeader('Allow', ['GET', 'PATCH', 'DELETE'])
  
return res.status(405).end()
}
