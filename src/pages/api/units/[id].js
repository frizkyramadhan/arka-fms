/**
 * GET /api/units/[id] — Get unit with maintenance actuals.
 * Unit model hanya punya relasi maintenanceActuals (bukan maintenancePlans);
 * maintenancePlans dikembalikan kosong karena di schema plans agregat per project/bulan/tipe.
 */
import prisma from 'src/lib/prisma'

function mapActual(a) {
  return {
    id: a.id,
    planId: a.maintenancePlanId,
    unitId: a.unitId,
    maintenanceTypeId: a.maintenancePlan?.maintenanceTypeId,
    maintenanceTypeName: a.maintenancePlan?.maintenanceType?.name ?? null,
    maintenanceDate: a.maintenanceDate?.toISOString?.() ?? a.maintenanceDate,
    maintenanceTime: a.maintenanceTime ?? null,
    hourMeter: a.hourMeter,
    createdAt: a.createdAt?.toISOString?.() ?? a.createdAt
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    
return res.status(405).end()
  }
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'id required' })
  try {
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        maintenanceActuals: {
          include: {
            maintenancePlan: { include: { maintenanceType: true } }
          },
          orderBy: { maintenanceDate: 'desc' }
        }
      }
    })
    if (!unit) return res.status(404).json({ error: 'Unit not found' })
    
return res.status(200).json({
      id: unit.id,
      code: unit.code,
      model: unit.model,
      description: unit.description ?? null,
      projectId: unit.projectId,
      projectName: unit.projectName,
      manufacture: unit.manufacture,
      plantGroup: unit.plantGroup,
      plantType: unit.plantType,
      unitStatus: unit.unitStatus,
      lastSyncAt: unit.lastSyncAt?.toISOString?.() ?? unit.lastSyncAt,
      createdAt: unit.createdAt?.toISOString?.() ?? unit.createdAt,
      updatedAt: unit.updatedAt?.toISOString?.() ?? unit.updatedAt,
      maintenancePlans: [],
      maintenanceActuals: unit.maintenanceActuals.map(mapActual)
    })
  } catch (e) {
    console.error('GET /api/units/[id]', e)
    
return res.status(500).json({ error: e.message })
  }
}
