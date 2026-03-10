/**
 * POST /api/attachments/upload-start — Start a chunked upload.
 * Body: { entityType, entityId, uploadedById, fileName, fileType?, totalSize, totalChunks }
 * Creates a temp directory and returns { uploadId }. Use upload-chunk for each chunk.
 */
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import prisma from 'src/lib/prisma'

const TMP_DIR = path.join(process.cwd(), 'public', 'uploads', 'tmp')
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB total per file

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    
return res.status(405).end()
  }

  try {
    const { entityType, entityId, uploadedById, fileName, fileType, totalSize, totalChunks } = req.body || {}

    const type = String(entityType || '').trim()
    const id = String(entityId || '').trim()
    const uid = String(uploadedById || '').trim()
    const name = String(fileName || 'file').trim()
    const total = parseInt(totalSize, 10)
    const chunks = parseInt(totalChunks, 10)

    if (!type || !id) return res.status(400).json({ error: 'entityType and entityId are required' })
    if (!uid) return res.status(400).json({ error: 'uploadedById is required' })
    if (!name || !Number.isFinite(total) || total <= 0 || !Number.isInteger(chunks) || chunks <= 0) {
      return res.status(400).json({ error: 'fileName, totalSize and totalChunks (positive numbers) are required' })
    }
    if (total > MAX_FILE_SIZE) {
      return res.status(400).json({ error: `File too large. Maximum is ${MAX_FILE_SIZE / 1024 / 1024} MB.` })
    }
    if (type !== 'MAINTENANCE_ACTUAL' && type !== 'MAINTENANCE_PLAN') {
      return res.status(400).json({ error: 'Unsupported entityType' })
    }

    if (type === 'MAINTENANCE_ACTUAL') {
      await prisma.maintenanceActual.findUniqueOrThrow({ where: { id } })
    }

    if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true })

    const uploadId = randomUUID()
    const dir = path.join(TMP_DIR, uploadId)
    fs.mkdirSync(dir, { recursive: true })

    const meta = {
      entityType: type,
      entityId: id,
      uploadedById: uid,
      fileName: name,
      fileType: fileType && String(fileType).trim() ? String(fileType).trim() : null,
      totalSize: total,
      totalChunks: chunks
    }
    fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta))
    fs.writeFileSync(path.join(dir, 'data'), Buffer.alloc(0))

    return res.status(201).json({ uploadId })
  } catch (e) {
    console.error('[upload-start]', e?.message)
    if (e.code === 'P2025') {
      return res.status(400).json({ error: 'Related maintenance record was not found.' })
    }
    
return res.status(500).json({ error: 'Failed to start upload.' })
  }
}
