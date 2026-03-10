/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')

/** @type {import('next').NextConfig} */

// Remove this if you're not using Fullcalendar features

module.exports = {
  trailingSlash: true,
  reactStrictMode: false,
  // Hindari bundling Prisma/MariaDB (butuh Node 'fs') ke client (Next 13: pakai experimental)
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', '@prisma/adapter-mariadb', 'mariadb']
  },
  webpack: config => {
    config.resolve.alias = {
      ...config.resolve.alias,
      apexcharts: path.resolve(__dirname, './node_modules/apexcharts-clevision')
    }

    return config
  }
}
