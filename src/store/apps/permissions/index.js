/**
 * Redux store untuk Permissions (ARKA MMS).
 * Fetch dari GET /api/permissions; create/update/delete via API.
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const fetchData = createAsyncThunk('appPermissions/fetchData', async params => {
  const response = await axios.get('/api/permissions', { params })
  
return response.data
})

export const addPermission = createAsyncThunk('appPermissions/addPermission', async (data, { getState, dispatch }) => {
  const response = await axios.post('/api/permissions', data)
  dispatch(fetchData(getState().permissions?.params))
  
return response.data
})

export const updatePermission = createAsyncThunk(
  'appPermissions/updatePermission',
  async ({ id, data }, { getState, dispatch }) => {
    const response = await axios.patch(`/api/permissions/${id}`, data)
    dispatch(fetchData(getState().permissions?.params))
    
return response.data
  }
)

export const deletePermission = createAsyncThunk(
  'appPermissions/deletePermission',
  async (id, { getState, dispatch }) => {
    await axios.delete(`/api/permissions/${id}`)
    dispatch(fetchData(getState().permissions?.params))
    
return { id }
  }
)

const slice = createSlice({
  name: 'appPermissions',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: []
  },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(fetchData.fulfilled, (state, action) => {
      state.data = action.payload.permissions || []
      state.total = action.payload.total ?? state.data.length
      state.params = action.payload.params || {}
      state.allData = state.data
    })
  }
})

export default slice.reducer
