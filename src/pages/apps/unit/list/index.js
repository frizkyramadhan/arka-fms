/**
 * Unit List Page
 * ---------------------------------------------------------------------------
 * Halaman daftar unit (ARKA MMS). DataGrid dengan filter Unit No, Model, Project,
 * Manufacture, Plant group, Status; tombol Sync dari ARKFleet; aksi View (ke
 * halaman detail). Data dari Redux (fetchData → GET /api/units).
 */

// ** React Imports
import { useState, useEffect, useCallback } from 'react'

// ** Next Imports
import { useRouter } from 'next/router'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Tooltip from '@mui/material/Tooltip'
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
import CustomTextField from 'src/@core/components/mui/text-field'

// ** Actions Imports
import { fetchData, syncUnits } from 'src/store/apps/unit'

// ** Third Party
import toast from 'react-hot-toast'

// ** Table Header
import TableHeader from 'src/views/apps/unit/list/TableHeader'

/** Warna chip status unit di kolom Status */
const unitStatusColor = {
  ACTIVE: 'success',
  'IN-ACTIVE': 'secondary',
  SOLD: 'info',
  SCRAP: 'error'
}

/** Kolom DataGrid. onView = callback saat klik View (navigate ke /apps/unit/view/[id]). */
const columns = onView => [
  {
    flex: 1,
    minWidth: 100,
    field: 'code',
    headerName: 'Unit No',
    renderCell: ({ row }) => (
      <Typography noWrap sx={{ fontWeight: 500 }}>
        {row.code || '—'}
      </Typography>
    )
  },
  {
    flex: 1,
    minWidth: 100,
    field: 'model',
    headerName: 'Model',
    renderCell: ({ row }) => (
      <Typography noWrap sx={{ color: 'text.secondary' }}>
        {row.model || '—'}
      </Typography>
    )
  },
  {
    flex: 1,
    minWidth: 80,
    field: 'projectName',
    headerName: 'Project',
    renderCell: ({ row }) => (
      <Typography noWrap sx={{ color: 'text.secondary' }}>
        {row.projectName || '—'}
      </Typography>
    )
  },
  {
    flex: 1,
    minWidth: 100,
    field: 'manufacture',
    headerName: 'Manufacture',
    renderCell: ({ row }) => (
      <Typography noWrap sx={{ color: 'text.secondary' }}>
        {row.manufacture || '—'}
      </Typography>
    )
  },
  {
    flex: 1,
    minWidth: 100,
    field: 'plantGroup',
    headerName: 'Plant group',
    renderCell: ({ row }) => (
      <Typography noWrap sx={{ color: 'text.secondary' }}>
        {row.plantGroup || '—'}
      </Typography>
    )
  },
  {
    flex: 1,
    minWidth: 90,
    field: 'plantType',
    headerName: 'Plant type',
    renderCell: ({ row }) => (
      <Typography noWrap sx={{ color: 'text.secondary' }}>
        {row.plantType || '—'}
      </Typography>
    )
  },
  {
    flex: 1,
    minWidth: 100,
    field: 'unitStatus',
    headerName: 'Status',
    renderCell: ({ row }) => {
      const status = row.unitStatus || '—'
      const color = unitStatusColor[row.unitStatus] || 'secondary'
      
return <CustomChip rounded skin='light' size='small' label={status} color={color} />
    }
  },
  {
    flex: 0.8,
    minWidth: 90,
    sortable: false,
    field: 'actions',
    headerName: 'Actions',
    align: 'center',
    headerAlign: 'center',
    renderCell: ({ row }) => (
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Tooltip title='View'>
          <IconButton size='small' sx={{ color: 'text.secondary' }} onClick={() => onView(row.id)}>
            <Icon icon='tabler:eye' />
          </IconButton>
        </Tooltip>
      </Box>
    )
  }
]

