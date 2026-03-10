/**
 * POST /api/auth/register
 * Body: { username, email, password, name? }
 * Creates user + user_roles. Default role = role yang punya permission all.manage (tidak bergantung nama).
 * Returns: { message, user: { id, username, email, role, isActive } }
 */
import prisma from 'src/lib/prisma'
import bcrypt from 'bcryptjs'
import { getDefaultRoleIdByPermission } from 'src/lib/permissions-server'

function mapUser(u, roleName = null) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    role: roleName ?? null,
    isActive: u.isActive
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    
return res.status(405).end()
  }

  try {
    const { username, email, password, name } = req.body || {}
    if (!username || !password) {
      return res.status(400).json({
        error: { username: ['Username and password are required'] }
      })
    }

    const trimmedUsername = String(username).trim()
    const trimmedEmail = email ? String(email).trim() : null

    const existing = await prisma.user.findUnique({
      where: { username: trimmedUsername }
    })
    if (existing) {
      return res.status(409).json({
        error: { username: ['Username already exists'] }
      })
    }

    if (trimmedEmail) {
      const existingEmail = await prisma.user.findFirst({
        where: { email: trimmedEmail }
      })
      if (existingEmail) {
        return res.status(409).json({
          error: { email: ['Email already registered'] }
        })
      }
    }

    const passwordHash = await bcrypt.hash(String(password), 10)
    const trimmedName = name ? String(name).trim() : null

    const user = await prisma.user.create({
      data: {
        username: trimmedUsername,
        name: trimmedName || null,
        email: trimmedEmail || null,
        passwordHash,
        projectScope: null,
        isActive: false
      }
    })
    const defaultRoleId = await getDefaultRoleIdByPermission('all.manage')
    let roleName = null
    if (defaultRoleId) {
      await prisma.userRole.create({ data: { userId: user.id, roleId: defaultRoleId } })
      const role = await prisma.authRole.findUnique({ where: { id: defaultRoleId } })
      roleName = role?.name ?? null
    }

    return res.status(201).json({
      message: 'Registration successful. Account is inactive until activated by admin.',
      user: mapUser(user, roleName)
    })
  } catch (e) {
    console.error('POST /api/auth/register', e)
    
return res.status(500).json({
      error: { username: ['Something went wrong'] }
    })
  }
}
