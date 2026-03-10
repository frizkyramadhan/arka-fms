/**
 * Helper: ambil nama role user dari relasi user_roles (role_id -> roles.name).
 * User harus sudah di-include: userRoles: { include: { role: true } } atau userRoles: { take: 1, include: { role: true } }.
 * @param {{ userRoles?: Array<{ role?: { name: string } }> }} user
 * @returns {string | null}
 */
export function getRoleNameFromUser(user) {
  const first = user?.userRoles?.[0]
  
return first?.role?.name ?? null
}
