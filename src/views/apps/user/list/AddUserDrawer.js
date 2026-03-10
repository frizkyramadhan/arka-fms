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

// ** Custom Component Import
import CustomTextField from 'src/@core/components/mui/text-field'

// ** Third Party Imports
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, Controller } from 'react-hook-form'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Store Imports
import { useDispatch } from 'react-redux'
import axios from 'axios'

// ** Actions Imports
import { addUser } from 'src/store/apps/user'

// ** Hooks
import useProjects from 'src/hooks/useProjects'

// ** ARKA MMS: User fields — username, name, email (optional), password, role, projectScope, isActive
// Role options diambil dari GET /api/roles (selaras dengan role & permission).

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(6),
  justifyContent: 'space-between'
}))

const schema = yup.object().shape({
  username: yup.string().min(2, 'Min 2 characters').required('Username is required'),
  name: yup.string().nullable(),
  email: yup.string().email('Invalid email').nullable(),
  password: yup.string().min(6, 'Min 6 characters').required('Password is required')
})

const defaultValues = {
  username: '',
  name: '',
  email: '',
  password: ''
}

const AddUserDrawer = props => {
  const { open, toggle } = props
  const [role, setRole] = useState('')
  const [projectScope, setProjectScope] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [roleOptions, setRoleOptions] = useState([])

  const dispatch = useDispatch()
  const { projects, loading: projectsLoading, error: projectsError } = useProjects()

  useEffect(() => {
    if (!open) return
    axios
      .get('/api/roles')
      .then(res => {
        const list = res.data?.roles || []
        setRoleOptions(list.map(r => ({ value: r.name, label: r.name.replace(/_/g, ' ') })))
        if (list.length) setRole(list[0].name)
      })
      .catch(() => {})
  }, [open])

  const {
    reset,
    control,
    setError,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    mode: 'onChange',
    resolver: yupResolver(schema)
  })

  const onSubmit = async data => {
    try {
      await dispatch(
        addUser({
          username: data.username,
          name: data.name || null,
          email: data.email || null,
          password: data.password,
          role,
          projectScope: projectScope || null,
          isActive
        })
      ).unwrap()
      toggle()
      reset(defaultValues)
      setRole(roleOptions[0]?.value || '')
      setProjectScope('')
      setIsActive(true)
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to add user'
      if (String(msg).toLowerCase().includes('username')) setError('username', { message: msg })
      else if (String(msg).toLowerCase().includes('email')) setError('email', { message: msg })
      else setError('username', { message: msg })
    }
  }

  const handleClose = () => {
    setRole(roleOptions[0]?.value || '')
    setProjectScope('')
    setIsActive(true)
    reset(defaultValues)
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
        <Typography variant='h5'>Add User</Typography>
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
        <form onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name='username'
            control={control}
            render={({ field: { value, onChange } }) => (
              <CustomTextField
                fullWidth
                value={value}
                sx={{ mb: 4 }}
                label='Username'
                onChange={onChange}
                placeholder='johndoe'
                error={Boolean(errors.username)}
                {...(errors.username && { helperText: errors.username.message })}
              />
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
                placeholder='john@example.com'
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
                label='Password'
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
      </Box>
    </Drawer>
  )
}

export default AddUserDrawer
