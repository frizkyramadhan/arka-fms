/**
 * Redux slice: Maintenance Actual (realisasi maintenance per unit, terhubung ke plan).
 * API: GET/POST /api/maintenance-actuals, GET/PATCH/DELETE /api/maintenance-actuals/[id]
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const fetchData = createAsyncThunk('appMaintenanceActuals/fetchData', async params => {
  const response = await axios.get('/api/maintenance-actuals', { params })
  
return response.data
})

export const addMaintenanceActual = createAsyncThunk(
  'appMaintenanceActuals/addMaintenanceActual',
  async (data, { getState, dispatch }) => {
    const response = await axios.post('/api/maintenance-actuals', data)
    dispatch(fetchData(getState().maintenanceActual.params))
    
return response.data
  }
)

export const updateMaintenanceActual = createAsyncThunk(
  'appMaintenanceActuals/updateMaintenanceActual',
  async ({ id, data }, { getState, dispatch }) => {
    const response = await axios.patch(`/api/maintenance-actuals/${id}`, data)
    dispatch(fetchData(getState().maintenanceActual.params))
    
return response.data
  }
)

export const deleteMaintenanceActual = createAsyncThunk(
  'appMaintenanceActuals/deleteMaintenanceActual',
  async (id, { getState, dispatch }) => {
    await axios.delete(`/api/maintenance-actuals/${id}`)
    dispatch(fetchData(getState().maintenanceActual.params))
    
return { id }
  }
)

export const appMaintenanceActualsSlice = createSlice({
  name: 'appMaintenanceActuals',
  initialState: {
    data: [],
    total: 0,
    params: {}
  },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(fetchData.fulfilled, (state, action) => {
      state.data = action.payload.maintenanceActuals ?? []
      state.total = action.payload.total ?? 0
      state.params = action.payload.params ?? {}
    })
    builder.addCase(updateMaintenanceActual.fulfilled, (state, action) => {
      const item = action.payload?.maintenanceActual
      if (!item) return
      const idx = state.data.findIndex(a => a.id === item.id)
      if (idx !== -1) state.data[idx] = item
    })
  }
})

export default appMaintenanceActualsSlice.reducer
