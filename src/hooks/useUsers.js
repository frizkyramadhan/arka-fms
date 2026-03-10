import { useState, useEffect } from 'react'
import axios from 'axios'

/**
 * Fetches users list for dropdowns (e.g. createdBy).
 * Returns { users: [{ id, username, name }], loading, error }.
 */
const useUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    axios
      .get('/api/users')
      .then(res => {
        if (cancelled) return
        const list = res.data?.users ?? res.data?.allData ?? []
        setUsers(Array.isArray(list) ? list : [])
      })
      .catch(err => {
        if (!cancelled) {
          setError(err?.message || 'Failed to load users')
          setUsers([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    
return () => {
      cancelled = true
    }
  }, [])

  return { users, loading, error }
}

export default useUsers
