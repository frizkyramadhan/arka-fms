/**
 * GET /api/maintenance-actuals — List (query: projectId, maintenanceTypeId, unitId, dateFrom, dateTo)
 * POST /api/maintenance-actuals — Create (body: maintenancePlanId, unitId, maintenanceDate, maintenanceTime?, hourMeter, remarks?, mechanics?, createdById)
 * ARKA MMS - Maintenance Actual CRUD (realisasi per unit, terhubung ke plan)
 */
import prisma from 'src/lib/prisma'

function mapActual(a) {
  return {
    id: a.id,
    maintenancePlanId: a.maintenancePlanId,
    unitId: a.unitId,
    unitCode: a.unit?.code ?? null,
    maintenanceDate: a.maintenanceDate?.toISOString?.()?.slice(0, 10) ?? null,
    maintenanceTime: a.maintenanceTime ?? null,
    hourMeter: a.hourMeter,
    remarks: a.remarks ?? null,
    mechanics: a.mechanics ?? null,
    createdById: a.createdById,
    createdByUsername: a.createdBy?.username ?? null,
    createdAt: a.createdAt?.toISOString?.() ?? a.createdAt,
    planProjectId: a.maintenancePlan?.projectId ?? null,
    planYear: a.maintenancePlan?.year ?? null,
    planMonth: a.maintenancePlan?.month ?? null,
    planTypeName: a.maintenancePlan?.maintenanceType?.name ?? null
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const {
        projectId = '',
        maintenanceTypeId = '',
        unitId = '',
        dateFrom = '',
        dateTo = ''
      } = req.query
      const where = {}
      const planFilter = {}
      if (projectId && String(projectId).trim()) {
        planFilter.projectId = String(projectId).trim()
      }
      if (maintenanceTypeId && String(maintenanceTypeId).trim()) {
        planFilter.maintenanceTypeId = String(maintenanceTypeId).trim()
      }
      if (Object.keys(planFilter).length) {
        where.maintenancePlan = planFilter
      }
      if (unitId && String(unitId).trim()) {
        where.unitId = String(unitId).trim()
      }
      if (dateFrom && String(dateFrom).trim()) {
        const d = new Date(String(dateFrom).trim())
        if (!isNaN(d.getTime())) where.maintenanceDate = { ...(where.maintenanceDate || {}), gte: d }
      }
      if (dateTo && String(dateTo).trim()) {
        const d = new Date(String(dateTo).trim())
        if (!isNaN(d.getTime())) {
          d.setHours(23, 59, 59, 999)
          where.maintenanceDate = { ...(where.maintenanceDate || {}), lte: d }
        }
      }

      const actuals = await prisma.maintenanceActual.findMany({
        where,
        include: {
          unit: { select: { code: true } },
          createdBy: { select: { username: true } },
          maintenancePlan: {
            select: {
              projectId: true,
              year: true,
              month: true,
              maintenanceType: { select: { name: true } }
            }
          }
        },
        orderBy: [{ createdAt: 'desc' }]
      })
      
return res.status(200).json({
        maintenanceActuals: actuals.map(mapActual),
        total: actuals.length,
        params: req.query
      })
    } catch (e) {
      console.error('GET /api/maintenance-actuals', e)
      
return res.status(500).json({ error: e.message })
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        maintenancePlanId,
        unitId,
        maintenanceDate,
        maintenanceTime,
        hourMeter,
        remarks,
        mechanics,
        createdById
      } = req.body || {}
      if (!maintenancePlanId || !String(maintenancePlanId).trim()) {
        return res.status(400).json({ error: 'maintenancePlanId is required' })
      }
      if (!unitId || !String(unitId).trim()) {
        return res.status(400).json({ error: 'unitId is required' })
      }
      const mDate = maintenanceDate ? new Date(maintenanceDate) : null
      if (!mDate || isNaN(mDate.getTime())) {
        return res.status(400).json({ error: 'maintenanceDate is required and must be valid' })
      }
      const hm = parseInt(hourMeter, 10)
      if (isNaN(hm) || hm < 0) {
        return res.status(400).json({ error: 'hourMeter must be a non-negative number' })
      }
      if (!createdById || !String(createdById).trim()) {
        return res.status(400).json({ error: 'createdById is required' })
      }
      await prisma.maintenancePlan.findUniqueOrThrow({
        where: { id: String(maintenancePlanId).trim() }
      })
      await prisma.unit.findUniqueOrThrow({
        where: { id: String(unitId).trim() }
      })

      const created = await prisma.maintenanceActual.create({
        data: {
          maintenancePlanId: String(maintenancePlanId).trim(),
          unitId: String(unitId).trim(),
          maintenanceDate: mDate,
          maintenanceTime:
            maintenanceTime != null && String(maintenanceTime).trim() !== ''
              ? String(maintenanceTime).trim()
              : null,
          hourMeter: hm,
          remarks: remarks != null && String(remarks).trim() !== '' ? String(remarks).trim() : null,
          mechanics:
            mechanics != null && String(mechanics).trim() !== '' ? String(mechanics).trim() : null,
          createdById: String(createdById).trim()
        },
        include: {
          unit: { select: { code: true } },
          createdBy: { select: { username: true } },
          maintenancePlan: {
            select: {
              projectId: true,
              year: true,
              month: true,
              maintenanceType: { select: { name: true } }
            }
          }
        }
      })
      
return res.status(201).json({ maintenanceActual: mapActual(created) })
    } catch (e) {
      if (e.code === 'P2025') {
        return res.status(400).json({ error: 'Maintenance plan or unit not found' })
      }
      console.error('POST /api/maintenance-actuals', e)
      
return res.status(500).json({ error: e.message })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  
return res.status(405).end()
}
