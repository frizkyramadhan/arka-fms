/**
 * GET /api/users — List users (query: q, role, status). Role dari user_roles.
 * POST /api/users — Create user + user_roles (body: username, name, email?, password, role, projectScope?, isActive)
 * Hanya cek auth (login), tanpa cek permission — user list tanpa ACL.
 */
import prisma from 'src/lib/prisma'
import bcrypt from 'bcryptjs'
import { getRoleNameFromUser } from 'src/lib/user-role'
import { requireAuth } from 'src/lib/permissions-server'

function mapUser(u) {
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    email: u.email,
    role: getRoleNameFromUser(u),
    projectScope: u.projectScope,
    isActive: u.isActive,
    createdAt: u.createdAt?.toISOString?.() ?? u.createdAt
  }
}

const userInclude = { userRoles: { include: { role: true } } }

export default async function handler(req, res) {
  if (await requireAuth(req, res)) return
  if (req.method === 'GET') {
    try {
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
      
return res.status(200).json({
        allData: allData.map(mapUser),
        users: users.map(mapUser),
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
      
return res.status(201).json({
        user: {
          ...mapUser({ ...user, userRoles: [{ role: authRole }] }),
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
