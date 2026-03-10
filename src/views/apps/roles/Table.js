/**
 * Roles Table (Vuexy) — ARKA MMS
 * DataGrid daftar role dari API: name, user count, permission count, actions (Edit, Delete).
 */
import { useEffect, useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { DataGrid } from '@mui/x-data-grid'

import Icon from 'src/@core/components/icon'
import CustomAvatar from 'src/@core/components/mui/avatar'
import TableHeader from 'src/views/apps/roles/TableHeader'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { fetchRoles, deleteRole } from 'src/store/apps/roles'

const roleIconMap = {
  Administrator: { icon: 'tabler:device-laptop', color: 'error' },
  Superuser: { icon: 'tabler:user-star', color: 'info' },
  User: { icon: 'tabler:user', color: 'primary' },
  ADMIN_HO: { icon: 'tabler:device-laptop', color: 'error' },
  ADMIN_SITE: { icon: 'tabler:building-store', color: 'info' },
  MECHANIC: { icon: 'tabler:tool', color: 'warning' }
}

const columns = (onEdit, onDelete) => [
  {
    flex: 0.3,
    minWidth: 200,
    field: 'name',
    headerName: 'Role',
    renderCell: ({ row }) => {
      const info = roleIconMap[row.name] || { icon: 'tabler:user', color: 'primary' }
      
return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CustomAvatar
            skin='light'
            sx={{ mr: 2, width: 30, height: 30 }}
            color={info.color}
          >
            <Icon icon={info.icon} fontSize={16} />
          </CustomAvatar>
          <Typography noWrap sx={{ textTransform: 'capitalize', color: 'text.secondary' }}>
            {row.name?.replace(/_/g, ' ')}
          </Typography>
        </Box>
      )
    }
  },
  {
    flex: 0.2,
    minWidth: 120,
    field: 'userCount',
    headerName: 'Users',
    renderCell: ({ row }) => (
      <Typography sx={{ color: 'text.secondary' }}>{row.userCount ?? 0}</Typography>
    )
  },
  {
    flex: 0.2,
    minWidth: 140,
    field: 'permissionCount',
    headerName: 'Permissions',
    renderCell: ({ row }) => (
      <Typography sx={{ color: 'text.secondary' }}>{row.permissionCount ?? 0}</Typography>
    )
  },
  {
    flex: 0.3,
    minWidth: 120,
    sortable: false,
    field: 'actions',
    headerName: 'Actions',
    renderCell: ({ row }) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title='Edit'>
          <IconButton size='small' onClick={() => onEdit(row)}>
            <Icon icon='tabler:edit' />
          </IconButton>
        </Tooltip>
        <Tooltip title='Delete'>
          <IconButton
            size='small'
            sx={{ color: 'error.main' }}
            onClick={() => onDelete(row)}
          >
            <Icon icon='tabler:trash' />
          </IconButton>
        </Tooltip>
      </Box>
    )
  }
]

const RolesTable = ({ onEditRole, onAddClick }) => {
  const [value, setValue] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })

  const dispatch = useDispatch()
  const store = useSelector(state => state.roles)
  const roles = store?.data || []

  useEffect(() => {
    dispatch(fetchRoles({ q: value }))
  }, [dispatch, value])

  const handleFilter = useCallback(val => setValue(val), [])

  const filteredRows = value
    ? roles.filter(
        r =>
          (r.name || '').toLowerCase().includes((value || '').toLowerCase())
      )
    : roles

  const handleDelete = row => {
    if (row.userCount > 0) {
      toast.error('Cannot delete role with assigned users. Remove users first.')
      
return
    }
    toast(
      t => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 280 }}>
          <Typography>Delete role &quot;{row.name}&quot;?</Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button size='small' variant='tonal' color='secondary' onClick={() => toast.dismiss(t.id)}>
              Cancel
            </Button>
            <Button
              size='small'
              variant='tonal'
              color='error'
              onClick={() => {
                toast.dismiss(t.id)
                dispatch(deleteRole(row.id))
                  .unwrap()
                  .then(() => toast.success('Role deleted'))
                  .catch(err => toast.error(err?.message || err?.response?.data?.error || 'Delete failed'))
              }}
            >
              Delete
            </Button>
          </Box>
        </Box>
      ),
      { duration: Infinity, style: { minWidth: 280 } }
    )
  }

  return (
    <>
      <TableHeader value={value} handleFilter={handleFilter} onAddClick={onAddClick} />
      <DataGrid
        autoHeight
        rowHeight={62}
        rows={filteredRows}
        columns={columns(row => onEditRole(row), handleDelete)}
        disableRowSelectionOnClick
        pageSizeOptions={[10, 25, 50]}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        sx={{ '& .MuiDataGrid-columnHeaders': { minHeight: 48 }, '& .MuiDataGrid-cell': { minHeight: 62 } }}
      />
    </>
  )
}

export default RolesTable
