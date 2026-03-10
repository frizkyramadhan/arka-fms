/**
 * GET /api/dashboard/achievement?year=YYYY
 * Data achievement program maintenance per site, per program CBM, per bulan (PLAN, ACTUAL, ACH).
 * Untuk tampilan "ACHIEVEMENT PROGRAM MAINTENANCE ALL SITE".
 */
import prisma from 'src/lib/prisma'

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
]

function ach(actual, plan) {
  if (plan == null || plan === 0) return null
  
return Math.round((actual / plan) * 1000) / 10
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear()

    const projectId = typeof req.query.projectId === 'string' && req.query.projectId.trim()
      ? req.query.projectId.trim()
      : null

    // Tipe maintenance (urutan: Inspection, Washing, Greasing, Track Cleaning, PPU/CTS)
    const types = await prisma.maintenanceType.findMany({
      orderBy: { name: 'asc' }
    })

    // Daftar project untuk filter dropdown (semua project yang punya plan di tahun ini)
    const planProjectIds = await prisma.maintenancePlan.findMany({
      where: { year },
      select: { projectId: true }
    })
    const projectIds = [...new Set(planProjectIds.map(p => p.projectId))]
    const projects = projectIds.map(id => ({ id, name: id }))

    const planWhere = { year }
    if (projectId) planWhere.projectId = projectId

    // Plan tahun ini (opsional filter by project)
    const plans = await prisma.maintenancePlan.findMany({
      where: planWhere,
      include: {
        maintenanceType: { select: { id: true, name: true } },
        _count: { select: { actuals: true } }
      }
    })

    // Site = distinct projectId (urutan muncul) dari data yang sudah di-filter
    const siteIds = [...new Set(plans.map(p => p.projectId))]
    const sites = siteIds.map(id => ({ id, name: id }))

    // Build per (site, type, month): plan, actual
    const byKey = {}
    for (const p of plans) {
      const key = `${p.projectId}|${p.maintenanceTypeId}`
      if (!byKey[key]) {
        byKey[key] = {
          siteId: p.projectId,
          typeId: p.maintenanceTypeId,
          typeName: p.maintenanceType.name,
          months: Array.from({ length: 12 }, () => ({ plan: 0, actual: 0 }))
        }
      }
      const monthIndex = p.month - 1
      byKey[key].months[monthIndex].plan = p.sumPlan
      byKey[key].months[monthIndex].actual = p._count.actuals
    }

    const programRows = []
    for (const site of sites) {
      for (const type of types) {
        const key = `${site.id}|${type.id}`
        const row = byKey[key]

        const months = row
          ? row.months.map((m, i) => ({
              plan: m.plan,
              actual: m.actual,
              ach: ach(m.actual, m.plan),
              label: MONTH_LABELS[i]
            }))
          : Array.from({ length: 12 }, (_, i) => ({ plan: 0, actual: 0, ach: null, label: MONTH_LABELS[i] }))

        const totalPlan = months.reduce((s, m) => s + m.plan, 0)
        const totalActual = months.reduce((s, m) => s + m.actual, 0)
        programRows.push({
          siteId: site.id,
          siteName: site.name,
          typeId: type.id,
          typeName: type.name,
          months,
          totalPlan,
          totalActual,
          ach: ach(totalActual, totalPlan)
        })
      }
    }

    // Site "All Program" totals
    const siteTotals = sites.map(site => {
      const rows = programRows.filter(r => r.siteId === site.id)
      const totalPlan = rows.reduce((s, r) => s + r.totalPlan, 0)
      const totalActual = rows.reduce((s, r) => s + r.totalActual, 0)
      
return {
        siteId: site.id,
        siteName: site.name,
        totalPlan,
        totalActual,
        ach: ach(totalActual, totalPlan)
      }
    })

    // All Site Ach
    const allPlan = siteTotals.reduce((s, t) => s + t.totalPlan, 0)
    const allActual = siteTotals.reduce((s, t) => s + t.totalActual, 0)

    return res.status(200).json({
      year,
      projectId,
      monthLabels: MONTH_LABELS,
      projects,
      sites,
      types,
      programRows,
      siteTotals,
      allSiteAch: { totalPlan: allPlan, totalActual: allActual, ach: ach(allActual, allPlan) }
    })
  } catch (e) {
    console.error('GET /api/dashboard/achievement', e)
    
return res.status(500).json({ error: e.message })
  }
}
