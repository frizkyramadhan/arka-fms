// ** Mock Adapter — data menu untuk API horizontal nav (server-side menu).
// Hanya menu ARKA MMS: Dashboard Maintenance, Plan, Actual, Type, Unit, User, Role, Permission.
import mock from 'src/@fake-db/mock'

const navigation = [
  {
    icon: 'tabler:smart-home',
    title: 'Dashboards',
    children: [
      {
        icon: 'tabler:clipboard-data',
        title: 'Maintenance',
        path: '/dashboards/maintenance'
      }
    ]
  },
  {
    icon: 'tabler:layout-grid-add',
    title: 'Apps',
    children: [
      {
        title: 'Maintenance Plans',
        icon: 'tabler:calendar-event',
        path: '/apps/maintenance-plan/list'
      },
      {
        title: 'Maintenance Actuals',
        icon: 'tabler:clipboard-check',
        path: '/apps/maintenance-actual/list'
      },
      {
        title: 'Maintenance Types',
        icon: 'tabler:tool',
        path: '/apps/maintenance-type/list'
      },
      {
        title: 'Units',
        icon: 'tabler:truck',
        path: '/apps/unit/list'
      },
      {
        title: 'Users',
        icon: 'tabler:user',
        path: '/apps/user/list'
      },
      {
        title: 'Roles & Permissions',
        icon: 'tabler:settings',
        children: [
          {
            title: 'Roles',
            path: '/apps/roles'
          },
          {
            title: 'Permissions',
            path: '/apps/permissions'
          }
        ]
      }
    ]
  }
]

mock.onGet('/api/horizontal-nav/data').reply(() => {
  return [200, navigation]
})
