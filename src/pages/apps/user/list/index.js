/**
 * User List Page
 * ---------------------------------------------------------------------------
 * Halaman daftar user (ARKA MMS). Menampilkan DataGrid dengan filter Role & Status,
 * search, dan aksi Edit/Delete per baris. Tambah user lewat drawer, edit user by id.
 * Data diambil dari Redux store (fetchData → GET /api/users).
 */

// ** React Imports
import { useState, useEffect, useCallback } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import Grid from '@mui/material/Grid'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { DataGrid } from '@mui/x-data-grid'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux'

// ** Custom Components Imports
import CustomChip from 'src/@core/components/mui/chip'
import CustomAvatar from 'src/@core/components/mui/avatar'
import CustomTextField from 'src/@core/components/mui/text-field'

// ** Utils Import
import { getInitials } from 'src/@core/utils/get-initials'

// ** Actions Imports
import { fetchData, deleteUser } from 'src/store/apps/user'

// ** Third Party
import axios from 'axios'
import toast from 'react-hot-toast'

// ** Custom Table Components Imports
import TableHeader from 'src/views/apps/user/list/TableHeader'
import AddUserDrawer from 'src/views/apps/user/list/AddUserDrawer'
import EditUserDrawer from 'src/views/apps/user/list/EditUserDrawer'

// ---------------------------------------------------------------------------
// Role & status config (untuk icon/color di tabel)
// ---------------------------------------------------------------------------
const userRoleObj = {
  ADMIN_HO: { icon: 'tabler:device-laptop', color: 'secondary' },
  ADMIN_SITE: { icon: 'tabler:building-store', color: 'info' },
  MECHANIC: { icon: 'tabler:tool', color: 'primary' }
}

const userStatusObj = {
  active: 'success',
  inactive: 'secondary'
}

/** Avatar di kolom User: tampilkan inisial dari name atau username */
const renderClient = row => {
  return (
    <CustomAvatar
      skin='light'
      color='primary'
      sx={{ mr: 2.5, width: 38, height: 38, fontWeight: 500, fontSize: theme => theme.typography.body1.fontSize }}
    >
      {getInitials((row.name || row.username || 'U').substring(0, 2))}
    </CustomAvatar>
  )
}

/**
 * Aksi per baris: Edit (buka drawer) & Delete (toast konfirmasi → dispatch deleteUser).
 */
const RowActions = ({ id, onEdit }) => {
  const dispatch = useDispatch()

  const handleDeleteClick = () => {
    toast(
      t => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 280 }}>
          <Typography>Delete this user?</Typography>
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
                dispatch(deleteUser(id))
                  .unwrap()
                  .then(() => toast.success('User deleted'))
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
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Tooltip title='Edit'>
        <IconButton size='small' sx={{ color: 'text.secondary' }} onClick={() => onEdit(id)}>
          <Icon icon='tabler:edit' />
        </IconButton>
      </Tooltip>
      <Tooltip title='Delete'>
        <IconButton size='small' sx={{ color: 'error.main' }} onClick={handleDeleteClick}>
          <Icon icon='tabler:trash' />
        </IconButton>
      </Tooltip>
    </Box>
  )
}

/** Definisi kolom DataGrid. onEdit = callback saat user klik Edit (buka EditUserDrawer). */
const columns = onEdit => [
  {
    flex: 1,
    minWidth: 260,
    field: 'user',
    headerName: 'User',
    renderCell: ({ row }) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {renderClient(row)}
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant='body2' sx={{ fontWeight: 500 }}>
            {row.username}
          </Typography>
          <Typography noWrap variant='caption' sx={{ color: 'text.disabled', fontSize: '0.875rem' }}>
            {row.name || '—'}
          </Typography>
        </Box>
      </Box>
    )
  },
  {
    flex: 1,
    minWidth: 180,
    field: 'email',
    headerName: 'Email',
    renderCell: ({ row }) => (
      <Typography noWrap sx={{ color: 'text.secondary' }}>
        {row.email || '—'}
      </Typography>
    )
  },
  {
    flex: 1,
    minWidth: 120,
    field: 'role',
    headerName: 'Role',
    renderCell: ({ row }) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <CustomAvatar
          skin='light'
          sx={{ mr: 2, width: 30, height: 30 }}
          color={userRoleObj[row.role]?.color || 'primary'}
        >
          <Icon icon={userRoleObj[row.role]?.icon || 'tabler:user'} fontSize={16} />
        </CustomAvatar>
        <Typography noWrap sx={{ textTransform: 'capitalize', color: 'text.secondary' }}>
          {row.role?.replace('_', ' ')}
        </Typography>
      </Box>
    )
  },
  {
    flex: 1,
    minWidth: 120,
    field: 'projectScope',
    headerName: 'Project',
    renderCell: ({ row }) => (
      <Typography noWrap sx={{ color: 'text.secondary' }}>
        {row.projectScope || '—'}
      </Typography>
    )
  },
  {
    flex: 1,
    minWidth: 90,
    field: 'isActive',
    headerName: 'Status',
    renderCell: ({ row }) => (
      <CustomChip
        rounded
        skin='light'
        size='small'
        label={row.isActive ? 'Active' : 'Inactive'}
        color={userStatusObj[row.isActive ? 'active' : 'inactive']}
      />
    )
  },
  {
    flex: 1,
    minWidth: 200,
    sortable: false,
    align: 'center',
    headerAlign: 'center',
    field: 'actions',
    headerName: 'Actions',
    renderCell: ({ row }) => (
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <RowActions id={row.id} onEdit={onEdit} />
      </Box>
    )
  }
]

