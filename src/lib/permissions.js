/**
 * ARKA MMS - Permission helpers (client-safe)
 * Build CASL Ability dari array permission names. Tidak import Prisma/DB.
 * Permission format: "subject.action" (e.g. plan.create, all.manage).
 * Untuk load permissions dari DB (server-only), pakai src/lib/permissions-server.js
 */

import { AbilityBuilder, Ability } from '@casl/ability'

export const AppAbility = Ability

/**
 * Build CASL Ability dari array permission names.
 * - "all.manage" -> can('manage', 'all')
 * - "subject.action" -> can(action, subject)
 * @param {string[]} permissions
 * @returns {Ability}
 */
export function buildAbilityFromPermissions(permissions) {
  const { can, rules } = new AbilityBuilder(AppAbility)

  if (permissions && permissions.includes('all.manage')) {
    can('manage', 'all')
    
return new AppAbility(rules, {
      detectSubjectType: object => (object && object.type) || object
    })
  }

  if (Array.isArray(permissions)) {
    for (const name of permissions) {
      const dot = name.indexOf('.')
      if (dot === -1) continue
      const subject = name.slice(0, dot)
      const action = name.slice(dot + 1)
      if (subject && action) {
        can(action, subject)
      }
    }
  }

  return new AppAbility(rules, {
    detectSubjectType: object => (object && object.type) || object
  })
}
