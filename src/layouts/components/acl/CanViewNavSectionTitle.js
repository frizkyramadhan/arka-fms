// ** React Imports
import { useContext } from 'react'

// ** Component Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'

const CanViewNavSectionTitle = props => {
  // ** Props
  const { children, navTitle } = props

  // ** Hook
  const ability = useContext(AbilityContext)
  if (navTitle && navTitle.auth === false) return <>{children}</>
  if (navTitle && navTitle.action == null && navTitle.subject == null) return <>{children}</>
  
return ability && ability.can(navTitle?.action, navTitle?.subject) ? <>{children}</> : null
}

export default CanViewNavSectionTitle
