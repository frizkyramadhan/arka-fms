import { AbilityBuilder, Ability } from '@casl/ability'
import { buildAbilityFromPermissions } from 'src/lib/permissions'

export const AppAbility = Ability

/**
 * ARKA MMS: ability dari permissions (DB) atau fallback dari role (legacy).
 * Jika user.permissions ada, build dari permissions; else dari user.role.
 */
export function buildAbilityFor(userOrRole, subject) {
  const user = typeof userOrRole === 'object' && userOrRole !== null ? userOrRole : null
  const role = user ? user.role : userOrRole
  const permissions = user && Array.isArray(user.permissions) ? user.permissions : null

  if (permissions && permissions.length > 0) {
    return buildAbilityFromPermissions(permissions)
  }
  
return new AppAbility(defineRulesFor(role, subject), {
    detectSubjectType: object => (object && object.type) || object
  })
}

/**
 * Fallback rules bila user.permissions kosong (mis. offline / API belum return).
 * Hanya role Administrator (atau legacy admin/ADMIN_HO) dapat manage all; lainnya default permissive.
 */
const defineRulesFor = (role, subject) => {
  const { can, rules } = new AbilityBuilder(AppAbility)
  const roleStr = role ? String(role) : ''

  const fullAdminRoles = ['admin', 'Administrator', 'ADMIN_HO']
  if (fullAdminRoles.includes(roleStr)) {
    can('manage', 'all')
  } else if (roleStr === 'client') {
    can('read', 'acl-page')
  } else {
    can(['read', 'create', 'update', 'delete'], subject || 'all')
  }

  return rules
}

export const defaultACLObj = {
  action: 'manage',
  subject: 'all'
}

export { defineRulesFor }

export default defineRulesFor
