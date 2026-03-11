/**
 * ARKA MMS — helper API auth (server-only).
 * Dipakai di pages/api/auth/* agar JWT, cookie HttpOnly, dan bentuk userData
 * tidak drift antara login / me / logout.
 */

import jwt from 'jsonwebtoken'
import { getRoleNameFromUser } from 'src/lib/user-role'

/** Samakan dengan middleware + permissions-server (jose/jsonwebtoken pakai string yang sama). */
export const JWT_SECRET =
  process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'arka-mms-secret'

const JWT_EXPIRATION = process.env.NEXT_PUBLIC_JWT_EXPIRATION || '7d'
const JWT_EXPIRATION_SESSION = process.env.NEXT_PUBLIC_JWT_EXPIRATION_SESSION || '8h'

/**
 * ExpiresIn untuk jwt.sign — rememberMe lebih lama, session lebih pendek.
 * @param {boolean} rememberMe
 * @returns {string}
 */
export function getJwtExpiresIn(rememberMe) {
  return rememberMe ? JWT_EXPIRATION : JWT_EXPIRATION_SESSION
}

/**
 * Parse Authorization header → token (tanpa "Bearer ").
 * @param {string|undefined} authHeader
 * @returns {string|null}
 */
export function parseBearerToken(authHeader) {
  if (!authHeader || typeof authHeader !== 'string') return null
  const trimmed = authHeader.trim()
  if (trimmed.startsWith('Bearer ')) return trimmed.slice(7).trim() || null

  return trimmed || null
}

/**
 * Bentuk userData yang dikonsumsi AuthContext (login + me).
 * @param {object} user - prisma user dengan userRoles include role
 * @param {string[]} [permissions=[]]
 */
export function mapUserData(user, permissions = []) {
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

/**
 * Set cookie HttpOnly accessToken — middleware membaca cookie ini untuk /apps dan /dashboards.
 * @param {import('next').NextApiResponse} res
 * @param {string} accessToken
 * @param {boolean} rememberMe
 */
export function setAccessTokenCookie(res, accessToken, rememberMe) {
  const isProd = process.env.NODE_ENV === 'production'
  const parts = [`accessToken=${accessToken}`, 'Path=/', 'HttpOnly', 'SameSite=Lax']
  if (rememberMe) {
    const days = process.env.JWT_COOKIE_MAX_AGE_DAYS
      ? parseInt(process.env.JWT_COOKIE_MAX_AGE_DAYS, 10)
      : 7
    const cookieMaxAge = (days > 0 ? days : 7) * 24 * 60 * 60
    parts.push(`Max-Age=${cookieMaxAge}`)
  }
  if (isProd) parts.push('Secure')
  res.setHeader('Set-Cookie', [parts.join('; ')])
}

/**
 * Hapus cookie accessToken (harus sama Path/Secure dengan saat set agar browser menghapus).
 * @param {import('next').NextApiResponse} res
 */
export function clearAccessTokenCookie(res) {
  const isProd = process.env.NODE_ENV === 'production'
  const parts = ['accessToken=', 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0']
  if (isProd) parts.push('Secure')
  res.setHeader('Set-Cookie', [parts.join('; ')])
}

/**
 * Sign accessToken — payload minimal di me hanya butuh id; role/permissions di payload untuk API yang baca tanpa DB.
 * @param {object} user - prisma user dengan userRoles
 * @param {string[]} permissions
 * @param {boolean} rememberMe
 * @returns {string}
 */
export function signAccessToken(user, permissions, rememberMe) {
  const roleName = getRoleNameFromUser(user)
  const expiresIn = getJwtExpiresIn(rememberMe)

  return jwt.sign({ id: user.id, role: roleName, permissions }, JWT_SECRET, { expiresIn })
}
