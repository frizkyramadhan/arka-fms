/**
 * Permissions List — ARKA MMS
 * Tampilan selaras dengan index lain: satu Card, CardHeader, Divider, TableHeader, DataGrid.
 */
import { useState, useEffect, useCallback } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import AlertTitle from '@mui/material/AlertTitle'
import CardHeader from '@mui/material/CardHeader'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import { DataGrid } from '@mui/x-data-grid'

import Icon from 'src/@core/components/icon'
import CustomChip from 'src/@core/components/mui/chip'
import TableHeader from 'src/views/apps/permissions/TableHeader'
import CustomTextField from 'src/@core/components/mui/text-field'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { fetchData, addPermission, updatePermission, deletePermission } from 'src/store/apps/permissions'

const chipColors = ['primary', 'secondary', 'info', 'success', 'warning', 'error']

const defaultColumns = [
  {
    flex: 0.3,
    field: 'name',
    minWidth: 240,
    headerName: 'Name',
    renderCell: ({ row }) => <Typography sx={{ color: 'text.secondary' }}>{row.name}</Typography>
  },
  {
    flex: 0.4,
    minWidth: 290,
    field: 'assignedTo',
    headerName: 'Assigned To',
    renderCell: ({ row }) => (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {(row.assignedTo || []).map((assignee, index) => (
          <CustomChip
            rounded
            size='small'
            key={index}
            skin='light'
            color={chipColors[index % chipColors.length]}
            label={assignee.replace(/_/g, ' ')}
            sx={{ textTransform: 'capitalize' }}
          />
        ))}
        {(row.assignedTo || []).length === 0 && (
          <Typography variant='body2' color='text.disabled'>
            —
          </Typography>
        )}
      </Box>
    )
  },
  {
    flex: 0.2,
    minWidth: 180,
    field: 'createdDate',
    headerName: 'Created Date',
    renderCell: ({ row }) => <Typography sx={{ color: 'text.secondary' }}>{row.createdDate || '—'}</Typography>
  }
]

const PermissionsTable = () => {
  const [value, setValue] = useState('')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingPermission, setEditingPermission] = useState(null)
  const [editName, setEditName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })

  const dispatch = useDispatch()
  const store = useSelector(state => state.permissions)

  useEffect(() => {
    dispatch(fetchData({ q: value }))
  }, [dispatch, value])

  const handleFilter = useCallback(val => setValue(val), [])

  const handleAddPermission = useCallback(
    async name => {
      await dispatch(addPermission({ name })).unwrap()
      toast.success('Permission created')
    },
    [dispatch]
  )

  const handleEditPermission = row => {
    setEditingPermission(row)
    setEditName(row.name)
    setEditDialogOpen(true)
  }

  const handleEditDialogClose = () => {
    setEditDialogOpen(false)
    setEditingPermission(null)
    setEditName('')
  }

  const handleEditSubmit = async e => {
    e.preventDefault()
    const n = editName?.trim()
    if (!n || !editingPermission?.id) return
    setSubmitting(true)
    try {
      await dispatch(updatePermission({ id: editingPermission.id, data: { name: n } })).unwrap()
      toast.success('Permission updated')
      handleEditDialogClose()
    } catch (err) {
      toast.error(err?.message || err?.response?.data?.error || 'Update failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePermission = row => {
    toast(
      t => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 280 }}>
          <Typography>Delete permission &quot;{row.name}&quot;? It will be removed from all roles.</Typography>
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
                dispatch(deletePermission(row.id))
                  .unwrap()
                  .then(() => toast.success('Permission deleted'))
                  .catch(err => toast.error(err?.message || 'Delete failed'))
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

  const columns = [
    ...defaultColumns,
    {
      flex: 0.15,
      minWidth: 120,
      sortable: false,
      field: 'actions',
      headerName: 'Actions',
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size='small' onClick={() => handleEditPermission(row)}>
            <Icon icon='tabler:edit' />
          </IconButton>
          <IconButton size='small' sx={{ color: 'error.main' }} onClick={() => handleDeletePermission(row)}>
            <Icon icon='tabler:trash' />
          </IconButton>
        </Box>
      )
    }
  ]

  return (
    <>
      <Grid container spacing={6.5}>
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title='Permissions'
              subheader='Manage permission names (subject.action). Assign permissions to roles in Roles list.'
            />
            <Divider sx={{ m: '0 !important' }} />
            <TableHeader value={value} handleFilter={handleFilter} onAddPermission={handleAddPermission} />
            <DataGrid
              autoHeight
              rowHeight={62}
              rows={store.data || []}
              columns={columns}
              disableRowSelectionOnClick
              pageSizeOptions={[10, 25, 50]}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              sx={{ '& .MuiDataGrid-columnHeaders': { minHeight: 48 }, '& .MuiDataGrid-cell': { minHeight: 62 } }}
            />
          </Card>
        </Grid>
      </Grid>

      <Dialog maxWidth='sm' fullWidth onClose={handleEditDialogClose} open={editDialogOpen}>
        <DialogTitle
          sx={{
            textAlign: 'center',
            px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
            pt: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
          }}
        >
          <Typography variant='h5' component='span' sx={{ mb: 2 }}>
            Edit Permission
          </Typography>
          <Typography variant='body2'>Edit permission name. Changing it may affect role access.</Typography>
        </DialogTitle>
        <DialogContent
          sx={{
            px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
            pb: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
          }}
        >
          <Alert severity='warning' sx={{ maxWidth: '500px', mb: 2 }}>
            <AlertTitle>Warning</AlertTitle>
            Changing the permission name may break existing role assignments. Ensure the new name follows the
            subject.action format.
          </Alert>
          <Box component='form' sx={{ mt: 2 }} onSubmit={handleEditSubmit}>
            <CustomTextField
              fullWidth
              value={editName}
              label='Permission Name'
              sx={{ mb: 3 }}
              placeholder='e.g. plan.create'
              onChange={e => setEditName(e.target.value)}
            />
            <Box className='demo-space-x'>
              <Button type='submit' variant='contained' disabled={submitting}>
                {submitting ? 'Updating…' : 'Update'}
              </Button>
              <Button type='button' variant='tonal' color='secondary' onClick={handleEditDialogClose}>
                Cancel
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  )
}

PermissionsTable.acl = {
  subject: 'permission',
  action: 'manage'
}

export default PermissionsTable
