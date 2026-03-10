/**
 * GET /api/dashboard/stats
 * Statistik untuk Dashboard Maintenance: Total Unit, Total Plan Bulan Ini, Total Actual + %, Selisih (plan - actual).
 */
import prisma from 'src/lib/prisma'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // 1-12

    // Total unit aktif (dari tabel units)
    const totalUnits = await prisma.unit.count()

    // Plan bulan ini dengan sumPlan dan jumlah actual
    const plansThisMonth = await prisma.maintenancePlan.findMany({
      where: { year: currentYear, month: currentMonth },
      select: {
        sumPlan: true,
        _count: { select: { actuals: true } }
      }
    })

    const totalPlanThisMonth = plansThisMonth.reduce((s, p) => s + (p.sumPlan ?? 0), 0)
    const totalActualThisMonth = plansThisMonth.reduce((s, p) => s + (p._count?.actuals ?? 0), 0)
    const selisihBelum = Math.max(0, totalPlanThisMonth - totalActualThisMonth)

    const persenActual =
      totalPlanThisMonth > 0
        ? Math.round((totalActualThisMonth / totalPlanThisMonth) * 1000) / 10
        : null

    return res.status(200).json({
      totalUnits,
      totalPlanThisMonth,
      totalActualThisMonth,
      selisihBelum,
      persenActual,
      meta: {
        currentYear,
        currentMonth
      }
    })
  } catch (e) {
    console.error('GET /api/dashboard/stats', e)
    
return res.status(500).json({ error: e.message })
  }
}
