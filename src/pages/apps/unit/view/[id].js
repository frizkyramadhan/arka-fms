/**
 * Unit View (Detail) Page
 * ---------------------------------------------------------------------------
 * Halaman detail unit by ID (ARKA MMS). Menampilkan info unit dan section
 * Maintenance Plans berdasarkan project unit dengan filter tahun & bulan.
 * Saat satu plan diklik, di bawah tampil record Maintenance Actuals untuk plan tersebut.
 */

// ** React Imports
import { useState, useEffect, useMemo } from 'react'

// ** Next Imports
import { useRouter } from 'next/router'
import Link from 'next/link'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import { DataGrid } from '@mui/x-data-grid'
import Divider from '@mui/material/Divider'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Components
import CustomChip from 'src/@core/components/mui/chip'
import CustomTextField from 'src/@core/components/mui/text-field'

// ** Utils
import axios from 'axios'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Warna chip status unit (ACTIVE, IN-ACTIVE, SOLD, SCRAP) */
const unitStatusColor = {
  ACTIVE: 'success',
  'IN-ACTIVE': 'secondary',
  SOLD: 'info',
  SCRAP: 'error'
}

/** Satu baris info di kartu Unit Detail: label kiri, value kanan (atau chip jika chip=true) */
const InfoRow = ({ label, value, chip }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5, gap: 2 }}>
    <Typography variant='body2' color='text.secondary'>
      {label}
    </Typography>
    {chip ? (
      <CustomChip
        size='small'
        label={value || '—'}
        color={unitStatusColor[value] || 'secondary'}
        rounded
        skin='light'
      />
    ) : (
      <Typography variant='body2' sx={{ fontWeight: 500, textAlign: 'right' }}>
        {value || '—'}
      </Typography>
    )}
  </Box>
)

