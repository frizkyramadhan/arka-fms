/**
 * POST /api/auth/login
 * Body: { username, password, rememberMe? }
 * Returns: { accessToken, userData: { id, username, name, email, role, projectScope, isActive } }
 */
import prisma from 'src/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getPermissionsForUser } from 'src/lib/permissions-server'
import { getRoleNameFromUser } from 'src/lib/user-role'

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'arka-mms-secret'
const JWT_EXPIRATION = process.env.NEXT_PUBLIC_JWT_EXPIRATION || '7d'

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
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    
return res.status(405).end()
  }

  try {
    const { username, password } = req.body || {}
    if (!username || !password) {
      return res.status(400).json({
        error: { username: ['Username and password are required'] }
      })
    }

    const user = await prisma.user.findUnique({
      where: { username: String(username).trim() },
      include: { userRoles: { include: { role: true } } }
    })

    if (!user) {
      return res.status(400).json({
        error: { username: ['Username or password is invalid'] }
      })
    }

    if (!user.isActive) {
      return res.status(400).json({
        error: { username: ['Account is inactive'] }
      })
    }

    const valid = await bcrypt.compare(String(password), user.passwordHash)
    if (!valid) {
      return res.status(400).json({
        error: { username: ['Username or password is invalid'] }
      })
    }

    const rememberMe = req.body.rememberMe === true
    const expiresIn = rememberMe ? JWT_EXPIRATION : process.env.NEXT_PUBLIC_JWT_EXPIRATION_SESSION || '8h'
    const roleName = getRoleNameFromUser(user)
    const permissions = await getPermissionsForUser(user.id)

    const accessToken = jwt.sign(
      { id: user.id, role: roleName, permissions },
      JWT_SECRET,
      { expiresIn }
    )

    const isProd = process.env.NODE_ENV === 'production'

    const cookieParts = [
      `accessToken=${accessToken}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Lax'
    ]
    if (rememberMe) {
      const days = process.env.JWT_COOKIE_MAX_AGE_DAYS ? parseInt(process.env.JWT_COOKIE_MAX_AGE_DAYS, 10) : 7
      const cookieMaxAge = (days > 0 ? days : 7) * 24 * 60 * 60
      cookieParts.push(`Max-Age=${cookieMaxAge}`)
    }
    if (isProd) cookieParts.push('Secure')
    res.setHeader('Set-Cookie', [cookieParts.join('; ')])

    return res.status(200).json({
      accessToken,
      userData: mapUserData(user, permissions)
    })
  } catch (e) {
    console.error('POST /api/auth/login', e)
    
return res.status(500).json({ error: { username: ['Something went wrong'] } })
  }
}
