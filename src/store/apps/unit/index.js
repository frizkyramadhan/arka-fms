import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const fetchData = createAsyncThunk('appUnits/fetchData', async params => {
  const response = await axios.get('/api/units', { params })
  
return response.data
})

export const syncUnits = createAsyncThunk('appUnits/syncUnits', async (_, { dispatch }) => {
  const response = await axios.post('/api/units/sync')
  dispatch(fetchData({}))
  
return response.data
})

export const appUnitsSlice = createSlice({
  name: 'appUnits',
  initialState: {
    data: [],
    total: 0,
    params: {},
    allData: [],
    syncing: false
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchData.fulfilled, (state, action) => {
        state.data = action.payload.units ?? []
        state.total = action.payload.total ?? 0
        state.params = action.payload.params ?? {}
        state.allData = action.payload.allData ?? []
      })
      .addCase(syncUnits.pending, state => {
        state.syncing = true
      })
      .addCase(syncUnits.fulfilled, state => {
        state.syncing = false
      })
      .addCase(syncUnits.rejected, state => {
        state.syncing = false
      })
  }
})

export default appUnitsSlice.reducer
