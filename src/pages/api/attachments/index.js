/**
 * GET /api/attachments — List attachments by entityType & entityId
 * POST /api/attachments — Create attachment (metadata only, storagePath as URL or external path)
 * Currently used for MAINTENANCE_ACTUAL attachments from Maintenance Actual detail view.
 */
import prisma from 'src/lib/prisma'

function mapAttachment(a) {
  return {
    id: a.id,
    entityType: a.entityType,
    entityId: a.entityId,
    fileName: a.fileName,
    fileType: a.fileType ?? null,
    fileSize: a.fileSize ?? null,
    storagePath: a.storagePath,
    uploadedById: a.uploadedById,
    uploadedByUsername: a.uploadedBy?.username ?? null,
    uploadedAt: a.uploadedAt?.toISOString?.() ?? a.uploadedAt
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { entityType = '', entityId = '' } = req.query
      const type = String(entityType || '').trim()
      const id = String(entityId || '').trim()

      if (!type || !id) {
        return res.status(400).json({ error: 'entityType and entityId are required' })
      }

      if (type !== 'MAINTENANCE_ACTUAL' && type !== 'MAINTENANCE_PLAN') {
        return res.status(400).json({ error: 'Unsupported entityType' })
      }

      const attachments = await prisma.attachment.findMany({
        where: { entityType: type, entityId: id },
        include: {
          uploadedBy: { select: { username: true } }
        },
        orderBy: [{ uploadedAt: 'desc' }]
      })

      return res.status(200).json({
        attachments: attachments.map(mapAttachment),
        total: attachments.length,
        params: { entityType: type, entityId: id }
      })
    } catch (e) {
      console.error('GET /api/attachments', e)
      
return res.status(500).json({ error: e.message })
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        entityType,
        entityId,
        fileName,
        storagePath,
        fileType,
        fileSize,
        uploadedById
      } = req.body || {}

      const type = String(entityType || '').trim()
      const id = String(entityId || '').trim()
      const name = String(fileName || '').trim()
      const path = String(storagePath || '').trim()

      if (!type || !id) {
        return res.status(400).json({ error: 'entityType and entityId are required' })
      }
      if (!name) {
        return res.status(400).json({ error: 'fileName is required' })
      }
      if (!path) {
        return res.status(400).json({ error: 'storagePath is required' })
      }
      if (!uploadedById || !String(uploadedById).trim()) {
        return res.status(400).json({ error: 'uploadedById is required' })
      }

      if (type !== 'MAINTENANCE_ACTUAL' && type !== 'MAINTENANCE_PLAN') {
        return res.status(400).json({ error: 'Unsupported entityType' })
      }

      // Ensure related entity exists (for now only MaintenanceActual is used from UI)
      if (type === 'MAINTENANCE_ACTUAL') {
        await prisma.maintenanceActual.findUniqueOrThrow({ where: { id } })
      }

      const size =
        fileSize !== undefined && fileSize !== null && String(fileSize).trim() !== ''
          ? parseInt(fileSize, 10)
          : null
      if (size !== null && (isNaN(size) || size < 0)) {
        return res.status(400).json({ error: 'fileSize must be a non-negative number if provided' })
      }

      const created = await prisma.attachment.create({
        data: {
          entityType: type,
          entityId: id,
          fileName: name,
          storagePath: path,
          fileType: fileType != null && String(fileType).trim() !== '' ? String(fileType).trim() : null,
          fileSize: size,
          uploadedById: String(uploadedById).trim()
        },
        include: {
          uploadedBy: { select: { username: true } }
        }
      })

      return res.status(201).json({ attachment: mapAttachment(created) })
    } catch (e) {
      if (e.code === 'P2025') {
        return res.status(400).json({ error: 'Related entity not found' })
      }
      console.error('POST /api/attachments', e)
      
return res.status(500).json({ error: e.message })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  
return res.status(405).end()
}

