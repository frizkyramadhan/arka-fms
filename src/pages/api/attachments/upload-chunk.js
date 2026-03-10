/**
 * POST /api/attachments/upload-chunk — Append a chunk to a started upload.
 * Body: { uploadId, chunkIndex, totalChunks, data: base64 }
 * When chunkIndex === totalChunks - 1, finalizes: moves file, creates Attachment, returns { attachments }.
 * Chunk body kept small (~300KB) to avoid ERR_CONNECTION_RESET.
 */
import fs from 'fs'
import path from 'path'
import prisma from 'src/lib/prisma'

export const config = {
  api: {
    bodyParser: { sizeLimit: '512kb' }
  }
}

const TMP_DIR = path.join(process.cwd(), 'public', 'uploads', 'tmp')
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'attachments')

function sanitizeFileName(name) {
  return (name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120)
}

function uniqueFileName(originalName) {
  const ext = path.extname(originalName) || ''
  const base = sanitizeFileName(path.basename(originalName, ext))
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  
return `${unique}-${base}${ext}`.slice(0, 200)
}

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
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    
return res.status(405).end()
  }

  try {
    const { uploadId, chunkIndex, totalChunks, data: base64 } = req.body || {}

    const id = String(uploadId || '').trim()
    const index = parseInt(chunkIndex, 10)
    const total = parseInt(totalChunks, 10)

    if (!id) return res.status(400).json({ error: 'uploadId is required' })
    if (!Number.isInteger(index) || index < 0 || !Number.isInteger(total) || total <= 0 || index >= total) {
      return res.status(400).json({ error: 'Invalid chunkIndex or totalChunks' })
    }
    if (!base64 || typeof base64 !== 'string') {
      return res.status(400).json({ error: 'Chunk data (base64) is required' })
    }

    const dir = path.join(TMP_DIR, id)
    const metaPath = path.join(dir, 'meta.json')
    const dataPath = path.join(dir, 'data')

    if (!fs.existsSync(metaPath)) {
      return res.status(404).json({ error: 'Upload session not found or expired. Please start a new upload.' })
    }

    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
    let buffer
    try {
      buffer = Buffer.from(base64, 'base64')
    } catch {
      return res.status(400).json({ error: 'Invalid base64 chunk data' })
    }

    fs.appendFileSync(dataPath, buffer)
    const isLast = index === total - 1

    if (!isLast) {
      return res.status(200).json({ ok: true })
    }

    // Last chunk: finalize
    const stats = fs.statSync(dataPath)
    if (stats.size !== meta.totalSize) {
      try {
        fs.rmSync(dir, { recursive: true })
      } catch (_) {}
      
return res.status(400).json({ error: 'File size mismatch. Upload may be corrupted. Please try again.' })
    }

    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

    const fileName = uniqueFileName(meta.fileName)
    const destPath = path.join(UPLOAD_DIR, fileName)
    fs.renameSync(dataPath, destPath)
    const storagePath = `/uploads/attachments/${fileName}`

    const attachment = await prisma.attachment.create({
      data: {
        entityType: meta.entityType,
        entityId: meta.entityId,
        fileName: meta.fileName,
        storagePath,
        fileType: meta.fileType,
        fileSize: meta.totalSize,
        uploadedById: meta.uploadedById
      },
      include: {
        uploadedBy: { select: { username: true } }
      }
    })

    try {
      fs.unlinkSync(metaPath)
      fs.rmdirSync(dir)
    } catch (_) {}

    return res.status(201).json({ attachments: [mapAttachment(attachment)] })
  } catch (e) {
    console.error('[upload-chunk]', e?.message)
    
return res.status(500).json({ error: 'Failed to save chunk.' })
  }
}
