/**
 * GET /api/users/[id] — Get one user (role dari user_roles). Permission: user.read (atau all.manage).
 * PATCH /api/users/[id] — Update (name?, email?, password?, role?, projectScope?, isActive?). Permission: user.update.
 * DELETE /api/users/[id] — Permission: user.delete.
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
  const rawId = req.query.id
  const id = typeof rawId === 'string' ? rawId.trim().replace(/\/+$/, '') : String(rawId || '').trim()
  if (!id) return res.status(400).json({ error: 'id required' })

  if (req.method === 'GET') {
    if (await requirePermission(req, res, 'user.read')) return
  } else if (req.method === 'PATCH') {
    if (await requirePermission(req, res, 'user.update')) return
  } else if (req.method === 'DELETE') {
    if (await requirePermission(req, res, 'user.delete')) return
  } else {
    res.setHeader('Allow', ['GET', 'PATCH', 'DELETE'])

    return res.status(405).end()
  }

  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: userInclude
      })
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }
      const adminRoleNames = await getRoleNamesWithPermission('all.manage')

      return res.status(200).json(mapUser(user, adminRoleNames))
    } catch (e) {
      console.error('GET /api/users/[id]', e)

      return res.status(500).json({ error: e.message })
    }
  }

  if (req.method === 'PATCH') {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: userInclude
      })
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      const requesterId = await getUserIdFromRequest(req)

      const isRequesterAdmin = requesterId
        ? (await getPermissionsForUser(requesterId)).includes('all.manage')
        : false

      const adminRoleNames = await getRoleNamesWithPermission('all.manage')
      const targetUserRoleName = getRoleNameFromUser(user)
      const isTargetAdmin = adminRoleNames.includes(targetUserRoleName)

      // Non-admin tidak boleh mengedit user yang rolenya administrator
      if (!isRequesterAdmin && isTargetAdmin) {
        return res.status(403).json({ error: 'Only an administrator can edit an administrator user.' })
      }

      const { name, email, password, role, projectScope, isActive } = req.body || {}
      if (role !== undefined) {
        const roleName = String(role).trim()
        if (!isRequesterAdmin && adminRoleNames.includes(roleName)) {
          return res.status(403).json({ error: 'Only an administrator can assign the administrator role.' })
        }
      }

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

      return res.status(200).json({ user: mapUser(updated, adminRoleNames) })
    } catch (e) {
      console.error('PATCH /api/users/[id]', e)
      if (e.code === 'P2025') {
        return res.status(404).json({ error: 'User not found' })
      }
      if (e.code === 'P2002') {
        return res
          .status(409)
          .json({ error: e.meta?.target?.[0] ? `Duplicate ${e.meta.target[0]}` : 'Duplicate value' })
      }

      return res.status(500).json({ error: e.message || 'Update failed' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: userInclude
      })
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      const requesterId = await getUserIdFromRequest(req)

      const isRequesterAdmin = requesterId
        ? (await getPermissionsForUser(requesterId)).includes('all.manage')
        : false

      const adminRoleNames = await getRoleNamesWithPermission('all.manage')
      const targetRoleName = getRoleNameFromUser(user)
      if (!isRequesterAdmin && adminRoleNames.includes(targetRoleName)) {
        return res.status(403).json({ error: 'Only an administrator can delete an administrator user.' })
      }
      await prisma.user.delete({ where: { id } })

      return res.status(200).json({ success: true })
    } catch (e) {
      if (e.code === 'P2025') {
        return res.status(404).json({ error: 'User not found' })
      }
      console.error('DELETE /api/users/[id]', e)

      return res.status(500).json({ error: e.message })
    }
  }

  res.setHeader('Allow', ['GET', 'PATCH', 'DELETE'])

  return res.status(405).end()
}
