// ** React Imports
import { useState } from 'react'

// ** Next Import
import Link from 'next/link'
import { useRouter } from 'next/router'

// ** MUI Components
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import CardContent from '@mui/material/CardContent'
import { styled, useTheme } from '@mui/material/styles'
import MuiCard from '@mui/material/Card'
import InputAdornment from '@mui/material/InputAdornment'
import Alert from '@mui/material/Alert'

// ** Custom Component Import
import CustomTextField from 'src/@core/components/mui/text-field'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Imports
import * as yup from 'yup'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import axios from 'axios'

// ** Configs
import themeConfig from 'src/configs/themeConfig'
import authConfig from 'src/configs/auth'

// ** Layout Import
import BlankLayout from 'src/@core/layouts/BlankLayout'

// ** Demo Imports
import AuthIllustrationV1Wrapper from 'src/views/pages/auth/AuthIllustrationV1Wrapper'

// ** Styled Components
const Card = styled(MuiCard)(({ theme }) => ({
  [theme.breakpoints.up('sm')]: { width: '25rem' }
}))

const LinkStyled = styled(Link)(({ theme }) => ({
  textDecoration: 'none',
  color: `${theme.palette.primary.main} !important`
}))

const schema = yup.object().shape({
  fullName: yup.string().trim(),
  username: yup.string().trim().min(1, 'Username is required').required('Username is required'),
  email: yup.string().trim().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required')
})

const defaultValues = {
  fullName: '',
  username: '',
  email: '',
  password: ''
}

const Register = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const router = useRouter()
  const theme = useTheme()

  const {
    control,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues,
    mode: 'onBlur',
    resolver: yupResolver(schema)
  })

  const onSubmit = async data => {
    setSubmitError('')
    try {
      await axios.post(authConfig.registerEndpoint, {
        username: data.username.trim(),
        email: data.email.trim(),
        password: data.password,
        name: data.fullName?.trim() || undefined
      })
      router.replace('/login?registered=1')
    } catch (err) {
      const res = err?.response?.data
      const errObj = res?.error
      if (errObj?.username?.[0]) {
        setError('username', { type: 'manual', message: errObj.username[0] })
      }
      if (errObj?.email?.[0]) {
        setError('email', { type: 'manual', message: errObj.email[0] })
      }
      if (!errObj?.username?.[0] && !errObj?.email?.[0]) {
        const msg = errObj?.username?.[0] || res?.error || 'Registration failed'
        setSubmitError(typeof msg === 'string' ? msg : 'Registration failed')
      }
    }
  }

  return (
    <Box className='content-center'>
      <AuthIllustrationV1Wrapper>
        <Card>
          <CardContent sx={{ p: theme => `${theme.spacing(10.5, 8, 8)} !important` }}>
            <Box sx={{ mb: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={34} viewBox='0 0 32 22' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <path
                  fillRule='evenodd'
                  clipRule='evenodd'
                  fill={theme.palette.primary.main}
                  d='M0.00172773 0V6.85398C0.00172773 6.85398 -0.133178 9.01207 1.98092 10.8388L13.6912 21.9964L19.7809 21.9181L18.8042 9.88248L16.4951 7.17289L9.23799 0H0.00172773Z'
                />
                <path
                  fill='#161616'
                  opacity={0.06}
                  fillRule='evenodd'
                  clipRule='evenodd'
                  d='M7.69824 16.4364L12.5199 3.23696L16.5541 7.25596L7.69824 16.4364Z'
                />
                <path
                  fill='#161616'
                  opacity={0.06}
                  fillRule='evenodd'
                  clipRule='evenodd'
                  d='M8.07751 15.9175L13.9419 4.63989L16.5849 7.28475L8.07751 15.9175Z'
                />
                <path
                  fillRule='evenodd'
                  clipRule='evenodd'
                  fill={theme.palette.primary.main}
                  d='M7.77295 16.3566L23.6563 0H32V6.88383C32 6.88383 31.8262 9.17836 30.6591 10.4057L19.7824 22H13.6938L7.77295 16.3566Z'
                />
              </svg>
              <Typography variant='h3' sx={{ ml: 2.5, fontWeight: 700 }}>
                {themeConfig.templateName}
              </Typography>
            </Box>
            <Box sx={{ mb: 6 }}>
              <Typography variant='h4' sx={{ mb: 1.5 }}>
                Adventure starts here 🚀
              </Typography>
              <Typography sx={{ color: 'text.secondary' }}>
                Register with username and email. Account will be inactive until activated by admin.
              </Typography>
            </Box>
            {submitError ? (
              <Alert severity='error' sx={{ mb: 4 }} onClose={() => setSubmitError('')}>
                {submitError}
              </Alert>
            ) : null}
            <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
              <Controller
                name='fullName'
                control={control}
                render={({ field: { value, onChange, onBlur } }) => (
                  <CustomTextField
                    autoFocus
                    fullWidth
                    value={value}
                    onBlur={onBlur}
                    onChange={onChange}
                    label='Full Name'
                    placeholder='John Doe'
                    sx={{ mb: 4 }}
                    error={Boolean(errors.fullName)}
                    {...(errors.fullName && { helperText: errors.fullName.message })}
                  />
                )}
              />
              <Controller
                name='username'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange, onBlur } }) => (
                  <CustomTextField
                    fullWidth
                    value={value}
                    onBlur={onBlur}
                    onChange={onChange}
                    label='Username'
                    placeholder='johndoe'
                    sx={{ mb: 4 }}
                    error={Boolean(errors.username)}
                    {...(errors.username && { helperText: errors.username.message })}
                  />
                )}
              />
              <Controller
                name='email'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange, onBlur } }) => (
                  <CustomTextField
                    fullWidth
                    type='email'
                    value={value}
                    onBlur={onBlur}
                    onChange={onChange}
                    label='Email'
                    placeholder='john.doe@email.com'
                    sx={{ mb: 4 }}
                    error={Boolean(errors.email)}
                    {...(errors.email && { helperText: errors.email.message })}
                  />
                )}
              />
              <Controller
                name='password'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange, onBlur } }) => (
                  <CustomTextField
                    fullWidth
                    label='Password'
                    value={value}
                    onBlur={onBlur}
                    onChange={onChange}
                    placeholder='············'
                    sx={{ mb: 6 }}
                    id='auth-register-password'
                    type={showPassword ? 'text' : 'password'}
                    error={Boolean(errors.password)}
                    {...(errors.password && { helperText: errors.password.message })}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position='end'>
                          <IconButton
                            edge='end'
                            onClick={() => setShowPassword(!showPassword)}
                            onMouseDown={e => e.preventDefault()}
                            aria-label='toggle password visibility'
                          >
                            <Icon fontSize='1.25rem' icon={showPassword ? 'tabler:eye' : 'tabler:eye-off'} />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                )}
              />
              <Button fullWidth type='submit' variant='contained' disabled={isSubmitting} sx={{ mb: 4 }}>
                {isSubmitting ? 'Signing up...' : 'Sign up'}
              </Button>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Typography sx={{ color: 'text.secondary', mr: 2 }}>Already have an account?</Typography>
                <Typography component={LinkStyled} href='/login' sx={{ fontSize: theme.typography.body1.fontSize }}>
                  Sign in instead
                </Typography>
              </Box>
            </form>
          </CardContent>
        </Card>
      </AuthIllustrationV1Wrapper>
    </Box>
  )
}

Register.getLayout = page => <BlankLayout>{page}</BlankLayout>
Register.guestGuard = true

export default Register
