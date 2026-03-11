/**
 * GET /api/auth/me
 * Headers: Authorization: Bearer <accessToken> (atau tanpa Bearer — parseBearerToken)
 * Response 200: { userData } — sama dengan userData dari login; dipakai AuthContext initAuth.
 * Response 401: { error: { error: 'Invalid User' } } — client menghapus storage dan redirect login.
 */
import prisma from 'src/lib/prisma'
import jwt from 'jsonwebtoken'
import { getPermissionsForUser } from 'src/lib/permissions-server'
import { JWT_SECRET, mapUserData, parseBearerToken } from 'src/lib/auth-api'

const UNAUTHORIZED = { error: { error: 'Invalid User' } }

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])

    return res.status(405).end()
  }

  try {
    const token = parseBearerToken(req.headers.authorization)
    if (!token) {
      return res.status(401).json(UNAUTHORIZED)
    }

    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch {
      return res.status(401).json(UNAUTHORIZED)
    }

    if (!decoded?.id) {
      return res.status(401).json(UNAUTHORIZED)
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { userRoles: { include: { role: true } } }
    })

    if (!user || !user.isActive) {
      return res.status(401).json(UNAUTHORIZED)
    }

    const permissions = await getPermissionsForUser(user.id)

    return res.status(200).json({
      userData: mapUserData(user, permissions)
    })
  } catch (e) {
    console.error('GET /api/auth/me', e)

    return res.status(500).json(UNAUTHORIZED)
  }
}
