/**
 * Navigasi vertikal sidebar — hanya menu ARKA MMS:
 * Dashboard Maintenance, Maintenance Plan, Actual, Type, Unit, User, Role, Permission.
 */

const navigation = () => {
  return [
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
          path: '/apps/maintenance-plan/list',
          subject: 'maintenance-plan',
          action: 'read'
        },
        {
          title: 'Maintenance Actuals',
          icon: 'tabler:clipboard-check',
          path: '/apps/maintenance-actual/list',
          activePathPrefix: '/apps/maintenance-actual',
          subject: 'maintenance-actual',
          action: 'read'
        },
        {
          title: 'Maintenance Types',
          icon: 'tabler:tool',
          path: '/apps/maintenance-type/list',
          subject: 'maintenance-type',
          action: 'read'
        },
        {
          title: 'Units',
          icon: 'tabler:truck',
          path: '/apps/unit/list',
          activePathPrefix: '/apps/unit',
          subject: 'unit',
          action: 'read'
        },
        {
          title: 'Users',
          icon: 'tabler:user',
          path: '/apps/user/list',
          subject: 'user',
          action: 'read'
        },
        {
          title: 'Roles & Permissions',
          icon: 'tabler:settings',
          children: [
            {
              title: 'Roles',
              path: '/apps/roles',
              subject: 'role',
              action: 'read'
            },
            {
              title: 'Permissions',
              path: '/apps/permissions',
              subject: 'permission',
              action: 'read'
            }
          ]
        }
      ]
    }
  ]
}

export default navigation
