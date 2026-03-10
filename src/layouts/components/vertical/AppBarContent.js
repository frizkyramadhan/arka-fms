// ** MUI Imports
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Components
import Autocomplete from 'src/layouts/components/Autocomplete'
import ModeToggler from 'src/@core/layouts/components/shared-components/ModeToggler'
import UserDropdown from 'src/@core/layouts/components/shared-components/UserDropdown'
import ShortcutsDropdown from 'src/@core/layouts/components/shared-components/ShortcutsDropdown'

// ** Hook Import
import { useAuth } from 'src/hooks/useAuth'

// Shortcuts hanya halaman ARKA MMS
const shortcuts = [
  {
    title: 'Dashboard Maintenance',
    url: '/dashboards/maintenance',
    icon: 'tabler:clipboard-data',
    subtitle: 'Dashboard'
  },
  {
    title: 'Maintenance Plans',
    url: '/apps/maintenance-plan/list',
    icon: 'tabler:calendar-event',
    subtitle: 'Plan'
  },
  {
    title: 'Maintenance Actuals',
    url: '/apps/maintenance-actual/list',
    icon: 'tabler:clipboard-check',
    subtitle: 'Actual'
  },
  {
    title: 'Maintenance Types',
    url: '/apps/maintenance-type/list',
    icon: 'tabler:tool',
    subtitle: 'Tipe'
  },
  {
    title: 'Units',
    url: '/apps/unit/list',
    icon: 'tabler:truck',
    subtitle: 'Unit'
  },
  {
    title: 'Users',
    icon: 'tabler:users',
    url: '/apps/user/list',
    subtitle: 'User'
  },
  {
    url: '/apps/roles',
    icon: 'tabler:shield',
    subtitle: 'Role',
    title: 'Roles'
  },
  {
    url: '/apps/permissions',
    icon: 'tabler:lock',
    subtitle: 'Permission',
    title: 'Permissions'
  }
]

const AppBarContent = props => {
  // ** Props
  const { hidden, settings, saveSettings, toggleNavVisibility } = props

  // ** Hook
  const auth = useAuth()

  return (
    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box className='actions-left' sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
        {hidden && !settings.navHidden ? (
          <IconButton color='inherit' sx={{ ml: -2.75 }} onClick={toggleNavVisibility}>
            <Icon fontSize='1.5rem' icon='tabler:menu-2' />
          </IconButton>
        ) : null}
        {auth.user && <Autocomplete hidden={hidden} settings={settings} />}
      </Box>
      <Box className='actions-right' sx={{ display: 'flex', alignItems: 'center' }}>
        <ModeToggler settings={settings} saveSettings={saveSettings} />
        {auth.user && (
          <>
            <ShortcutsDropdown settings={settings} shortcuts={shortcuts} />
            <UserDropdown settings={settings} />
          </>
        )}
      </Box>
    </Box>
  )
}

export default AppBarContent