const UserList = () => {
  // Filter & search
  const [role, setRole] = useState('')
  const [value, setValue] = useState('')
  const [status, setStatus] = useState('')
  const [roleOptions, setRoleOptions] = useState([])

  // Drawer state: Add user / Edit user (userId = id yang sedang diedit)
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [editUserOpen, setEditUserOpen] = useState(false)
  const [editUserId, setEditUserId] = useState(null)

  // DataGrid pagination
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })

  const dispatch = useDispatch()
  const store = useSelector(state => state.user)

  // Opsi filter role dari API (nama role bisa diubah di DB)
  useEffect(() => {
    axios
      .get('/api/roles')
      .then(res => setRoleOptions(res.data?.roles || []))
      .catch(() => setRoleOptions([]))
  }, [])

  // Fetch user list saat filter/search berubah (GET /api/users dengan role, status, q)
  useEffect(() => {
    dispatch(
      fetchData({
        role: role || undefined,
        status: status || undefined,
        q: value || undefined
      })
    )
  }, [dispatch, role, status, value])

  const handleFilter = useCallback(val => setValue(val), [])
  const handleRoleChange = useCallback(e => setRole(e.target.value), [])
  const handleStatusChange = useCallback(e => setStatus(e.target.value), [])
  const toggleAddUserDrawer = () => setAddUserOpen(!addUserOpen)

  const toggleEditUserDrawer = () => {
    setEditUserOpen(!editUserOpen)
    if (editUserOpen) setEditUserId(null)
  }

  const handleEditUser = id => {
    setEditUserId(id)
    setEditUserOpen(true)
  }

  return (
    <Grid container spacing={6.5}>
      <Grid item xs={12}>
        <Card>
          {/* Filter: Role (dropdown) & Status (Active/Inactive) */}
          <CardHeader title='Users' />
          <CardContent>
            <Grid container spacing={6}>
              <Grid item sm={4} xs={12}>
                <CustomTextField
                  select
                  fullWidth
                  label='Role'
                  SelectProps={{
                    value: role,
                    displayEmpty: true,
                    onChange: e => handleRoleChange(e)
                  }}
                >
                  <MenuItem value=''>All Roles</MenuItem>
                  {roleOptions.map(r => (
                    <MenuItem key={r.id} value={r.name}>
                      {r.name?.replace('_', ' ') || r.name}
                    </MenuItem>
                  ))}
                </CustomTextField>
              </Grid>
              <Grid item sm={4} xs={12}>
                <CustomTextField
                  select
                  fullWidth
                  label='Status'
                  SelectProps={{
                    value: status,
                    displayEmpty: true,
                    onChange: e => handleStatusChange(e)
                  }}
                >
                  <MenuItem value=''>All</MenuItem>
                  <MenuItem value='active'>Active</MenuItem>
                  <MenuItem value='inactive'>Inactive</MenuItem>
                </CustomTextField>
              </Grid>
            </Grid>
          </CardContent>
          <Divider sx={{ m: '0 !important' }} />
          {/* Search + tombol Add User */}
          <TableHeader value={value} handleFilter={handleFilter} toggle={toggleAddUserDrawer} />
          {/* Tabel user: data dari store.user, kolom dari columns(handleEditUser) */}
          <DataGrid
            autoHeight
            rowHeight={62}
            rows={store.data}
            columns={columns(handleEditUser)}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
          />
        </Card>
      </Grid>

      {/* Drawer tambah user (POST /api/users) */}
      <AddUserDrawer open={addUserOpen} toggle={toggleAddUserDrawer} />
      {/* Drawer edit user (GET/PATCH /api/users/:id), userId = null saat tutup */}
      <EditUserDrawer open={editUserOpen} toggle={toggleEditUserDrawer} userId={editUserId} />
    </Grid>
  )
}

UserList.acl = {
  subject: 'user',
  action: 'read'
}

export default UserList
