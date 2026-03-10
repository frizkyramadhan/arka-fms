// ** Toolkit imports
import { configureStore } from '@reduxjs/toolkit'

// ** Reducers
import chat from 'src/store/apps/chat'
import user from 'src/store/apps/user'
import unit from 'src/store/apps/unit'
import maintenanceType from 'src/store/apps/maintenanceType'
import maintenancePlan from 'src/store/apps/maintenancePlan'
import maintenanceActual from 'src/store/apps/maintenanceActual'
import email from 'src/store/apps/email'
import invoice from 'src/store/apps/invoice'
import calendar from 'src/store/apps/calendar'
import permissions from 'src/store/apps/permissions'
import roles from 'src/store/apps/roles'

export const store = configureStore({
  reducer: {
    user,
    unit,
    maintenanceType,
    maintenancePlan,
    maintenanceActual,
    chat,
    email,
    invoice,
    calendar,
    permissions,
    roles
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false
    })
})
