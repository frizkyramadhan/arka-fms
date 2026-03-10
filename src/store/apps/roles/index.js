/**
 * Redux store untuk Roles (ARKA MMS).
 * Fetch dari GET /api/roles; update/delete via PATCH/DELETE /api/roles/[id].
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const fetchRoles = createAsyncThunk('appRoles/fetchRoles', async params => {
  const response = await axios.get('/api/roles', { params })
  
return response.data
})

export const addRole = createAsyncThunk('appRoles/addRole', async (data, { getState, dispatch }) => {
  const response = await axios.post('/api/roles', data)
  dispatch(fetchRoles(getState().roles?.params))
  
return response.data
})

export const updateRole = createAsyncThunk('appRoles/updateRole', async ({ id, data }, { getState, dispatch }) => {
  const response = await axios.patch(`/api/roles/${id}`, data)
  dispatch(fetchRoles(getState().roles?.params))
  
return response.data
})

export const deleteRole = createAsyncThunk('appRoles/deleteRole', async (id, { getState, dispatch }) => {
  await axios.delete(`/api/roles/${id}`)
  dispatch(fetchRoles(getState().roles?.params))
  
return { id }
})

const slice = createSlice({
  name: 'appRoles',
  initialState: {
    data: [],
    total: 0,
    params: {}
  },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(fetchRoles.fulfilled, (state, action) => {
      state.data = action.payload.roles || []
      state.total = action.payload.total ?? state.data.length
      state.params = action.payload.params || {}
    })
  }
})

export default slice.reducer
