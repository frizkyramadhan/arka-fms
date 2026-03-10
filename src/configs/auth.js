export default {
  meEndpoint: '/api/auth/me',
  loginEndpoint: '/api/auth/login',
  registerEndpoint: '/api/auth/register',
  logoutEndpoint: '/api/auth/logout',
  storageTokenKeyName: 'accessToken',
  onTokenExpiration: 'logout' // logout | refreshToken — use logout with DB auth
}
