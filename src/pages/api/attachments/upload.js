/**
 * POST /api/attachments/upload — Upload files via JSON body (base64).
 * Body: { entityType, entityId, uploadedById, files: [ { name, type?, data: base64 } ] }
 * Reads raw body with 10MB limit (avoids Next.js default 1MB that caused ERR_CONNECTION_RESET).
 * Saves files to public/uploads/attachments and creates Attachment records.
 */
import fs from 'fs'
import path from 'path'
import prisma from 'src/lib/prisma'

const BODY_LIMIT = '10mb'

// Disable built-in body parser; we read raw body with a higher limit to avoid 1MB default
export const config = {
  api: {
    bodyParser: false
  }
}

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'attachments')
const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3 MB per file (base64 ~33% larger in body)

function sanitizeFileName(name) {
  return (name || 'file')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 120)
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

const LOG_PREFIX = '[upload-api]'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    
return res.status(405).end()
  }

  let body
  try {
    const getRawBody = require('next/dist/compiled/raw-body')
    const raw = await getRawBody(req, { limit: BODY_LIMIT, encoding: 'utf-8' })
    body = JSON.parse(typeof raw === 'string' ? raw : raw.toString())
  } catch (e) {
    if (e.type === 'entity.too.large') {
      console.warn(LOG_PREFIX, 'body too large', { limit: BODY_LIMIT })
      
return res.status(413).json({ error: `Request body too large. Maximum is ${BODY_LIMIT}.` })
    }
    console.error(LOG_PREFIX, 'body read/parse error', e?.message)
    
return res.status(400).json({ error: 'Invalid request body (expected JSON)' })
  }

  const contentLength = req.headers['content-length']
  const bodyKeys = body && typeof body === 'object' ? Object.keys(body) : []
  let payloadSize = 0
  if (body?.files && Array.isArray(body.files)) {
    payloadSize = body.files.reduce((sum, f) => sum + (typeof f?.data === 'string' ? f.data.length : 0), 0)
  }
  console.log(LOG_PREFIX, 'request received', {
    contentLength: contentLength ? `${contentLength} bytes` : 'missing',
    bodyKeys,
    filesCount: body?.files ? (Array.isArray(body.files) ? body.files.length : 1) : 0,
    totalBase64Length: payloadSize ? `${payloadSize} chars (~${Math.round(payloadSize / 1024)} KB)` : 0
  })

  try {
    const { entityType, entityId, uploadedById, files: filesPayload } = body || {}

    const type = String(entityType || '').trim()
    const id = String(entityId || '').trim()
    const uid = String(uploadedById || '').trim()

    if (!type || !id) {
      return res.status(400).json({ error: 'entityType and entityId are required' })
    }
    if (!uid) {
      return res.status(400).json({ error: 'uploadedById is required' })
    }
    if (type !== 'MAINTENANCE_ACTUAL' && type !== 'MAINTENANCE_PLAN') {
      return res.status(400).json({ error: 'Unsupported entityType' })
    }

    if (type === 'MAINTENANCE_ACTUAL') {
      await prisma.maintenanceActual.findUniqueOrThrow({ where: { id } })
    }

    const items = Array.isArray(filesPayload) ? filesPayload : filesPayload ? [filesPayload] : []
    if (items.length === 0) {
      return res.status(400).json({ error: 'At least one file is required' })
    }

    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true })
    }

    const created = []

    for (const item of items) {
      const name = String(item?.name || 'file').trim()
      const base64 = item?.data
      if (!base64 || typeof base64 !== 'string') continue

      let buffer
      try {
        buffer = Buffer.from(base64, 'base64')
      } catch {
        return res.status(400).json({ error: `Invalid base64 data for file "${name}"` })
      }

      if (buffer.length > MAX_FILE_SIZE) {
        return res.status(400).json({
          error: `File "${name}" is too large. Maximum allowed is ${MAX_FILE_SIZE / 1024 / 1024} MB per file.`
        })
      }

      const fileName = uniqueFileName(name)
      const destPath = path.join(UPLOAD_DIR, fileName)
      fs.writeFileSync(destPath, buffer)
      const storagePath = `/uploads/attachments/${fileName}`
      const mime = item.type && String(item.type).trim() ? String(item.type).trim() : null

      const attachment = await prisma.attachment.create({
        data: {
          entityType: type,
          entityId: id,
          fileName: name,
          storagePath,
          fileType: mime,
          fileSize: buffer.length,
          uploadedById: uid
        },
        include: {
          uploadedBy: { select: { username: true } }
        }
      })
      created.push(mapAttachment(attachment))
    }

    if (created.length === 0) {
      return res.status(400).json({ error: 'No valid file data received' })
    }

    console.log(LOG_PREFIX, 'success', { created: created.length, fileNames: created.map(a => a.fileName) })
    
return res.status(201).json({ attachments: created })
  } catch (e) {
    console.error(LOG_PREFIX, 'handler error', {
      message: e?.message,
      code: e?.code,
      stack: e?.stack?.split?.('\n')?.slice(0, 3)
    })

    if (res.headersSent) return

    if (e.code === 'P2025') {
      return res.status(400).json({
        error: 'Related maintenance record was not found. Please refresh the page and try again.'
      })
    }

    const detail = e && (e.message || String(e))
    
return res.status(500).json({
      error:
        process.env.NODE_ENV === 'development'
          ? `Upload failed: ${detail}`
          : 'Unexpected server error while uploading file. Please try again later or contact the administrator.'
    })
  }
}
