// ** React Imports
import { useState, useEffect } from 'react'
import axios from 'axios'

// ** Config
import getProjectsUrl from 'src/configs/projectsApi'

/**
 * Fetches projects from external API for User project scope.
 * Expects response: { data: [...] } with items { project_code, bowheer?, location? }. Label shows project_code — bowheer.
 * Returns { projects: [{ value, label }], loading, error }.
 */
const useProjects = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    axios
      .get(getProjectsUrl())
      .then(res => {
        if (cancelled) return
        const raw = res.data?.data ?? res.data
        const list = Array.isArray(raw) ? raw : []

        const options = list.map(p => {
          const value = p.project_code ?? p.id ?? '-'
          const label = [value, p.bowheer].filter(Boolean).join(' - ')
          
return { value, label }
        })
        setProjects(options)
      })
      .catch(err => {
        if (!cancelled) {
          setError(err?.message || 'Failed to load projects')
          setProjects([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    
return () => {
      cancelled = true
    }
  }, [])

  return { projects, loading, error }
}

export default useProjects
