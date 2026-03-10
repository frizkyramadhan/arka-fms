// ** React Imports
import { createContext, useEffect, useState } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** Axios
import axios from 'axios'

// ** Config
import authConfig from 'src/configs/auth'

// ** Defaults
const defaultProvider = {
  user: null,
  loading: true,
  setUser: () => null,
  setLoading: () => Boolean,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve()
}
const AuthContext = createContext(defaultProvider)

const AuthProvider = ({ children }) => {
  // ** States
  const [user, setUser] = useState(defaultProvider.user)
  const [loading, setLoading] = useState(defaultProvider.loading)

  // ** Hooks
  const router = useRouter()
  useEffect(() => {
    const initAuth = async () => {
      const storedToken =
        window.localStorage.getItem(authConfig.storageTokenKeyName) ||
        window.sessionStorage.getItem(authConfig.storageTokenKeyName)
      if (storedToken) {
        setLoading(true)
        await axios
          .get(authConfig.meEndpoint, {
            headers: {
              Authorization: `Bearer ${storedToken}`
            }
          })
          .then(async response => {
            setLoading(false)
            setUser({ ...response.data.userData })
          })
          .catch(() => {
            window.localStorage.removeItem('userData')
            window.localStorage.removeItem('refreshToken')
            window.localStorage.removeItem(authConfig.storageTokenKeyName)
            window.sessionStorage.removeItem('userData')
            window.sessionStorage.removeItem(authConfig.storageTokenKeyName)
            setUser(null)
            setLoading(false)
            if (authConfig.onTokenExpiration === 'logout' && !router.pathname.includes('login')) {
              router.replace('/login')
            }
          })
      } else {
        setLoading(false)
      }
    }
    initAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = (params, errorCallback) => {
    axios
      .post(authConfig.loginEndpoint, params)
      .then(async response => {
        const { accessToken, userData } = response.data
        if (params.rememberMe) {
          window.localStorage.setItem(authConfig.storageTokenKeyName, accessToken)
          window.localStorage.setItem('userData', JSON.stringify(userData))
        } else {
          window.sessionStorage.setItem(authConfig.storageTokenKeyName, accessToken)
          window.sessionStorage.setItem('userData', JSON.stringify(userData))
        }
        setUser({ ...userData })

        // Redirect hanya di GuestGuard (satu tempat) untuk hindari double navigation & abort fetch "/"
      })
      .catch(err => {
        if (errorCallback) errorCallback(err)
      })
  }

  const handleLogout = () => {
    setUser(null)
    window.localStorage.removeItem('userData')
    window.localStorage.removeItem(authConfig.storageTokenKeyName)
    window.sessionStorage.removeItem('userData')
    window.sessionStorage.removeItem(authConfig.storageTokenKeyName)
    if (authConfig.logoutEndpoint) {
      axios.post(authConfig.logoutEndpoint, {}, { withCredentials: true }).catch(() => {})
    }
    router.push('/login')
  }

  const values = {
    user,
    loading,
    setUser,
    setLoading,
    login: handleLogin,
    logout: handleLogout
  }

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider }
