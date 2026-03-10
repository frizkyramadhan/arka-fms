/**
 * Next.js Middleware — Cek token valid untuk route /apps dan /dashboards.
 * Tidak memblokir path berdasarkan permission (ACL di-handle per halaman).
 */

import { NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'arka-mms-secret'

async function verifyToken(token) {
  if (!token) return null
  try {
    const { jwtVerify } = await import('jose')
    const key = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, key)
    
return payload
  } catch {
    return null
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl

  const token = request.cookies.get('accessToken')?.value
  const payload = await verifyToken(token)

  if (!payload) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('returnUrl', pathname)
    
return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/apps/:path*',
    '/dashboards/:path*'
  ]
}
