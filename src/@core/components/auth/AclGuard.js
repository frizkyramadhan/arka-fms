// ** React Imports
import { useEffect } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** Context Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'

// ** Config Import
import { buildAbilityFor } from 'src/configs/acl'

// ** Component Import
import NotAuthorized from 'src/pages/401'
import Spinner from 'src/@core/components/spinner'
import BlankLayout from 'src/@core/layouts/BlankLayout'

// ** Hooks
import { useAuth } from 'src/hooks/useAuth'

// ** Util Import
import getHomeRoute from 'src/layouts/components/acl/getHomeRoute'

const AclGuard = props => {
  // ** Props
  const { aclAbilities, children, guestGuard = false, authGuard = true } = props

  // ** Hooks
  const auth = useAuth()
  const router = useRouter()

  // ** Vars
  let ability
  useEffect(() => {
    if (auth.user && auth.user.role && !guestGuard && router.route === '/') {
      const homeRoute = getHomeRoute(auth.user.role)
      router.replace(homeRoute)
    }
  }, [auth.user, guestGuard, router])

  // User is logged in: build ability (untuk nav/Can) dari permissions atau role
  if (auth.user && !ability) {
    ability = buildAbilityFor(auth.user, aclAbilities?.subject ?? 'all')
    if (router.route === '/') {
      return <Spinner />
    }
  }

  // Guest guard / no auth guard / error pages: tidak cek ACL
  if (guestGuard || router.route === '/404' || router.route === '/500' || !authGuard) {
    if (auth.user && ability) {
      return <AbilityContext.Provider value={ability}>{children}</AbilityContext.Provider>
    }
    
return <>{children}</>
  }

  // ACL tidak di-set di halaman ini → boleh akses
  if (!aclAbilities || aclAbilities.action == null || aclAbilities.subject == null) {
    if (router.route === '/') return <Spinner />
    
return (
      <AbilityContext.Provider value={ability || null}>
        {children}
      </AbilityContext.Provider>
    )
  }

  // ACL di-set: cek permission
  if (ability && auth.user && ability.can(aclAbilities.action, aclAbilities.subject)) {
    if (router.route === '/') return <Spinner />
    
return <AbilityContext.Provider value={ability}>{children}</AbilityContext.Provider>
  }

  return (
    <BlankLayout>
      <NotAuthorized />
    </BlankLayout>
  )
}

export default AclGuard
