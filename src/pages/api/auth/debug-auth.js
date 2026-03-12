/**
 * GET /api/auth/debug-auth — bantu debug redirect loop login (Docker/production).
 * Hanya aktif jika DEBUG_AUTH=1 atau NODE_ENV!==production.
 * Tidak mengembalikan secret; hanya boolean + panjang secret yang dipakai API.
 *
 * Cek: cookie accessToken ada di request? verify pakai JWT_SECRET API sama?
 * Jika cookie ada tapi verify gagal → secret middleware (build) beda dari API (runtime).
 */
import jwt from 'jsonwebtoken'
import { JWT_SECRET, parseBearerToken } from 'src/lib/auth-api'

export default async function handler(req, res) {
  const allow =
    process.env.DEBUG_AUTH === '1' ||
    process.env.DEBUG_AUTH === 'true' ||
    process.env.NODE_ENV !== 'production'
  if (!allow) {
    return res.status(404).end()
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])

    return res.status(405).end()
  }

  const cookieToken = req.cookies?.accessToken
  const headerToken = parseBearerToken(req.headers.authorization)
  const token = cookieToken || headerToken

  let verifyOk = false
  let verifyError = null
  if (token) {
    try {
      jwt.verify(token, JWT_SECRET)
      verifyOk = true
    } catch (e) {
      verifyError = e.name || 'verify_failed'
    }
  }

  return res.status(200).json({
    apiJwtSecretConfigured: Boolean(
      process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET
    ),
    apiJwtSecretLength: JWT_SECRET ? JWT_SECRET.length : 0,
    apiUsesFallbackSecret:
      JWT_SECRET === 'arka-mms-secret' &&
      !process.env.JWT_SECRET &&
      !process.env.NEXT_PUBLIC_JWT_SECRET,
    cookieAccessTokenPresent: Boolean(cookieToken),
    authorizationHeaderPresent: Boolean(headerToken),
    verifyWithApiSecretOk: verifyOk,
    verifyError: verifyOk ? null : verifyError,
    nodeEnv: process.env.NODE_ENV,
    jwtCookieSecureEnv: process.env.JWT_COOKIE_SECURE ?? '(unset)',
    hint:
      cookieToken && !verifyOk
        ? 'Token ada tapi verify gagal: JWT_SECRET saat build middleware kemungkinan beda dari runtime API. Build image dengan JWT_SECRET atau samakan secret di build & runtime.'
        : !cookieToken
          ? 'Cookie accessToken tidak ikut request: cek JWT_COOKIE_SECURE=false untuk HTTP, SameSite, atau domain.'
          : verifyOk
            ? 'API verify OK; kalau masih loop, middleware Edge pakai secret lain — build ulang dengan JWT_SECRET.'
            : null
  })
}
