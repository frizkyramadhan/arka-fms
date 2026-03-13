/**
 * GET /api/users — List users (query: q, role, status). Role dari user_roles.
 *   Memerlukan permission: user.read (atau all.manage).
 * POST /api/users — Create user + user_roles (body: username, name, email?, password, role, projectScope?, isActive)
 *   Memerlukan permission: user.create (atau all.manage).
 */
import prisma from 'src/lib/prisma'
import bcrypt from 'bcryptjs'
import { getRoleNameFromUser } from 'src/lib/user-role'
import {
  requirePermission,
  getUserIdFromRequest,
  getPermissionsForUser,
  getRoleNamesWithPermission
} from 'src/lib/permissions-server'

function mapUser(u, adminRoleNames = []) {
  const roleName = getRoleNameFromUser(u)

  return {
    id: u.id,
    username: u.username,
    name: u.name,
    email: u.email,
    role: roleName,
    projectScope: u.projectScope,
    isActive: u.isActive,
    isAdmin: adminRoleNames.length ? adminRoleNames.includes(roleName) : false,
    createdAt: u.createdAt?.toISOString?.() ?? u.createdAt
  }
}

const userInclude = { userRoles: { include: { role: true } } }

export default async function handler(req, res) {
  if (req.method === 'GET') {
    if (await requirePermission(req, res, 'user.read')) return
  } else if (req.method === 'POST') {
    if (await requirePermission(req, res, 'user.create')) return
  } else {
    res.setHeader('Allow', ['GET', 'POST'])

    return res.status(405).end()
  }

  if (req.method === 'GET') {
    try {
      const adminRoleNames = await getRoleNamesWithPermission('all.manage')
      const { q = '', role: roleFilter = '', status = '' } = req.query
      const where = {}
      if (roleFilter && String(roleFilter).trim()) {
        where.userRoles = { some: { role: { name: String(roleFilter).trim() } } }
      }
      if (status === 'active') where.isActive = true
      if (status === 'inactive') where.isActive = false
      if (q && q.trim()) {
        const term = q.trim()
        where.OR = [{ username: { contains: term } }, { name: { contains: term } }, { email: { contains: term } }]
      }

      const users = await prisma.user.findMany({
        where,
        include: userInclude,
        orderBy: { createdAt: 'desc' }
      })

      const allData = await prisma.user.findMany({
        include: userInclude,
        orderBy: { createdAt: 'desc' }
      })

      const map = u => mapUser(u, adminRoleNames)

      return res.status(200).json({
        allData: allData.map(map),
        users: users.map(map),
        total: users.length,
        params: req.query
      })
    } catch (e) {
      console.error('GET /api/users', e)

      return res.status(500).json({ error: e.message })
    }
  }

  if (req.method === 'POST') {
    try {
      const { username, name, email, password, role, projectScope, isActive } = req.body || {}
      if (!username || !password) {
        return res.status(400).json({ error: 'username and password are required' })
      }
      const roleName = String(role).trim()
      const authRole = await prisma.authRole.findUnique({ where: { name: roleName } })
      if (!authRole) {
        return res.status(400).json({ error: 'role must exist in roles table. Create it in Roles List first.' })
      }

      // Non-admin tidak boleh assign role administrator (role yang punya all.manage)
      const requesterId = await getUserIdFromRequest(req)
      if (requesterId) {
        const requesterPerms = await getPermissionsForUser(requesterId)
        if (!requesterPerms.includes('all.manage')) {
          const adminRoleNames = await getRoleNamesWithPermission('all.manage')
          if (adminRoleNames.includes(roleName)) {
            return res.status(403).json({ error: 'Only an administrator can assign the administrator role.' })
          }
        }
      }

      const existing = await prisma.user.findUnique({ where: { username: username.trim() } })
      if (existing) {
        return res.status(409).json({ error: 'Username already exists' })
      }
      const passwordHash = await bcrypt.hash(password, 10)

      const user = await prisma.user.create({
        data: {
          username: username.trim(),
          name: name?.trim() || null,
          email: email?.trim() || null,
          passwordHash,
          projectScope: projectScope?.trim() || null,
          isActive: isActive !== false
        }
      })
      await prisma.userRole.create({
        data: { userId: user.id, roleId: authRole.id }
      })

      const adminRoleNames = await getRoleNamesWithPermission('all.manage')

      return res.status(201).json({
        user: {
          ...mapUser({ ...user, userRoles: [{ role: authRole }] }, adminRoleNames),
          createdAt: user.createdAt?.toISOString?.() ?? user.createdAt
        }
      })
    } catch (e) {
      console.error('POST /api/users', e)

      return res.status(500).json({ error: e.message })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])

  return res.status(405).end()
}
