/**
 * Prisma Client singleton for Next.js (Prisma 7 + adapter)
 * @see https://www.prisma.io/docs/guides/database/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 */

const { PrismaClient } = require('@prisma/client')
const { PrismaMariaDb } = require('@prisma/adapter-mariadb')

const globalForPrisma = typeof globalThis !== 'undefined' ? globalThis : global

function getAdapterConfig() {
  const url = process.env.DATABASE_URL
  if (!url) return { host: 'localhost', port: 3306, user: 'root', password: '', database: 'arka_mms' }
  try {
    const u = new URL(url.replace(/^mysql:\/\//, 'http://'))
    
return {
      host: u.hostname || 'localhost',
      port: u.port ? parseInt(u.port, 10) : 3306,
      user: u.username || 'root',
      password: u.password || '',
      database: (u.pathname || '').replace(/^\//, '') || 'arka_mms',
    }
  } catch {
    return { host: 'localhost', port: 3306, user: 'root', password: '', database: 'arka_mms' }
  }
}

if (!globalForPrisma.prisma) {
  const adapter = new PrismaMariaDb(getAdapterConfig())
  globalForPrisma.prisma = new PrismaClient({ adapter })
}

module.exports = globalForPrisma.prisma
