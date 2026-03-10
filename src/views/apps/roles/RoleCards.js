/**
 * Role Cards (Vuexy) — ARKA MMS
 * Kartu per role dari API; kartu terakhir "Add New Role". Dialog Add/Edit: nama role + checklist permission.
 * Menggunakan forwardRef + useImperativeHandle agar parent bisa panggil openEdit(role) dari Table.
 */
import { useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import Dialog from '@mui/material/Dialog'
import Checkbox from '@mui/material/Checkbox'
import TableRow from '@mui/material/TableRow'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import DialogTitle from '@mui/material/DialogTitle'
import AvatarGroup from '@mui/material/AvatarGroup'
import CardContent from '@mui/material/CardContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import TableContainer from '@mui/material/TableContainer'
import FormControlLabel from '@mui/material/FormControlLabel'

import Icon from 'src/@core/components/icon'
import CustomTextField from 'src/@core/components/mui/text-field'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import toast from 'react-hot-toast'
import { fetchRoles, updateRole, addRole } from 'src/store/apps/roles'

const roleIconMap = {
  Administrator: 'tabler:device-laptop',
  Superuser: 'tabler:user-star',
  User: 'tabler:user',
  ADMIN_HO: 'tabler:device-laptop',
  ADMIN_SITE: 'tabler:building-store',
  MECHANIC: 'tabler:tool'
}

const RolesCards = forwardRef((props, ref) => {
  const dispatch = useDispatch()
  const rolesStore = useSelector(state => state.roles)
  const roles = rolesStore?.data || []

  const [open, setOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState('add') // 'add' | 'edit'
  const [editingRoleId, setEditingRoleId] = useState(null)
  const [roleName, setRoleName] = useState('')
  const [selectedPermissionIds, setSelectedPermissionIds] = useState([])
  const [allPermissions, setAllPermissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const loadPermissions = useCallback(async () => {
    try {
      const res = await axios.get('/api/permissions')
      setAllPermissions(res.data?.permissions || [])
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to load permissions')
    }
  }, [])

  useEffect(() => {
    dispatch(fetchRoles({}))
  }, [dispatch])

  useEffect(() => {
    if (open) loadPermissions()
  }, [open, loadPermissions])

  const handleOpenAdd = () => {
    setDialogMode('add')
    setEditingRoleId(null)
    setRoleName('')
    setSelectedPermissionIds([])
    setOpen(true)
  }

  const handleOpenEdit = role => {
    setDialogMode('edit')
    setEditingRoleId(role.id)
    setRoleName(role.name)
    setSelectedPermissionIds(role.permissionIds || [])
    setOpen(true)
  }

  useImperativeHandle(ref, () => ({
    openEdit: handleOpenEdit
  }), [handleOpenEdit])

  const handleClose = () => {
    setOpen(false)
    setRoleName('')
    setSelectedPermissionIds([])
    setEditingRoleId(null)
  }

  const togglePermission = id => {
    setSelectedPermissionIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedPermissionIds.length >= allPermissions.length) {
      setSelectedPermissionIds([])
    } else {
      setSelectedPermissionIds(allPermissions.map(p => p.id))
    }
  }

  const handleSubmit = async () => {
    const name = roleName?.trim()
    if (!name) {
      toast.error('Role name is required')
      
return
    }
    setSubmitting(true)
    try {
      if (dialogMode === 'add') {
        const result = await dispatch(addRole({ name })).unwrap()
        const newId = result?.role?.id
        if (newId && selectedPermissionIds.length > 0) {
          await dispatch(updateRole({ id: newId, data: { permissionIds: selectedPermissionIds } })).unwrap()
        }
        toast.success('Role created')
      } else {
        await dispatch(
          updateRole({
            id: editingRoleId,
            data: { name, permissionIds: selectedPermissionIds }
          })
        ).unwrap()
        toast.success('Role updated')
      }
      handleClose()
    } catch (e) {
      toast.error(e?.message || e?.response?.data?.error || 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  const renderCards = () => (
    <>
      {roles.map((role, index) => (
        <Grid item xs={12} sm={6} lg={4} key={role.id}>
          <Card>
            <CardContent>
              <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ color: 'text.secondary' }}>
                  Total {role.userCount ?? 0} users
                </Typography>
                <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 32, height: 32 } }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <Icon icon={roleIconMap[role.name] || 'tabler:user'} fontSize={18} />
                  </Avatar>
                </AvatarGroup>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box>
                  <Typography variant='h4' sx={{ mb: 1 }}>
                    {role.name?.replace('_', ' ')}
                  </Typography>
                  <Typography
                    component='button'
                    type='button'
                    sx={{ color: 'primary.main', textDecoration: 'none', border: 0, background: 'none', cursor: 'pointer', p: 0 }}
                    onClick={() => handleOpenEdit(role)}
                  >
                    Edit Role
                  </Typography>
                </Box>
                <IconButton size='small' sx={{ color: 'text.disabled' }} disabled>
                  <Icon icon='tabler:copy' />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
      <Grid item xs={12} sm={6} lg={4}>
        <Card sx={{ cursor: 'pointer' }} onClick={handleOpenAdd}>
          <Grid container sx={{ height: '100%' }}>
            <Grid item xs={5}>
              <Box
                sx={{
                  height: '100%',
                  minHeight: 140,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center'
                }}
              >
                <img height={122} alt='add-role' src='/images/pages/add-new-role-illustration.png' />
              </Box>
            </Grid>
            <Grid item xs={7}>
              <CardContent sx={{ pl: 0, height: '100%' }}>
                <Box sx={{ textAlign: 'right' }}>
                  <Button variant='contained' sx={{ mb: 3, whiteSpace: 'nowrap' }} onClick={e => { e.stopPropagation(); handleOpenAdd(); }}>
                    Add New Role
                  </Button>
                  <Typography sx={{ color: 'text.secondary' }}>Add role, if it doesn't exist.</Typography>
                </Box>
              </CardContent>
            </Grid>
          </Grid>
        </Card>
      </Grid>
    </>
  )

  return (
    <Grid container spacing={6} className='match-height'>
      {loading ? (
        <Grid item xs={12}>
          <Typography color='text.secondary'>Loading roles…</Typography>
        </Grid>
      ) : (
        renderCards()
      )}

      <Dialog fullWidth maxWidth='md' scroll='body' onClose={handleClose} open={open}>
        <DialogTitle
          component='div'
          sx={{
            textAlign: 'center',
            px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
            pt: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
          }}
        >
          <Typography variant='h3'>{dialogMode === 'add' ? 'Add' : 'Edit'} Role</Typography>
          <Typography color='text.secondary'>Set Role Permissions</Typography>
        </DialogTitle>
        <DialogContent
          sx={{
            pb: theme => `${theme.spacing(5)} !important`,
            px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`]
          }}
        >
          <Box sx={{ my: 4 }}>
            <FormControl fullWidth>
              <CustomTextField
                fullWidth
                label='Role Name'
                placeholder='Enter Role Name'
                value={roleName}
                onChange={e => setRoleName(e.target.value)}
              />
            </FormControl>
          </Box>
          <Typography variant='h4'>Role Permissions</Typography>
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: '0 !important' }}>
                    <Typography sx={{ fontWeight: 600, color: 'text.secondary' }}>Permission</Typography>
                  </TableCell>
                  <TableCell>
                    <FormControlLabel
                      label='Select All'
                      sx={{ '& .MuiTypography-root': { textTransform: 'capitalize', color: 'text.secondary' } }}
                      control={
                        <Checkbox
                          size='small'
                          onChange={handleSelectAll}
                          indeterminate={selectedPermissionIds.length > 0 && selectedPermissionIds.length < allPermissions.length}
                          checked={allPermissions.length > 0 && selectedPermissionIds.length === allPermissions.length}
                        />
                      }
                    />
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allPermissions.map(p => (
                  <TableRow key={p.id}>
                    <TableCell sx={{ fontWeight: 500 }}>{p.name}</TableCell>
                    <TableCell>
                      <Checkbox
                        size='small'
                        checked={selectedPermissionIds.includes(p.id)}
                        onChange={() => togglePermission(p.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions
          sx={{
            display: 'flex',
            justifyContent: 'center',
            px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
            pb: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
          }}
        >
          <Button variant='contained' onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving…' : 'Submit'}
          </Button>
          <Button color='secondary' variant='tonal' onClick={handleClose}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
})

RolesCards.displayName = 'RolesCards'

export default RolesCards
