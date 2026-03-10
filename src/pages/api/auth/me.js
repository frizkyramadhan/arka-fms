/**
 * GET /api/auth/me
 * Headers: Authorization: <token> (or Bearer <token>)
 * Returns: { userData: { id, username, name, email, role, projectScope, isActive, fullName, permissions } }
 */
import prisma from 'src/lib/prisma'
import jwt from 'jsonwebtoken'
import { getPermissionsForUser } from 'src/lib/permissions-server'
import { getRoleNameFromUser } from 'src/lib/user-role'

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'arka-mms-secret'

function mapUserData(user, permissions = []) {
  const role = getRoleNameFromUser(user)
  
return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: role ?? null,
    projectScope: user.projectScope ?? null,
    isActive: user.isActive,
    fullName: user.name || user.username,
    permissions: Array.isArray(permissions) ? permissions : []
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    
return res.status(405).end()
  }

  try {
    const authHeader = req.headers.authorization
    const token = authHeader && (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader)

    if (!token) {
      return res.status(401).json({ error: { error: 'Invalid User' } })
    }

    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (err) {
      return res.status(401).json({ error: { error: 'Invalid User' } })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { userRoles: { include: { role: true } } }
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: { error: 'Invalid User' } })
    }

    const permissions = await getPermissionsForUser(user.id)
    
return res.status(200).json({
      userData: mapUserData(user, permissions)
    })
  } catch (e) {
    console.error('GET /api/auth/me', e)
    
return res.status(500).json({ error: { error: 'Invalid User' } })
  }
}