const UnitView = () => {
  const router = useRouter()
  const { id } = router.query
  const [unit, setUnit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filter & data untuk plans (berdasarkan project unit)
  const now = new Date()
  const [planYear, setPlanYear] = useState(now.getFullYear())
  const [planMonth, setPlanMonth] = useState(now.getMonth() + 1)
  const [projectPlans, setProjectPlans] = useState([])
  const [plansLoading, setPlansLoading] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState(null)

  // Fetch unit by ID (GET /api/units/[id]) saat id tersedia
  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    axios
      .get(`/api/units/${id}`)
      .then(res => setUnit(res.data))
      .catch(err => {
        setError(err?.response?.data?.error || 'Failed to load unit')
      })
      .finally(() => setLoading(false))
  }, [id])

  // Identifier project untuk filter plan (projectName sering dipakai di plan; fallback projectId)
  const projectFilter = unit?.projectName?.trim() || unit?.projectId?.trim() || ''

  // Fetch maintenance plans untuk project unit (filter tahun & bulan)
  useEffect(() => {
    if (!unit || !projectFilter) {
      setProjectPlans([])
      
return
    }
    setPlansLoading(true)
    axios
      .get('/api/maintenance-plans', {
        params: { projectId: projectFilter, year: planYear, month: planMonth }
      })
      .then(res => {
        const list = res.data?.maintenancePlans
        setProjectPlans(Array.isArray(list) ? list : [])
      })
      .catch(() => setProjectPlans([]))
      .finally(() => setPlansLoading(false))
  }, [unit, projectFilter, planYear, planMonth])

  // Actuals untuk plan yang dipilih (filter dari unit.maintenanceActuals)
  const actualsForSelectedPlan = useMemo(() => {
    const actuals = unit?.maintenanceActuals || []
    if (!selectedPlanId) return []
    
return actuals.filter(a => a.planId === selectedPlanId)
  }, [unit?.maintenanceActuals, selectedPlanId])

  const selectedPlan = useMemo(
    () => projectPlans.find(p => p.id === selectedPlanId),
    [projectPlans, selectedPlanId]
  )

  /** Kolom tabel Maintenance Plans (project: Type, Year, Month, Sum Plan) */
  const planColumns = [
    { flex: 1, minWidth: 140, field: 'maintenanceTypeName', headerName: 'Type' },
    { flex: 0.6, minWidth: 70, field: 'year', headerName: 'Year' },
    {
      flex: 0.6,
      minWidth: 80,
      field: 'month',
      headerName: 'Month',
      renderCell: ({ row }) => MONTH_NAMES[(row.month || 1) - 1] || row.month
    },
    { flex: 0.6, minWidth: 90, field: 'sumPlan', headerName: 'Sum Plan' }
  ]

  /** Kolom tabel Maintenance Actuals (Type, Date, Time, Hour meter, View) */
  const actualColumns = [
    { flex: 1, minWidth: 120, field: 'maintenanceTypeName', headerName: 'Type' },
    {
      flex: 1,
      minWidth: 110,
      field: 'maintenanceDate',
      headerName: 'Date',
      renderCell: ({ row }) =>
        row.maintenanceDate ? new Date(row.maintenanceDate).toLocaleDateString(undefined, { dateStyle: 'short' }) : '—'
    },
    { flex: 0.6, minWidth: 70, field: 'maintenanceTime', headerName: 'Time' },
    { flex: 0.8, minWidth: 90, field: 'hourMeter', headerName: 'Hour meter' },
    {
      flex: 0.5,
      minWidth: 80,
      sortable: false,
      field: 'actions',
      headerName: '',
      renderCell: ({ row }) => (
        <Tooltip title='View detail'>
          <IconButton
            component={Link}
            href={`/apps/maintenance-actual/view/${row.id}`}
            size='small'
            sx={{ color: 'text.secondary' }}
          >
            <Icon icon='tabler:eye' />
          </IconButton>
        </Tooltip>
      )
    }
  ]

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !unit) {
    return (
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card sx={{ p: 4 }}>
            <Typography color='error' sx={{ mb: 3 }}>
              {error || 'Unit not found'}
            </Typography>
            <Button
              component={Link}
              href='/apps/unit/list'
              variant='contained'
              startIcon={<Icon icon='tabler:arrow-left' />}
            >
              Back to Units
            </Button>
          </Card>
        </Grid>
      </Grid>
    )
  }

  const hasProject = !!projectFilter

  return (
    <Grid container spacing={6}>
      {/* Header: tombol Back */}
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Button
            component={Link}
            href='/apps/unit/list'
            variant='contained'
            startIcon={<Icon icon='tabler:arrow-left' />}
          >
            Back
          </Button>
        </Box>
      </Grid>

      {/* Kartu Unit Detail */}
      <Grid item xs={12} md={5} lg={4}>
        <Card>
          <CardHeader
            title='Unit Detail'
            titleTypographyProps={{ variant: 'h6' }}
            avatar={
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText'
                }}
              >
                <Icon icon='tabler:truck' fontSize={24} />
              </Box>
            }
          />
          <Divider sx={{ m: 0 }} />
          <CardContent sx={{ pt: 2, fontSize: '1.25rem' }}>
            <InfoRow label='Unit No' value={unit.code} />
            <Divider sx={{ my: 1.5 }} />
            <InfoRow label='Project' value={unit.projectName} />
            <Divider sx={{ my: 1.5 }} />
            <InfoRow label='Model' value={unit.model} />
            <Divider sx={{ my: 1.5 }} />
            <InfoRow label='Description' value={unit.description} />
            <Divider sx={{ my: 1.5 }} />
            <InfoRow label='Manufacture' value={unit.manufacture} />
            <Divider sx={{ my: 1.5 }} />
            <InfoRow label='Plant group' value={unit.plantGroup} />
            <Divider sx={{ my: 1.5 }} />
            <InfoRow label='Plant type' value={unit.plantType} />
            <Divider sx={{ my: 1.5 }} />
            <InfoRow label='Status' value={unit.unitStatus} chip />
          </CardContent>
        </Card>
      </Grid>

      {/* Maintenance Plans (project unit) + filter tahun/bulan; klik baris → tampil actuals di bawah */}
      <Grid item xs={12} md={7} lg={8}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Card>
            <CardHeader
              title='Maintenance Plans (by project)'
              titleTypographyProps={{ variant: 'h6' }}
              subheader={
                hasProject
                  ? `Project: ${unit.projectName || unit.projectId || '—'}. Klik baris untuk lihat actual.`
                  : 'Unit ini belum punya project.'
              }
              action={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Icon icon='tabler:calendar-event' fontSize={20} style={{ opacity: 0.7 }} />
                </Box>
              }
            />
            <Divider sx={{ m: 0 }} />
            <CardContent>
              {!hasProject ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography color='text.secondary'>Unit tidak punya project. Tidak ada plan untuk ditampilkan.</Typography>
                </Box>
              ) : (
                <>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                    <CustomTextField
                      select
                      label='Tahun'
                      value={planYear}
                      onChange={e => setPlanYear(Number(e.target.value))}
                      sx={{ minWidth: 100 }}
                    >
                      {[planYear - 2, planYear - 1, planYear, planYear + 1, planYear + 2].map(y => (
                        <MenuItem key={y} value={y}>
                          {y}
                        </MenuItem>
                      ))}
                    </CustomTextField>
                    <CustomTextField
                      select
                      label='Bulan'
                      value={planMonth}
                      onChange={e => setPlanMonth(Number(e.target.value))}
                      sx={{ minWidth: 120 }}
                    >
                      {MONTH_NAMES.map((name, i) => (
                        <MenuItem key={i} value={i + 1}>
                          {name}
                        </MenuItem>
                      ))}
                    </CustomTextField>
                  </Box>
                  {plansLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress size={32} />
                    </Box>
                  ) : projectPlans.length > 0 ? (
                    <DataGrid
                      autoHeight
                      rowHeight={48}
                      rows={projectPlans}
                      columns={planColumns}
                      getRowId={row => row.id}
                      pageSizeOptions={[5, 10, 25]}
                      initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                      onRowClick={({ row }) => setSelectedPlanId(prev => (prev === row.id ? null : row.id))}
                      sx={{
                        border: 0,
                        cursor: 'pointer',
                        '& .MuiDataGrid-row:hover': { bgcolor: 'action.hover' },
                        '& .MuiDataGrid-row.Mui-selected': { bgcolor: 'primary.light' },
                        '& .MuiDataGrid-columnHeaders': { minHeight: 44 },
                        '& .MuiDataGrid-cell': { borderBottom: 1, borderColor: 'divider' }
                      }}
                      getRowClassName={params => (params.id === selectedPlanId ? 'Mui-selected' : '')}
                    />
                  ) : (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <Icon icon='tabler:calendar-off' fontSize={48} style={{ opacity: 0.4 }} />
                      <Typography color='text.secondary' sx={{ mt: 2 }}>
                        Tidak ada plan untuk project ini di periode yang dipilih.
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Maintenance Actuals untuk plan yang dipilih */}
          <Card>
            <CardHeader
              title='Maintenance Actuals'
              titleTypographyProps={{ variant: 'h6' }}
              subheader={
                selectedPlanId
                  ? selectedPlan
                    ? `${selectedPlan.maintenanceTypeName || 'Plan'} — ${MONTH_NAMES[(selectedPlan.month || 1) - 1]} ${selectedPlan.year}. Klik plan di atas untuk ganti.`
                    : `${actualsForSelectedPlan.length} record(s)`
                  : 'Klik satu baris plan di atas untuk menampilkan record actual.'
              }
              action={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Icon icon='tabler:tool' fontSize={20} style={{ opacity: 0.7 }} />
                </Box>
              }
            />
            <Divider sx={{ m: 0 }} />
            <CardContent>
              {!selectedPlanId ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Icon icon='tabler:click' fontSize={48} style={{ opacity: 0.4 }} />
                  <Typography color='text.secondary' sx={{ mt: 2 }}>
                    Pilih satu plan di tabel atas untuk melihat maintenance actual.
                  </Typography>
                </Box>
              ) : actualsForSelectedPlan.length > 0 ? (
                <DataGrid
                  autoHeight
                  rowHeight={48}
                  rows={actualsForSelectedPlan}
                  columns={actualColumns}
                  getRowId={row => row.id}
                  disableRowSelectionOnClick
                  pageSizeOptions={[5, 10, 25]}
                  initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                  sx={{
                    border: 0,
                    '& .MuiDataGrid-columnHeaders': { minHeight: 44 },
                    '& .MuiDataGrid-cell': { borderBottom: 1, borderColor: 'divider' }
                  }}
                />
              ) : (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Icon icon='tabler:tool' fontSize={48} style={{ opacity: 0.4 }} />
                  <Typography color='text.secondary' sx={{ mt: 2 }}>
                    Belum ada record maintenance actual untuk plan ini (unit ini).
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Grid>
    </Grid>
  )
}

UnitView.acl = {
  subject: 'unit',
  action: 'read'
}

export default UnitView
