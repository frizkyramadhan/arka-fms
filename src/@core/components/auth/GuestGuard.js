/**
 * GuestGuard — halaman tamu (mis. login).
 * Redirect ke dashboard maintenance jika user sudah terverifikasi (auth.user dari me()).
 * Pakai window.location agar full page load dan tidak trigger "Abort fetching component for route: '/'" dari Next router.
 */
import { useEffect, useRef } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** Hooks Import
import { useAuth } from 'src/hooks/useAuth'

const AFTER_LOGIN_REDIRECT = '/dashboards/maintenance'

const GuestGuard = props => {
  const { children, fallback } = props
  const auth = useAuth()
  const router = useRouter()
  const hasRedirected = useRef(false)

  useEffect(() => {
    if (!router.isReady || auth.loading) return
    if (auth.user && !hasRedirected.current) {
      hasRedirected.current = true
      window.location.replace(AFTER_LOGIN_REDIRECT)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.route, auth.loading, auth.user])

  if (auth.loading || (!auth.loading && auth.user !== null)) {
    return fallback
  }

  return <>{children}</>
}

export default GuestGuard
