/**
 * Table header untuk Permissions — search + tombol Add Permission (dialog).
 * ARKA MMS: onSubmit Add memanggil onAddPermission(name) lalu tutup dialog.
 */
import { useState } from 'react'
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'

import Icon from 'src/@core/components/icon'
import CustomTextField from 'src/@core/components/mui/text-field'

const TableHeader = props => {
  const { value, handleFilter, onAddPermission } = props
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleDialogToggle = () => {
    setOpen(!open)
    if (open) setName('')
  }

  const onSubmit = async e => {
    e.preventDefault()
    const n = name?.trim()
    if (!n) return
    setSubmitting(true)
    try {
      await onAddPermission(n)
      handleDialogToggle()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Box
        sx={{
          py: 4,
          px: 6,
          rowGap: 2,
          columnGap: 4,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'flex-end'
        }}
      >
        <Box sx={{ rowGap: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
          <CustomTextField
            value={value}
            sx={{ mr: 4 }}
            placeholder='Search permission'
            onChange={e => handleFilter(e.target.value)}
          />
          <Button variant='contained' onClick={handleDialogToggle} sx={{ '& svg': { mr: 2 } }}>
            <Icon fontSize='1.125rem' icon='tabler:plus' />
            Add Permission
          </Button>
        </Box>
      </Box>
      <Dialog fullWidth maxWidth='sm' onClose={handleDialogToggle} open={open}>
        <DialogTitle
          component='div'
          sx={{
            textAlign: 'center',
            px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
            pt: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
          }}
        >
          <Typography variant='h3' sx={{ mb: 2 }}>
            Add New Permission
          </Typography>
          <Typography color='text.secondary'>Permission name (e.g. subject.action).</Typography>
        </DialogTitle>
        <DialogContent
          sx={{
            px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
            pb: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
          }}
        >
          <Box
            component='form'
            onSubmit={onSubmit}
            sx={{
              mt: 4,
              mx: 'auto',
              width: '100%',
              maxWidth: 360,
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column'
            }}
          >
            <CustomTextField
              fullWidth
              sx={{ mb: 2 }}
              label='Permission Name'
              placeholder='e.g. plan.create'
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <Box className='demo-space-x'>
              <Button type='submit' variant='contained' disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Permission'}
              </Button>
              <Button type='button' variant='tonal' color='secondary' onClick={handleDialogToggle}>
                Discard
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default TableHeader
