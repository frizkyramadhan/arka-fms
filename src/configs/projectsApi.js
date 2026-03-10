/**
 * Projects API — used for User project scope dropdown.
 * Default: /api/projects (Next.js proxy to avoid CORS). Server-side proxy uses PROJECTS_API_URL.
 * To call external URL directly from browser, set NEXT_PUBLIC_PROJECTS_API_URL=http://192.168.32.15/ark-fleet/api/projects
 */
const getProjectsUrl = () => {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_PROJECTS_API_URL) {
    return process.env.NEXT_PUBLIC_PROJECTS_API_URL
  }
  
return '/api/projects'
}

export default getProjectsUrl
