// ** React Imports
import { useContext } from 'react'

// ** Component Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'

const CanViewNavGroup = props => {
  // ** Props
  const { children, navGroup } = props

  // ** Hook
  const ability = useContext(AbilityContext)

  const checkForVisibleChild = arr => {
    if (!arr || !Array.isArray(arr)) return false
    
return arr.some(i => {
      if (i.children) {
        return checkForVisibleChild(i.children)
      }

      // Tanpa subject/action = tidak diatur ACL → tampilkan
      if (i.action == null && i.subject == null) return true
      
return ability?.can(i.action, i.subject)
    })
  }

  const canViewMenuGroup = item => {
    if (!item) return false
    const hasAnyVisibleChild = item.children ? checkForVisibleChild(item.children) : true
    if (!(item.action && item.subject)) {
      return hasAnyVisibleChild
    }
    
return ability && ability.can(item.action, item.subject) && hasAnyVisibleChild
  }

  if (navGroup && navGroup.auth === false) return <>{children}</>
  if (!navGroup) return null
  
return canViewMenuGroup(navGroup) ? <>{children}</> : null
}

export default CanViewNavGroup
