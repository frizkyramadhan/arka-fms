/**
 * GET /api/units — List units from local DB (synced from ark-fleet).
 * Query: unitNo, model, project, manufacture, plantGroup (contains), status (exact match).
 */
import prisma from 'src/lib/prisma'

function mapUnit(u) {
  return {
    id: u.id,
    code: u.code,
    model: u.model,
    description: u.description ?? null,
    projectId: u.projectId,
    projectName: u.projectName,
    manufacture: u.manufacture,
    plantGroup: u.plantGroup,
    plantType: u.plantType,
    unitStatus: u.unitStatus,
    lastSyncAt: u.lastSyncAt?.toISOString?.() ?? u.lastSyncAt,
    createdAt: u.createdAt?.toISOString?.() ?? u.createdAt,
    updatedAt: u.updatedAt?.toISOString?.() ?? u.updatedAt
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    
return res.status(405).end()
  }
  try {
    const { unitNo = '', model: modelQ = '', project = '', manufacture: manufactureQ = '', plantGroup: plantGroupQ = '', status: statusQ = '' } = req.query
    const where = {}
    const ands = []
    if (unitNo && String(unitNo).trim()) {
      ands.push({ code: { contains: String(unitNo).trim() } })
    }
    if (modelQ && String(modelQ).trim()) {
      ands.push({ model: { contains: String(modelQ).trim() } })
    }
    if (project && String(project).trim()) {
      const p = String(project).trim()
      ands.push({
        OR: [{ projectId: p }, { projectName: { contains: p } }]
      })
    }
    if (manufactureQ && String(manufactureQ).trim()) {
      ands.push({ manufacture: { contains: String(manufactureQ).trim() } })
    }
    if (plantGroupQ && String(plantGroupQ).trim()) {
      ands.push({ plantGroup: { contains: String(plantGroupQ).trim() } })
    }
    if (statusQ && String(statusQ).trim()) {
      ands.push({ unitStatus: String(statusQ).trim() })
    }
    if (ands.length) where.AND = ands

    const units = await prisma.unit.findMany({
      where,
      orderBy: { code: 'asc' }
    })
    const allData = await prisma.unit.findMany({ orderBy: { code: 'asc' } })
    
return res.status(200).json({
      allData: allData.map(mapUnit),
      units: units.map(mapUnit),
      total: units.length,
      params: req.query
    })
  } catch (e) {
    console.error('GET /api/units', e)
    
return res.status(500).json({ error: e.message })
  }
}
