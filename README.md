# Pisjo Market Platform

Platform marketplace ikan segar untuk katalog produk, varian berat, SKU,
stok, keranjang, wishlist, voucher, diskon, promotion, flash sale,
order, pembayaran, notifikasi, dan Web Push.

## Tech Stack

-   Next.js 16.2.12
-   React
-   TypeScript
-   Prisma 6.19.0
-   PostgreSQL
-   pnpm
-   PM2
-   Nginx
-   SSL/HTTPS
-   Web Push

## Fitur

### Customer

-   Registrasi, login, email verification
-   Forgot/reset password
-   Katalog dan kategori produk
-   Varian berat dan harga
-   SKU dan stok
-   Cart dan wishlist
-   Catatan pesanan
-   Voucher, diskon, promotion
-   Flash sale
-   Checkout dan pembayaran
-   Upload bukti pembayaran
-   Status dan riwayat pesanan

### Admin

-   Dashboard
-   Product dan category management
-   SKU, variant, weight option
-   Stock dan stock ledger
-   Order management
-   Payment verification
-   Voucher, discount, promotion
-   Flash sale
-   Store settings, location, hero slides
-   Notification dan Web Push

## Notification System

Notification disimpan secara user-scoped. Operasi user-facing
menggunakan `userId` sebagai authorization scope.

Notification type:

-   `NEW_ORDER`
-   `PAYMENT_PROOF`
-   `PAYMENT_VERIFIED`
-   `ORDER_STATUS`
-   `SYSTEM`

Notification dapat memiliki `orderId` yang menghubungkan langsung
notification dengan order. `href` digunakan untuk navigasi UI.

Web Push menggunakan tabel `PushSubscription` dengan ownership `userId`
dan unique constraint `userId + endpoint`.

Alur:

``` text
Business Event
    ↓
Notification Service
    ├── Database Notification
    └── Web Push
          ↓
    Service Worker
          ↓
 Browser Popup
```

## Struktur Project

``` text
fish-market-platform/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   └── sw.js
├── scripts/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── admin/
│   │   ├── customer/
│   │   ├── layout.tsx
│   │   └── not-found.tsx
│   ├── components/
│   ├── repositories/
│   ├── services/
│   └── lib/
├── package.json
└── README.md
```

## Instalasi

### Prerequisites

-   Node.js
-   pnpm
-   PostgreSQL
-   Git

``` bash
git clone https://github.com/newcyber/fish-market-platform.git
cd fish-market-platform
pnpm install
```

Buat `.env` sesuai konfigurasi lokal. Secret production tidak boleh
dimasukkan ke Git.

Contoh variabel yang digunakan:

``` env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/fish_market"
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"

NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-public-key"
VAPID_PRIVATE_KEY="your-private-key"
VAPID_SUBJECT="mailto:your-email@example.com"
```

Nama environment variable harus mengikuti implementasi aktual pada
source code.

## Prisma

``` bash
pnpm prisma validate
pnpm prisma format
pnpm prisma generate
pnpm prisma migrate status
```

Development:

``` bash
pnpm prisma migrate dev
```

Production:

``` bash
pnpm prisma migrate deploy
```

## Quality Check

Sebelum commit:

``` bash
pnpm exec tsc --noEmit
git diff --check
```

Untuk perubahan besar:

``` bash
pnpm build
```

Recommended flow:

``` text
Code
 ↓
TypeScript Check
 ↓
Prisma Validation
 ↓
Build
 ↓
Commit
 ↓
Push
 ↓
Deploy
```

## Production

Production menggunakan:

``` text
Internet
   ↓
 Nginx
   ↓
 Next.js
   ↓
 PM2
   ↓
PostgreSQL
```

Production application:

`https://app.pusatikansegar.com`

Deployment umum:

``` bash
git pull origin main
pnpm install --frozen-lockfile
pnpm prisma migrate deploy
pnpm build
pm2 restart <application-name>
```

Verifikasi:

``` bash
pm2 status
pm2 logs <application-name>
```

## Security Principles

-   Notification selalu memiliki `userId`.
-   User-facing notification harus menggunakan `userId + notificationId`
    sebagai scope.
-   Push subscription terikat pada `userId`.
-   Perubahan database menggunakan Prisma migration.
-   Secret, credential, private key, dan password tidak boleh di-commit.
-   Jangan menjalankan `git add .` tanpa memeriksa file
    development/audit yang belum dilacak.

## Custom 404

Custom 404 berada di:

``` text
src/app/not-found.tsx
```

Halaman ini menggantikan tampilan 404 default Next.js dan menggunakan
visual yang disesuaikan dengan branding Pisjo Market.

## Git Checkpoints

Branch utama:

``` text
main
```

Checkpoint terbaru:

``` text
274eac2 feat: add custom 404 page
```

Checkpoint sebelumnya:

``` text
1952dda feat: complete admin web push notifications
```

Checkpoint digunakan untuk menjaga perubahan fitur besar tetap mudah
diidentifikasi dan dipulihkan.

## Development Scripts

Folder `scripts/` berisi tooling development, audit, dan testing,
termasuk audit notification/order, backfill notification order ID, flash
sale checks, advisory lock tests, recipient audit, dan Web Push delivery
test.

Script diagnostic tidak otomatis dianggap bagian dari production
workflow. Tinjau statusnya sebelum di-commit.

## Development Guidelines

1.  Jangan mengubah database production secara manual tanpa migration.
2.  Gunakan `prisma migrate dev` untuk perubahan schema di development.
3.  Gunakan `prisma migrate deploy` di production.
4.  Jalankan type check sebelum push.
5.  Periksa `git status` sebelum staging.
6.  Stage hanya file yang memang terkait dengan perubahan.
7.  Buat checkpoint setelah fitur besar berhasil diuji.

## Status

Subsystem utama yang telah dikembangkan meliputi authentication, product
management, product variants, SKU, stock ledger, cart, wishlist,
voucher, discount, promotion, flash sale, order, payment, notification,
user-scoped notification, notification-to-order relationship, Web Push,
dan custom 404.

Web Push telah diuji dan browser berhasil menampilkan popup
notification.

## Future Development

-   Automated test coverage
-   End-to-end testing
-   Notification preferences
-   Web Push delivery monitoring
-   Notification retention/cleanup
-   Observability dan logging
-   Performance optimization
-   Security audit berkala
-   Backup dan database recovery
-   Production hardening

## License

Private / Proprietary.

Project ini bukan open-source. Penggunaan, distribusi, atau reproduksi
kode memerlukan izin dari pemilik project.
