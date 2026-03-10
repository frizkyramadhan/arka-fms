/**
 * GET /api/projects — proxy to external projects API (avoids CORS from browser).
 * Set NEXT_PUBLIC_PROJECTS_API_URL=/api/projects in .env to use this proxy.
 */
const EXTERNAL_PROJECTS_URL = process.env.PROJECTS_API_URL || 'http://192.168.32.15/ark-fleet/api/projects'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const response = await fetch(EXTERNAL_PROJECTS_URL)
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return res.status(response.status).json(data || { error: 'Upstream error' })
    }
    res.status(200).json(data)
  } catch (err) {
    res.status(502).json({ error: err?.message || 'Failed to fetch projects' })
  }
}
