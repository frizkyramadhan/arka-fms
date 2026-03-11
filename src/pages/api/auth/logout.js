/**
 * POST /api/auth/logout
 * Menghapus cookie HttpOnly accessToken (middleware RBAC membaca cookie ini).
 * Client tetap membersihkan localStorage/sessionStorage di AuthContext.handleLogout.
 */
import { clearAccessTokenCookie } from 'src/lib/auth-api'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])

    return res.status(405).end()
  }

  clearAccessTokenCookie(res)

  return res.status(200).json({ message: 'Logged out' })
}
