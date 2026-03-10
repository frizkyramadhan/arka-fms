/**
 * POST /api/units/sync — Fetch equipments from ark-fleet API and upsert into units table.
 * Payload: id, unit_no, description, model, project_id, project_code, manufacture, plant_group, plant_type, unitstatus
 */
import prisma from 'src/lib/prisma'
import getEquipmentsUrl from 'src/configs/arkFleetApi'

/** Truncate string to max length for DB (e.g. description VARCHAR(255)) */
function truncate(s, max = 255) {
  if (s == null || typeof s !== 'string') return s
  const t = s.trim()
  
return t.length > max ? t.slice(0, max) : t
}

function mapEquipmentToUnit(item) {
  const id = item.id != null ? String(item.id) : ''
  const code = (item.unit_no != null ? String(item.unit_no).trim() : id) || id
  const model = item.model != null ? String(item.model).trim() : null
  const description = item.description != null ? truncate(String(item.description), 255) : null
  const projectId = item.project_id != null ? String(item.project_id) : null
  const projectName = item.project_code != null ? String(item.project_code).trim() : null
  const manufacture = item.manufacture != null ? String(item.manufacture).trim() : null
  const plantGroup = item.plant_group != null ? String(item.plant_group).trim() : null
  const plantType = item.plant_type != null ? String(item.plant_type).trim() : null
  const unitStatus = item.unitstatus != null ? String(item.unitstatus).trim() : null
  
return { id, code, model, description, projectId, projectName, manufacture, plantGroup, plantType, unitStatus }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    
return res.status(405).end()
  }
  try {
    let url
    try {
      url = getEquipmentsUrl()
      if (!url || typeof url !== 'string') {
        return res.status(500).json({ error: 'ARK_FLEET_EQUIPMENTS_URL is not configured' })
      }
    } catch (urlErr) {
      console.error('POST /api/units/sync getEquipmentsUrl:', urlErr)
      
return res.status(500).json({ error: (urlErr?.message || 'Invalid sync URL config') })
    }
    const response = await fetch(url)

    const data = await response.json().catch(err => {
      console.error('POST /api/units/sync response.json:', err)
      
return null
    })
    if (!response.ok) {
      return res.status(502).json({
        error: 'ARKFleet API error',
        status: response.status,
        details: data
      })
    }
    const rawList = Array.isArray(data) ? data : data?.data ?? data?.items ?? []
    if (!Array.isArray(rawList)) {
      return res.status(502).json({ error: 'Unexpected equipments response shape', data })
    }
    const now = new Date()
    let created = 0
    let updated = 0
    const errors = []
    for (let i = 0; i < rawList.length; i++) {
      const item = rawList[i]
      try {
        const { id, code, model, description, projectId, projectName, manufacture, plantGroup, plantType, unitStatus } =
          mapEquipmentToUnit(item)
        if (!id || !code) continue
        const existing = await prisma.unit.findUnique({ where: { id } })

        const payload = {
          code,
          model: model ?? null,
          description: description ?? null,
          projectId: projectId ?? null,
          projectName: projectName ?? null,
          manufacture: manufacture ?? null,
          plantGroup: plantGroup ?? null,
          plantType: plantType ?? null,
          unitStatus: unitStatus ?? null,
          lastSyncAt: now
        }
        if (existing) {
          await prisma.unit.update({
            where: { id },
            data: payload
          })
          updated += 1
        } else {
          await prisma.unit.create({
            data: {
              id,
              ...payload
            }
          })
          created += 1
        }
      } catch (rowErr) {
        const msg = rowErr?.message || String(rowErr)
        console.error(`POST /api/units/sync row ${i} (id: ${item?.id}):`, msg)
        errors.push({ index: i, id: item?.id, error: msg })
      }
    }
    if (errors.length > 0 && created === 0 && updated === 0) {
      return res.status(500).json({
        error: errors[0].error,
        code: 'SYNC_ROW_ERROR',
        details: errors
      })
    }
    
return res.status(200).json({
      ok: true,
      synced: rawList.length,
      created,
      updated,
      ...(errors.length > 0 && { errors: errors.length, errorDetails: errors })
    })
  } catch (e) {
    console.error('POST /api/units/sync', e)
    console.error('POST /api/units/sync stack:', e?.stack)
    const message = e?.message || 'Sync failed'
    const code = e?.code
    
return res.status(500).json({
      error: message,
      ...(code && { code }),
      ...(e?.meta && { meta: e.meta }),
      ...(process.env.NODE_ENV !== 'production' && e?.stack && { stack: e.stack })
    })
  }
}
