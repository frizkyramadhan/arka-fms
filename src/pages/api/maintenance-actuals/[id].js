/**
 * GET /api/maintenance-actuals/[id] — Get one
 * PATCH /api/maintenance-actuals/[id] — Update (body: maintenancePlanId?, unitId?, maintenanceDate?, maintenanceTime?, hourMeter?, remarks?, mechanics?)
 * DELETE /api/maintenance-actuals/[id]
 * ARKA MMS - Maintenance Actual CRUD
 */
import prisma from 'src/lib/prisma'

function mapActual(a) {
  return {
    id: a.id,
    maintenancePlanId: a.maintenancePlanId,
    unitId: a.unitId,
    unitCode: a.unit?.code ?? null,
    unitProjectName: a.unit?.projectName ?? null,
    unitModel: a.unit?.model ?? null,
    unitDescription: a.unit?.description ?? null,
    unitManufacture: a.unit?.manufacture ?? null,
    unitPlantGroup: a.unit?.plantGroup ?? null,
    unitPlantType: a.unit?.plantType ?? null,
    unitStatus: a.unit?.unitStatus ?? null,
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
    planMaintenanceTypeId: a.maintenancePlan?.maintenanceType?.id ?? a.maintenancePlan?.maintenanceTypeId ?? null,
    planTypeName: a.maintenancePlan?.maintenanceType?.name ?? null
  }
}

export default async function handler(req, res) {
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'id required' })

  if (req.method === 'GET') {
    try {
      const actual = await prisma.maintenanceActual.findUnique({
        where: { id },
        include: {
          unit: {
            select: {
              id: true,
              code: true,
              projectName: true,
              model: true,
              description: true,
              manufacture: true,
              plantGroup: true,
              plantType: true,
              unitStatus: true
            }
          },
          createdBy: { select: { id: true, username: true } },
          maintenancePlan: {
            select: {
              id: true,
              projectId: true,
              year: true,
              month: true,
              maintenanceType: { select: { id: true, name: true } }
            }
          }
        }
      })
      if (!actual) return res.status(404).json({ error: 'Maintenance actual not found' })
      
return res.status(200).json(mapActual(actual))
    } catch (e) {
      console.error('GET /api/maintenance-actuals/[id]', e)
      
return res.status(500).json({ error: e.message })
    }
  }

  if (req.method === 'PATCH') {
    try {
      const actual = await prisma.maintenanceActual.findUnique({ where: { id } })
      if (!actual) return res.status(404).json({ error: 'Maintenance actual not found' })

      const {
        maintenancePlanId,
        unitId,
        maintenanceDate,
        maintenanceTime,
        hourMeter,
        remarks,
        mechanics
      } = req.body || {}
      const data = {}
      if (maintenancePlanId !== undefined) {
        if (!String(maintenancePlanId).trim()) {
          return res.status(400).json({ error: 'maintenancePlanId cannot be empty' })
        }
        data.maintenancePlanId = String(maintenancePlanId).trim()
      }
      if (unitId !== undefined) {
        if (!String(unitId).trim()) {
          return res.status(400).json({ error: 'unitId cannot be empty' })
        }
        data.unitId = String(unitId).trim()
      }
      if (maintenanceDate !== undefined) {
        const d = new Date(maintenanceDate)
        if (isNaN(d.getTime())) return res.status(400).json({ error: 'maintenanceDate must be valid' })
        data.maintenanceDate = d
      }
      if (maintenanceTime !== undefined) {
        data.maintenanceTime =
          maintenanceTime != null && String(maintenanceTime).trim() !== ''
            ? String(maintenanceTime).trim()
            : null
      }
      if (hourMeter !== undefined) {
        const hm = parseInt(hourMeter, 10)
        if (isNaN(hm) || hm < 0) {
          return res.status(400).json({ error: 'hourMeter must be non-negative' })
        }
        data.hourMeter = hm
      }
      if (remarks !== undefined) {
        data.remarks =
          remarks != null && String(remarks).trim() !== '' ? String(remarks).trim() : null
      }
      if (mechanics !== undefined) {
        data.mechanics =
          mechanics != null && String(mechanics).trim() !== '' ? String(mechanics).trim() : null
      }
      if (Object.keys(data).length === 0) {
        const current = await prisma.maintenanceActual.findUnique({
          where: { id },
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
        
return res.status(200).json(mapActual(current))
      }
      if (data.maintenancePlanId) {
        await prisma.maintenancePlan.findUniqueOrThrow({ where: { id: data.maintenancePlanId } })
      }
      if (data.unitId) {
        await prisma.unit.findUniqueOrThrow({ where: { id: data.unitId } })
      }

      const updated = await prisma.maintenanceActual.update({
        where: { id },
        data,
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
      
return res.status(200).json(mapActual(updated))
    } catch (e) {
      if (e.code === 'P2025') {
        return res.status(400).json({ error: 'Maintenance plan or unit not found' })
      }
      console.error('PATCH /api/maintenance-actuals/[id]', e)
      
return res.status(500).json({ error: e.message })
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.maintenanceActual.delete({ where: { id } })
      
return res.status(200).json({ success: true })
    } catch (e) {
      if (e.code === 'P2025') return res.status(404).json({ error: 'Maintenance actual not found' })
      console.error('DELETE /api/maintenance-actuals/[id]', e)
      
return res.status(500).json({ error: e.message })
    }
  }

  res.setHeader('Allow', ['GET', 'PATCH', 'DELETE'])
  
return res.status(405).end()
}
