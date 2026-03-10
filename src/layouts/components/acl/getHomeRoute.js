/**
 * Set Home URL based on role. Nama role bebas (ID-based); role tidak dikenal dapat dashboard.
 */
const getHomeRoute = role => {
  const r = role ? String(role) : ''

  // Semua role mengarah ke dashboard maintenance (halaman ACL dihapus)
  return '/dashboards/maintenance'
}

export default getHomeRoute
