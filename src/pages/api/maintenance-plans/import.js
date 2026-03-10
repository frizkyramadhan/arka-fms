/**
 * POST /api/maintenance-plans/import
 * Body: { plans: Array<{ projectId, year, month, maintenanceTypeId, sumPlan }>, createdById }
 * Upsert by unique (projectId, year, month, maintenanceTypeId): if exists update sumPlan, else create.
 * Returns: { created, updated, errors: [{ row, message }] }
 */
import prisma from 'src/lib/prisma'

function parseNum(v) {
  if (v === null || v === undefined) return NaN
  const n = typeof v === 'number' ? v : parseInt(String(v).trim(), 10)
  
return isNaN(n) ? NaN : n
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    
return res.status(405).end()
  }
  try {
    const { plans = [], createdById } = req.body || {}
    if (!Array.isArray(plans)) {
      return res.status(400).json({ error: 'plans must be an array' })
    }
    if (!createdById || !String(createdById).trim()) {
      return res.status(400).json({ error: 'createdById is required' })
    }
    const created = []
    const updated = []
    const errors = []
    const createdByIdTrim = String(createdById).trim()

    for (let row = 0; row < plans.length; row++) {
      const p = plans[row]
      const projectId = p?.projectId != null ? String(p.projectId).trim() : ''
      const year = parseNum(p?.year)
      const month = parseNum(p?.month)
      const maintenanceTypeId = p?.maintenanceTypeId != null ? String(p.maintenanceTypeId).trim() : ''
      const sumPlan = parseNum(p?.sumPlan)

      if (!projectId) {
        errors.push({ row: row + 1, message: 'Project is required' })
        continue
      }
      if (isNaN(year)) {
        errors.push({ row: row + 1, message: 'Year must be a number' })
        continue
      }
      if (isNaN(month) || month < 1 || month > 12) {
        errors.push({ row: row + 1, message: 'Month must be 1-12' })
        continue
      }
      if (!maintenanceTypeId) {
        errors.push({ row: row + 1, message: 'Maintenance Type is required' })
        continue
      }
      if (isNaN(sumPlan) || sumPlan < 0) {
        errors.push({ row: row + 1, message: 'Sum Plan must be a non-negative number' })
        continue
      }

      try {
        const existing = await prisma.maintenancePlan.findUnique({
          where: {
            projectId_year_month_maintenanceTypeId: {
              projectId,
              year,
              month,
              maintenanceTypeId
            }
          }
        })
        if (existing) {
          await prisma.maintenancePlan.update({
            where: { id: existing.id },
            data: { sumPlan }
          })
          updated.push(existing.id)
        } else {
          const createdPlan = await prisma.maintenancePlan.create({
            data: {
              projectId,
              year,
              month,
              maintenanceTypeId,
              sumPlan,
              createdById: createdByIdTrim
            }
          })
          created.push(createdPlan.id)
        }
      } catch (e) {
        errors.push({ row: row + 1, message: e.message || 'Upsert failed' })
      }
    }

    return res.status(200).json({
      created: created.length,
      updated: updated.length,
      errors: errors.length ? errors : undefined
    })
  } catch (e) {
    console.error('POST /api/maintenance-plans/import', e)
    
return res.status(500).json({ error: e.message })
  }
}
