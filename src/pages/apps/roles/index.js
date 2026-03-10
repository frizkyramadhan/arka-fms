/**
 * Roles List — ARKA MMS
 * Tampilan selaras dengan index lain: satu Card, CardHeader, Divider, TableHeader, DataGrid. Add/Edit lewat dialog.
 */
import { useState, useCallback } from 'react'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Divider from '@mui/material/Divider'
import CardHeader from '@mui/material/CardHeader'

import Table from 'src/views/apps/roles/Table'
import RoleFormDialog from 'src/views/apps/roles/RoleFormDialog'
import { useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import { fetchRoles, addRole, updateRole } from 'src/store/apps/roles'

const RolesComponent = () => {
  const dispatch = useDispatch()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState('add')
  const [editingRoleId, setEditingRoleId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [editingPermissionIds, setEditingPermissionIds] = useState([])

  const handleOpenAdd = useCallback(() => {
    setDialogMode('add')
    setEditingRoleId(null)
    setEditingName('')
    setEditingPermissionIds([])
    setDialogOpen(true)
  }, [])

  const handleOpenEdit = useCallback(role => {
    setDialogMode('edit')
    setEditingRoleId(role.id)
    setEditingName(role.name || '')
    setEditingPermissionIds(role.permissionIds || [])
    setDialogOpen(true)
  }, [])

  const handleDialogClose = useCallback(() => setDialogOpen(false), [])

  const handleSaved = useCallback(
    async ({ mode, roleId, name, permissionIds }) => {
      if (mode === 'add') {
        const result = await dispatch(addRole({ name })).unwrap()
        const newId = result?.role?.id
        if (newId && permissionIds?.length > 0) {
          await dispatch(updateRole({ id: newId, data: { permissionIds } })).unwrap()
        }
        toast.success('Role created')
      } else {
        await dispatch(updateRole({ id: roleId, data: { name, permissionIds } })).unwrap()
        toast.success('Role updated')
      }
      dispatch(fetchRoles({}))
    },
    [dispatch]
  )

  return (
    <Grid container spacing={6.5}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title='Roles'
            subheader='A role provides access to predefined menus and features. Assign permissions to each role.'
          />
          <Divider sx={{ m: '0 !important' }} />
          <Table onEditRole={handleOpenEdit} onAddClick={handleOpenAdd} />
        </Card>
      </Grid>

      <RoleFormDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        mode={dialogMode}
        roleId={editingRoleId}
        initialName={editingName}
        initialPermissionIds={editingPermissionIds}
        onSaved={handleSaved}
      />
    </Grid>
  )
}

RolesComponent.acl = {
  subject: 'role',
  action: 'manage'
}

export default RolesComponent
