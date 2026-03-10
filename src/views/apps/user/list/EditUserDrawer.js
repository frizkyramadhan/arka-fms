// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Imports
import Drawer from '@mui/material/Drawer'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import { styled } from '@mui/material/styles'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

// ** Custom Component Import
import CustomTextField from 'src/@core/components/mui/text-field'

// ** Third Party Imports
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, Controller } from 'react-hook-form'
import axios from 'axios'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Store Imports
import { useDispatch } from 'react-redux'
import { updateUser } from 'src/store/apps/user'

// ** Hooks
import useProjects from 'src/hooks/useProjects'

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(6),
  justifyContent: 'space-between'
}))

const schema = yup.object().shape({
  username: yup.string().min(2).required(),
  name: yup.string().nullable(),
  email: yup.string().email().nullable(),
  password: yup
    .string()
    .nullable()
    .test('password-change', 'Password must be at least 6 characters', val => {
      if (!val || String(val).trim() === '') return true
      
return val.length >= 6
    })
})

const EditUserDrawer = props => {
  const { open, toggle, userId } = props
  const [role, setRole] = useState('')
  const [projectScope, setProjectScope] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [roleOptions, setRoleOptions] = useState([])

  const dispatch = useDispatch()
  const { projects, loading: projectsLoading, error: projectsError } = useProjects()

  const {
    reset,
    control,
    setValue,
    setError,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: { username: '', name: '', email: '', password: '' },
    mode: 'onChange',
    resolver: yupResolver(schema)
  })

  useEffect(() => {
    if (!open) return
    axios.get('/api/roles').then(res => {
      const list = res.data?.roles || []
      setRoleOptions(list.map(r => ({ value: r.name, label: r.name.replace(/_/g, ' ') })))
    }).catch(() => {})
  }, [open])

  useEffect(() => {
    if (!open || !userId) return
    setFetchError(null)
    setLoading(true)
    axios
      .get(`/api/users/${userId}`)
      .then(res => {
        const u = res.data
        setValue('username', u.username)
        setValue('name', u.name || '')
        setValue('email', u.email || '')
        setValue('password', '')
        setRole(u.role)
        setProjectScope(u.projectScope || '')
        setIsActive(u.isActive)
        setLoading(false)
      })
      .catch(err => {
        setFetchError(err?.response?.data?.error || 'Failed to load data')
        setLoading(false)
      })
  }, [open, userId, setValue])

  const onSubmit = async data => {
    try {
      const payload = {
        name: data.name || null,
        email: data.email || null,
        role,
        projectScope: projectScope || null,
        isActive
      }
      if (data.password && data.password.trim()) payload.password = data.password
      await dispatch(updateUser({ id: userId, data: payload })).unwrap()
      toggle()
      reset()
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to save'
      setError('username', { message: msg })
    }
  }

  const handleClose = () => {
    reset()
    setFetchError(null)
    toggle()
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
    >
      <Header>
        <Typography variant='h5'>Edit User</Typography>
        <IconButton
          size='small'
          onClick={handleClose}
          sx={{
            p: '0.438rem',
            borderRadius: 1,
            color: 'text.primary',
            backgroundColor: 'action.selected',
            '&:hover': {
              backgroundColor: theme => `rgba(${theme.palette.customColors.main}, 0.16)`
            }
          }}
        >
          <Icon icon='tabler:x' fontSize='1.125rem' />
        </IconButton>
      </Header>
      <Box sx={{ p: theme => theme.spacing(0, 6, 6) }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : fetchError ? (
          <Typography color='error' sx={{ py: 2 }}>
            {fetchError}
          </Typography>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <Controller
              name='username'
              control={control}
              render={({ field: { value } }) => (
                <CustomTextField fullWidth sx={{ mb: 4 }} label='Username' value={value} disabled />
              )}
            />
            <Controller
              name='name'
              control={control}
              render={({ field: { value, onChange } }) => (
                <CustomTextField
                  fullWidth
                  value={value}
                  sx={{ mb: 4 }}
                  label='Name'
                  onChange={onChange}
                  placeholder='John Doe'
                />
              )}
            />
            <Controller
              name='email'
              control={control}
              render={({ field: { value, onChange } }) => (
                <CustomTextField
                  fullWidth
                  type='email'
                  label='Email (optional)'
                  value={value}
                  sx={{ mb: 4 }}
                  onChange={onChange}
                  error={Boolean(errors.email)}
                  {...(errors.email && { helperText: errors.email.message })}
                />
              )}
            />
            <Controller
              name='password'
              control={control}
              render={({ field: { value, onChange } }) => (
                <CustomTextField
                  fullWidth
                  type='password'
                  label='Password (leave blank to keep unchanged)'
                  value={value}
                  sx={{ mb: 4 }}
                  onChange={onChange}
                  error={Boolean(errors.password)}
                  placeholder='••••••••'
                  {...(errors.password && { helperText: errors.password.message })}
                />
              )}
            />
            <CustomTextField
              select
              fullWidth
              value={role}
              sx={{ mb: 4 }}
              label='Role'
              onChange={e => setRole(e.target.value)}
              disabled={roleOptions.length === 0}
              helperText={roleOptions.length === 0 ? 'Buat role di Roles List dulu' : null}
            >
              {roleOptions.map(r => (
                <MenuItem key={r.value} value={r.value}>
                  {r.label}
                </MenuItem>
              ))}
            </CustomTextField>
            <CustomTextField
              select
              fullWidth
              value={projectScope}
              sx={{ mb: 4 }}
              label='Project'
              onChange={e => setProjectScope(e.target.value)}
              disabled={projectsLoading}
              error={Boolean(projectsError)}
              {...(projectsError && { helperText: projectsError })}
            >
              <MenuItem value=''>
                <em>None</em>
              </MenuItem>
              {projects.map(p => (
                <MenuItem key={p.value} value={p.value}>
                  {p.label}
                </MenuItem>
              ))}
            </CustomTextField>
            <CustomTextField
              select
              fullWidth
              value={isActive ? 'active' : 'inactive'}
              sx={{ mb: 6 }}
              label='Status'
              onChange={e => setIsActive(e.target.value === 'active')}
            >
              <MenuItem value='active'>Active</MenuItem>
              <MenuItem value='inactive'>Inactive</MenuItem>
            </CustomTextField>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button type='submit' variant='contained' sx={{ mr: 3 }}>
                Save
              </Button>
              <Button variant='tonal' color='secondary' onClick={handleClose}>
                Cancel
              </Button>
            </Box>
          </form>
        )}
      </Box>
    </Drawer>
  )
}

export default EditUserDrawer
