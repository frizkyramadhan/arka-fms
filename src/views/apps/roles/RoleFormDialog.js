/**
 * Dialog Add/Edit Role — nama role + checklist permission.
 * Dipakai di halaman Roles (tanpa RoleCards).
 */
import { useEffect, useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import Checkbox from '@mui/material/Checkbox'
import TableRow from '@mui/material/TableRow'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TableContainer from '@mui/material/TableContainer'
import FormControlLabel from '@mui/material/FormControlLabel'

import CustomTextField from 'src/@core/components/mui/text-field'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function RoleFormDialog({
  open,
  onClose,
  mode,
  roleId,
  initialName = '',
  initialPermissionIds = [],
  onSaved
}) {
  const [roleName, setRoleName] = useState(initialName)
  const [selectedPermissionIds, setSelectedPermissionIds] = useState(initialPermissionIds)
  const [allPermissions, setAllPermissions] = useState([])
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
    if (open) {
      setRoleName(initialName)
      setSelectedPermissionIds(initialPermissionIds || [])
      loadPermissions()
    }
  }, [open, initialName, initialPermissionIds, loadPermissions])

  const handleClose = () => {
    setRoleName('')
    setSelectedPermissionIds([])
    onClose()
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
      await onSaved({ mode, roleId, name, permissionIds: selectedPermissionIds })
      handleClose()
    } catch (e) {
      toast.error(e?.message || e?.response?.data?.error || 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog fullWidth maxWidth='md' scroll='body' onClose={handleClose} open={open}>
      <DialogTitle
        component='div'
        sx={{
          textAlign: 'center',
          px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
          pt: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
        }}
      >
        <Typography variant='h3'>{mode === 'add' ? 'Add' : 'Edit'} Role</Typography>
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
  )
}