const UnitList = () => {
  const router = useRouter()

  // Filter: Unit No, Model, Project, Manufacture, Plant group, Status
  const [unitNo, setUnitNo] = useState('')
  const [model, setModel] = useState('')
  const [project, setProject] = useState('')
  const [manufacture, setManufacture] = useState('')
  const [plantGroup, setPlantGroup] = useState('')
  const [status, setStatus] = useState('ACTIVE')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })

  const dispatch = useDispatch()
  const store = useSelector(state => state.unit)
  const syncing = store.syncing ?? false

  const handleViewUnit = useCallback(id => router.push(`/apps/unit/view/${id}`), [router])

  // Fetch daftar unit saat filter berubah (GET /api/units)
  useEffect(() => {
    dispatch(
      fetchData({
        unitNo: unitNo || undefined,
        model: model || undefined,
        project: project || undefined,
        manufacture: manufacture || undefined,
        plantGroup: plantGroup || undefined,
        status: status || undefined
      })
    )
  }, [dispatch, unitNo, model, project, manufacture, plantGroup, status])

  const handleSync = useCallback(() => {
    const promise = dispatch(syncUnits()).unwrap()
    toast.promise(promise, {
      loading: 'Syncing units from ARKFleet…',
      success: data => `Synced ${data?.synced ?? 0} units (${data?.created ?? 0} new, ${data?.updated ?? 0} updated)`,
      error: err => err?.response?.data?.error || err?.message || 'Sync failed'
    })
  }, [dispatch])

  return (
    <Grid container spacing={6.5}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title='Units' />
          {/* Filter: Unit No, Model, Project, Manufacture, Plant group, Status */}
          <CardContent>
            <Grid container spacing={4}>
              <Grid item xs={12} sm={6} md={4} lg={2}>
                <CustomTextField
                  fullWidth
                  label='Unit No'
                  value={unitNo}
                  onChange={e => setUnitNo(e.target.value)}
                  placeholder='e.g. ADT 011'
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={2}>
                <CustomTextField
                  fullWidth
                  label='Model'
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  placeholder='e.g. HM400-3R'
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={2}>
                <CustomTextField
                  fullWidth
                  label='Project'
                  value={project}
                  onChange={e => setProject(e.target.value)}
                  placeholder='e.g. 022C'
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={2}>
                <CustomTextField
                  fullWidth
                  label='Manufacture'
                  value={manufacture}
                  onChange={e => setManufacture(e.target.value)}
                  placeholder='e.g. Komatsu'
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={2}>
                <CustomTextField
                  fullWidth
                  label='Plant group'
                  value={plantGroup}
                  onChange={e => setPlantGroup(e.target.value)}
                  placeholder='e.g. Compressor'
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={2}>
                <CustomTextField
                  fullWidth
                  select
                  label='Status'
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  SelectProps={{ displayEmpty: true }}
                >
                  <MenuItem value=''>All</MenuItem>
                  <MenuItem value='ACTIVE'>Active</MenuItem>
                  <MenuItem value='IN-ACTIVE'>In-Active</MenuItem>
                  <MenuItem value='SOLD'>Sold</MenuItem>
                  <MenuItem value='SCRAP'>Scrap</MenuItem>
                </CustomTextField>
              </Grid>
            </Grid>
          </CardContent>
          <Divider sx={{ m: '0 !important' }} />
          {/* Tombol Sync dari ARKFleet */}
          <TableHeader onSync={handleSync} syncing={syncing} />
          {/* Tabel unit: data dari store.unit */}
          <DataGrid
            autoHeight
            rowHeight={52}
            rows={store.data}
            columns={columns(handleViewUnit)}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            sx={{ '& .MuiDataGrid-columnHeaders': { minHeight: 48 }, '& .MuiDataGrid-cell': { minHeight: 52 } }}
          />
        </Card>
      </Grid>
    </Grid>
  )
}

UnitList.acl = {
  subject: 'unit',
  action: 'read'
}

export default UnitList
