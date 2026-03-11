/**
 * POST /api/auth/login
 * Body: { username, password, rememberMe? }
 * Response 200: { accessToken, userData } — userData sama bentuknya dengan GET /api/auth/me.
 * Error 400: { error: { username: string[] } } — konsumsi di src/pages/login/index.js
 */
import prisma from 'src/lib/prisma'
import bcrypt from 'bcryptjs'
import { getPermissionsForUser } from 'src/lib/permissions-server'
import {
  mapUserData,
  setAccessTokenCookie,
  signAccessToken
} from 'src/lib/auth-api'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])

    return res.status(405).end()
  }

  try {
    const { username, password, rememberMe: rememberMeRaw } = req.body || {}
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

    const rememberMe = rememberMeRaw === true
    const permissions = await getPermissionsForUser(user.id)
    const accessToken = signAccessToken(user, permissions, rememberMe)

    setAccessTokenCookie(res, accessToken, rememberMe)

    return res.status(200).json({
      accessToken,
      userData: mapUserData(user, permissions)
    })
  } catch (e) {
    console.error('POST /api/auth/login', e)

    return res.status(500).json({
      error: { username: ['Something went wrong'] }
    })
  }
}
