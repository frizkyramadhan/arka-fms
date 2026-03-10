/**
 * GET /api/users/[id] — Get one user (role dari user_roles)
 * PATCH /api/users/[id] — Update (name?, email?, password?, role?, projectScope?, isActive?). Role = update user_roles.
 * DELETE /api/users/[id]
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
  const rawId = req.query.id
  const id = typeof rawId === 'string' ? rawId.trim().replace(/\/+$/, '') : String(rawId || '').trim()
  if (!id) return res.status(400).json({ error: 'id required' })

  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: userInclude
      })
      if (!user) return res.status(404).json({ error: 'User not found' })
      
return res.status(200).json(mapUser(user))
    } catch (e) {
      console.error('GET /api/users/[id]', e)
      
return res.status(500).json({ error: e.message })
    }
  }

  if (req.method === 'PATCH') {
    try {
      const user = await prisma.user.findUnique({ where: { id } })
      if (!user) return res.status(404).json({ error: 'User not found' })
      const { name, email, password, role, projectScope, isActive } = req.body || {}
      const data = {}
      if (name !== undefined) data.name = name?.trim() || null
      if (email !== undefined) data.email = email?.trim() || null
      if (projectScope !== undefined) data.projectScope = projectScope?.trim() || null
      if (isActive !== undefined) data.isActive = Boolean(isActive)
      if (password !== undefined && password !== '') {
        data.passwordHash = await bcrypt.hash(password, 10)
      }
      await prisma.user.update({ where: { id }, data })
      if (role !== undefined) {
        const roleName = String(role).trim()
        const authRole = await prisma.authRole.findUnique({ where: { name: roleName } })
        if (!authRole)
          return res.status(400).json({ error: 'role must exist in roles table. Create it in Roles List first.' })
        await prisma.userRole.deleteMany({ where: { userId: id } })
        await prisma.userRole.create({
          data: { userId: id, roleId: authRole.id }
        })
      }

      const updated = await prisma.user.findUnique({
        where: { id },
        include: userInclude
      })
      
return res.status(200).json({ user: mapUser(updated) })
    } catch (e) {
      console.error('PATCH /api/users/[id]', e)
      if (e.code === 'P2025') return res.status(404).json({ error: 'User not found' })
      if (e.code === 'P2002')
        return res
          .status(409)
          .json({ error: e.meta?.target?.[0] ? `Duplicate ${e.meta.target[0]}` : 'Duplicate value' })
      
return res.status(500).json({ error: e.message || 'Update failed' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.user.delete({ where: { id } })
      
return res.status(200).json({ success: true })
    } catch (e) {
      if (e.code === 'P2025') return res.status(404).json({ error: 'User not found' })
      console.error('DELETE /api/users/[id]', e)
      
return res.status(500).json({ error: e.message })
    }
  }

  res.setHeader('Allow', ['GET', 'PATCH', 'DELETE'])
  
return res.status(405).end()
}
