// ** MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

const TableHeader = props => {
  const { onSync, syncing } = props

  return (
    <Box
      sx={{
        py: 4,
        px: 6,
        rowGap: 2,
        columnGap: 4,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <Button
        color='secondary'
        variant='tonal'
        startIcon={<Icon icon={syncing ? 'tabler:loader' : 'tabler:refresh'} />}
        onClick={onSync}
        disabled={syncing}
      >
        {syncing ? 'Syncing…' : 'Sync from ARKFleet'}
      </Button>
    </Box>
  )
}

export default TableHeader
