import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// ** Axios Imports
import axios from 'axios'

// ** ARKA MMS: API base /api/users (Next.js API routes + Prisma)

export const fetchData = createAsyncThunk('appUsers/fetchData', async params => {
  const response = await axios.get('/api/users', { params })
  
return response.data
})

export const addUser = createAsyncThunk('appUsers/addUser', async (data, { getState, dispatch }) => {
  const response = await axios.post('/api/users', data)
  dispatch(fetchData(getState().user.params))
  
return response.data
})

export const updateUser = createAsyncThunk('appUsers/updateUser', async ({ id, data }, { getState, dispatch }) => {
  const response = await axios.patch(`/api/users/${id}`, data)
  dispatch(fetchData(getState().user.params))
  
return response.data
})

export const deleteUser = createAsyncThunk('appUsers/deleteUser', async (id, { getState, dispatch }) => {
  await axios.delete(`/api/users/${id}`)
  dispatch(fetchData(getState().user.params))
  
return { id }
})

export const appUsersSlice = createSlice({
  name: 'appUsers',
  initialState: {
    data: [],
    total: 1,
    params: {},
    allData: []
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchData.fulfilled, (state, action) => {
        state.data = action.payload.users
        state.total = action.payload.total
        state.params = action.payload.params
        state.allData = action.payload.allData
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const user = action.payload?.user
        if (!user) return
        const idx = state.data.findIndex(u => u.id === user.id)
        if (idx !== -1) state.data[idx] = user
        const allIdx = state.allData.findIndex(u => u.id === user.id)
        if (allIdx !== -1) state.allData[allIdx] = user
      })
  }
})

export default appUsersSlice.reducer
