/**
 * GET /api/attachments/[id] — Get one attachment
 * DELETE /api/attachments/[id] — Delete attachment (and file from disk if under /uploads/attachments)
 */
import fs from 'fs'
import path from 'path'
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
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'id required' })

  if (req.method === 'GET') {
    try {
      const attachment = await prisma.attachment.findUnique({
        where: { id },
        include: {
          uploadedBy: { select: { username: true } }
        }
      })
      if (!attachment) return res.status(404).json({ error: 'Attachment not found' })
      
return res.status(200).json(mapAttachment(attachment))
    } catch (e) {
      console.error('GET /api/attachments/[id]', e)
      
return res.status(500).json({ error: e.message })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const attachment = await prisma.attachment.findUnique({ where: { id } })
      if (!attachment) return res.status(404).json({ error: 'Attachment not found' })

      if (attachment.storagePath?.startsWith('/uploads/attachments/')) {
        const filePath = path.join(process.cwd(), 'public', attachment.storagePath)
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath)
          } catch (unlinkErr) {
            console.warn('Could not delete file:', filePath, unlinkErr)
          }
        }
      }

      await prisma.attachment.delete({ where: { id } })
      
return res.status(200).json({ success: true })
    } catch (e) {
      if (e.code === 'P2025') return res.status(404).json({ error: 'Attachment not found' })
      console.error('DELETE /api/attachments/[id]', e)
      
return res.status(500).json({ error: e.message })
    }
  }

  res.setHeader('Allow', ['GET', 'DELETE'])
  
return res.status(405).end()
}

