import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

// ** ARKA MMS: API /api/maintenance-plans

export const fetchData = createAsyncThunk('appMaintenancePlans/fetchData', async params => {
  const response = await axios.get('/api/maintenance-plans', { params })
  
return response.data
})

export const addMaintenancePlan = createAsyncThunk(
  'appMaintenancePlans/addMaintenancePlan',
  async (data, { getState, dispatch }) => {
    const response = await axios.post('/api/maintenance-plans', data)
    dispatch(fetchData(getState().maintenancePlan.params))
    
return response.data
  }
)

export const updateMaintenancePlan = createAsyncThunk(
  'appMaintenancePlans/updateMaintenancePlan',
  async ({ id, data }, { getState, dispatch }) => {
    const response = await axios.patch(`/api/maintenance-plans/${id}`, data)
    dispatch(fetchData(getState().maintenancePlan.params))
    
return response.data
  }
)

export const deleteMaintenancePlan = createAsyncThunk(
  'appMaintenancePlans/deleteMaintenancePlan',
  async (id, { getState, dispatch }) => {
    await axios.delete(`/api/maintenance-plans/${id}`)
    dispatch(fetchData(getState().maintenancePlan.params))
    
return { id }
  }
)

export const appMaintenancePlansSlice = createSlice({
  name: 'appMaintenancePlans',
  initialState: {
    data: [],
    total: 0,
    params: {},
    allData: []
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchData.fulfilled, (state, action) => {
        state.data = action.payload.maintenancePlans
        state.total = action.payload.total
        state.params = action.payload.params
        state.allData = action.payload.allData
      })
      .addCase(updateMaintenancePlan.fulfilled, (state, action) => {
        const item = action.payload?.maintenancePlan
        if (!item) return
        const idx = state.data.findIndex(p => p.id === item.id)
        if (idx !== -1) state.data[idx] = item
        const allIdx = state.allData.findIndex(p => p.id === item.id)
        if (allIdx !== -1) state.allData[allIdx] = item
      })
  }
})

export default appMaintenancePlansSlice.reducer
