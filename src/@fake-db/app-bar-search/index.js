// ** Mock Adapter — data pencarian AppBar. Hanya halaman ARKA MMS yang masih ada.
import mock from 'src/@fake-db/mock'

const searchData = [
  {
    id: 1,
    url: '/dashboards/maintenance',
    icon: 'tabler:clipboard-data',
    title: 'Maintenance Dashboard',
    category: 'dashboards'
  },
  {
    id: 2,
    url: '/apps/maintenance-plan/list',
    icon: 'tabler:calendar-event',
    title: 'Maintenance Plans',
    category: 'appsPages'
  },
  {
    id: 3,
    url: '/apps/maintenance-actual/list',
    icon: 'tabler:clipboard-check',
    title: 'Maintenance Actuals',
    category: 'appsPages'
  },
  {
    id: 4,
    url: '/apps/maintenance-type/list',
    icon: 'tabler:tool',
    title: 'Maintenance Types',
    category: 'appsPages'
  },
  {
    id: 5,
    url: '/apps/unit/list',
    icon: 'tabler:truck',
    title: 'Units',
    category: 'appsPages'
  },
  {
    id: 6,
    url: '/apps/user/list',
    icon: 'tabler:users',
    title: 'User List',
    category: 'appsPages'
  },
  {
    id: 7,
    url: '/apps/user/view/account',
    icon: 'tabler:user',
    title: 'User View - Account',
    category: 'appsPages'
  },
  {
    id: 8,
    url: '/apps/user/view/security',
    icon: 'tabler:lock',
    title: 'User View - Security',
    category: 'appsPages'
  },
  {
    id: 9,
    url: '/apps/user/view/billing-plan',
    icon: 'tabler:currency-dollar',
    title: 'User View - Billing & Plans',
    category: 'appsPages'
  },
  {
    id: 10,
    url: '/apps/user/view/notification',
    icon: 'tabler:bell',
    title: 'User View - Notification',
    category: 'appsPages'
  },
  {
    id: 11,
    url: '/apps/user/view/connection',
    icon: 'tabler:link',
    title: 'User View - Connection',
    category: 'appsPages'
  },
  {
    id: 12,
    url: '/apps/roles',
    icon: 'tabler:shield',
    title: 'Roles',
    category: 'appsPages'
  },
  {
    id: 13,
    url: '/apps/permissions',
    icon: 'tabler:lock',
    title: 'Permissions',
    category: 'appsPages'
  }
]

// ** GET Search Data
mock.onGet('/app-bar/search').reply(config => {
  const { q = '' } = config.params
  const queryLowered = q.toLowerCase()

  const exactData = {
    dashboards: [],
    appsPages: [],
    userInterface: [],
    formsTables: [],
    chartsMisc: []
  }

  const includeData = {
    dashboards: [],
    appsPages: [],
    userInterface: [],
    formsTables: [],
    chartsMisc: []
  }
  searchData.forEach(obj => {
    const isMatched = obj.title.toLowerCase().startsWith(queryLowered)
    if (isMatched && exactData[obj.category].length < 5) {
      exactData[obj.category].push(obj)
    }
  })
  searchData.forEach(obj => {
    const isMatched =
      !obj.title.toLowerCase().startsWith(queryLowered) && obj.title.toLowerCase().includes(queryLowered)
    if (isMatched && includeData[obj.category].length < 5) {
      includeData[obj.category].push(obj)
    }
  })
  const categoriesCheck = []
  Object.keys(exactData).forEach(category => {
    if (exactData[category].length > 0) {
      categoriesCheck.push(category)
    }
  })
  if (categoriesCheck.length === 0) {
    Object.keys(includeData).forEach(category => {
      if (includeData[category].length > 0) {
        categoriesCheck.push(category)
      }
    })
  }
  const resultsLength = categoriesCheck.length === 1 ? 5 : 3

  return [
    200,
    [
      ...exactData.dashboards.concat(includeData.dashboards).slice(0, resultsLength),
      ...exactData.appsPages.concat(includeData.appsPages).slice(0, resultsLength),
      ...exactData.userInterface.concat(includeData.userInterface).slice(0, resultsLength),
      ...exactData.formsTables.concat(includeData.formsTables).slice(0, resultsLength),
      ...exactData.chartsMisc.concat(includeData.chartsMisc).slice(0, resultsLength)
    ]
  ]
})
