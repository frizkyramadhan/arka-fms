/**
 * ARK Fleet API — external equipments/units source for sync.
 * Override with ARK_FLEET_EQUIPMENTS_URL in .env (server-side).
 */
const defaultUrl = 'http://192.168.32.15/ark-fleet/api/equipments'

const getEquipmentsUrl = () => {
  if (typeof process !== 'undefined' && process.env.ARK_FLEET_EQUIPMENTS_URL) {
    return process.env.ARK_FLEET_EQUIPMENTS_URL
  }
  
return defaultUrl
}

export default getEquipmentsUrl
