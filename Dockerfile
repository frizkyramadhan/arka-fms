# ARKA MMS — Next.js production image
# Penting: Middleware Edge mem-bundling JWT_SECRET saat build. Tanpa ARG ini,
# verify token di middleware gagal → redirect loop login meski API login sukses.
#
# Build:
#   docker build --build-arg JWT_SECRET="$(grep JWT_SECRET .env | cut -d= -f2 | tr -d '\"')" -t arka-fms .
# Compose: lihat docker-compose.snippet.yml atau pasang build.args + environment.

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# prisma.config.ts → env('DATABASE_URL') wajib ada saat prisma load config.
# Hanya untuk step ini (tidak di-ENV permanen) agar image tidak bawa URL DB build.
RUN DATABASE_URL="mysql://build:build@127.0.0.1:3306/build" npx prisma generate

# Wajib sama dengan runtime — middleware + API harus satu secret
ARG JWT_SECRET
RUN test -n "$JWT_SECRET" || (echo "ERROR: build-arg JWT_SECRET wajib diisi (middleware Edge)." && exit 1)
ENV JWT_SECRET=$JWT_SECRET

# Cookie tanpa Secure saat akses HTTP (nginx tanpa TLS ke browser)
ARG JWT_COOKIE_SECURE=false
ENV JWT_COOKIE_SECURE=$JWT_COOKIE_SECURE

RUN npm run build

EXPOSE 3000

# Runtime: DATABASE_URL harus mengarah ke host mysql (bukan localhost)
CMD sh -c "npx prisma generate && npx prisma migrate deploy && npm start"
