/**
 * GET /api/maintenance-plans — List (query: projectId, year, month, maintenanceTypeId)
 * POST /api/maintenance-plans — Create (body: projectId, year, month, maintenanceTypeId, sumPlan, createdById)
 * ARKA MMS - Maintenance Plan CRUD (agregat per project, year, month, maintenance type)
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
  if (req.method === 'GET') {
    try {
      const { projectId = '', year = '', month = '', maintenanceTypeId = '' } = req.query
      const where = {}
      if (projectId && String(projectId).trim()) where.projectId = String(projectId).trim()
      if (year !== '') {
        const y = parseInt(year, 10)
        if (!isNaN(y)) where.year = y
      }
      if (month !== '') {
        const m = parseInt(month, 10)
        if (!isNaN(m) && m >= 1 && m <= 12) where.month = m
      }
      if (maintenanceTypeId && String(maintenanceTypeId).trim()) {
        where.maintenanceTypeId = String(maintenanceTypeId).trim()
      }

      const plans = await prisma.maintenancePlan.findMany({
        where,
        include: {
          maintenanceType: { select: { name: true } },
          createdBy: { select: { username: true } }
        },
        orderBy: [{ createdAt: 'desc' }]
      })

      const allData = await prisma.maintenancePlan.findMany({
        include: {
          maintenanceType: { select: { name: true } },
          createdBy: { select: { username: true } }
        },
        orderBy: [{ createdAt: 'desc' }]
      })
      
return res.status(200).json({
        allData: allData.map(mapPlan),
        maintenancePlans: plans.map(mapPlan),
        total: plans.length,
        params: req.query
      })
    } catch (e) {
      console.error('GET /api/maintenance-plans', e)
      
return res.status(500).json({ error: e.message })
    }
  }

  if (req.method === 'POST') {
    try {
      const { projectId, year, month, maintenanceTypeId, sumPlan, createdById } = req.body || {}
      if (!projectId || !String(projectId).trim()) {
        return res.status(400).json({ error: 'projectId is required' })
      }
      const y = parseInt(year, 10)
      const m = parseInt(month, 10)
      if (isNaN(y) || isNaN(m) || m < 1 || m > 12) {
        return res.status(400).json({ error: 'year and month (1-12) are required' })
      }
      if (!maintenanceTypeId || !String(maintenanceTypeId).trim()) {
        return res.status(400).json({ error: 'maintenanceTypeId is required' })
      }
      const sum = parseInt(sumPlan, 10)
      if (isNaN(sum) || sum < 0) {
        return res.status(400).json({ error: 'sumPlan must be a non-negative number' })
      }
      if (!createdById || !String(createdById).trim()) {
        return res.status(400).json({ error: 'createdById is required' })
      }

      const existing = await prisma.maintenancePlan.findUnique({
        where: {
          projectId_year_month_maintenanceTypeId: {
            projectId: String(projectId).trim(),
            year: y,
            month: m,
            maintenanceTypeId: String(maintenanceTypeId).trim()
          }
        }
      })
      if (existing) {
        return res.status(409).json({
          error: 'Plan already exists for this project, year, month and maintenance type'
        })
      }

      const created = await prisma.maintenancePlan.create({
        data: {
          projectId: String(projectId).trim(),
          year: y,
          month: m,
          maintenanceTypeId: String(maintenanceTypeId).trim(),
          sumPlan: sum,
          createdById: String(createdById).trim()
        },
        include: {
          maintenanceType: { select: { name: true } },
          createdBy: { select: { username: true } }
        }
      })
      
return res.status(201).json({ maintenancePlan: mapPlan(created) })
    } catch (e) {
      console.error('POST /api/maintenance-plans', e)
      
return res.status(500).json({ error: e.message })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  
return res.status(405).end()
}
