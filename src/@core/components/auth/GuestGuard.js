/**
 * GuestGuard — halaman tamu (mis. login).
 * Hanya redirect ke home jika user sudah terverifikasi (auth.user dari me()), bukan sekadar userData di storage.
 * Mencegah redirect loop saat session habis tapi Remember Me meninggalkan userData di localStorage.
 */
import { useEffect } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** Hooks Import
import { useAuth } from 'src/hooks/useAuth'

const GuestGuard = props => {
  const { children, fallback } = props
  const auth = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady || auth.loading) return
    if (auth.user) {
      const returnUrl = router.query.returnUrl
      const path = returnUrl && returnUrl !== '/' ? returnUrl : '/'
      router.replace(path)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.route, auth.loading, auth.user])

  if (auth.loading || (!auth.loading && auth.user !== null)) {
    return fallback
  }

  return <>{children}</>
}

export default GuestGuard
