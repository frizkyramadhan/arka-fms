// ** React Imports
import { useContext } from 'react'

// ** Component Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'

const CanViewNavLink = props => {
  // ** Props
  const { children, navLink } = props

  // ** Hook
  const ability = useContext(AbilityContext)
  if (navLink && navLink.auth === false) return <>{children}</>

  // Tanpa subject/action = tidak diatur ACL → tampilkan
  if (navLink && navLink.action == null && navLink.subject == null) return <>{children}</>
  
return ability && ability.can(navLink?.action, navLink?.subject) ? <>{children}</> : null
}

export default CanViewNavLink
