/**
 * POST /api/auth/logout
 * Menghapus cookie accessToken (untuk middleware RBAC).
 * Client tetap membersihkan localStorage/sessionStorage di AuthContext.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    
return res.status(405).end()
  }

  res.setHeader('Set-Cookie', [
    'accessToken=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
  ])
  
return res.status(200).json({ message: 'Logged out' })
}
