# Instalasi Windows — Fish Market Platform / Pisjo Market

Panduan ini menyiapkan lingkungan pengembangan Windows baru sampai aplikasi lokal berjalan. Ditulis untuk branch `ci/linux-production-build` dan berdasarkan konfigurasi yang sudah terkonfirmasi: Next.js 16.2.12, Node.js 24.11.0, pnpm, Prisma 6.19.0, serta PostgreSQL 16.

> **Batas verifikasi.** Source repository tidak tersedia saat dokumen ini disusun. Perintah Prisma, nama database, lokasi migration, dan seed di bawah telah terkonfirmasi dari konteks proyek. Script `package.json`, isi `README.md` lengkap, daftar environment variable, serta isi `prisma/seed.ts` harus diverifikasi di checkout Anda sebelum digunakan. Bagian yang memerlukannya diberi label **Verifikasi repository**.

## 1. Target lingkungan

| Komponen | Target |
| --- | --- |
| OS | Windows 10/11 64-bit |
| Git | versi terbaru yang tersedia untuk Windows |
| Node.js | 24 LTS (terkonfirmasi pernah dipakai: `v24.11.0`) |
| pnpm | 12 (sesuaikan versi tepat dari `packageManager` di `package.json`) |
| PostgreSQL | 16 (CI memakai image `postgres:16`) |
| Database lokal | `fish_market` |
| Host / port | `localhost:5432` |
| Branch | `ci/linux-production-build` |

Gunakan PowerShell untuk administrasi Windows/PostgreSQL dan Git Bash untuk Git serta command project. Semua command di bawah bersifat copy-paste friendly untuk shell yang ditandai.

## 2. Prasyarat

Install terlebih dahulu:

1. **Git for Windows** — pilih opsi agar Git bisa digunakan dari command line.
2. **Node.js 24 LTS** — tutup lalu buka kembali terminal setelah instalasi.
3. **pnpm 12** — gunakan Corepack (bawaan Node modern).
4. **PostgreSQL 16 for Windows** — sertakan command-line tools; pgAdmin opsional.

### Verifikasi Git, Node, dan pnpm

Jalankan di **PowerShell**:

```powershell
git --version
node --version
corepack enable
corepack prepare pnpm@12 --activate
pnpm --version
```

Node harus melaporkan major version `24`. Setelah repository sudah di-clone, cek juga field `packageManager` agar versi pnpm tidak bertentangan dengan project:

```bash
node -p "require('./package.json').packageManager"
```

Jika field tersebut menyatakan versi lain, aktifkan versi itu dengan Corepack, misalnya `corepack prepare pnpm@12.x.x --activate`.

## 3. Clone repository dan pilih branch

Di **Git Bash**, pilih lokasi kerja yang Anda inginkan (contoh `D:/Projects`), lalu gunakan URL remote proyek yang benar. Jangan menyalin placeholder URL secara harfiah.

```bash
cd /d/Projects
git clone <URL-REPOSITORY-ANDA> fish-market-platform
cd fish-market-platform
git fetch origin
git switch --track origin/ci/linux-production-build
git status --short --branch
```

Jika branch lokal tersebut sudah ada, gunakan:

```bash
git switch ci/linux-production-build
git pull --ff-only origin ci/linux-production-build
```

`git status --short --branch` seharusnya tidak menampilkan perubahan lokal pada checkout baru. Bila Anda melanjutkan pekerjaan yang sudah ada, jangan menjalankan `git reset`, `git clean`, atau `git restore` sebelum perubahan tersebut diaudit/dicadangkan.

## 4. Pasang dependency dan generate Prisma Client

Di root project, jalankan di **Git Bash**:

```bash
pnpm install
pnpm prisma generate
pnpm prisma --version
```

Hasil `pnpm prisma --version` pada environment yang sebelumnya berhasil menunjukkan Prisma dan `@prisma/client` `6.19.0`, binary target `windows`, serta Node `v24.11.0`.

> Jalankan `pnpm prisma generate` setiap kali `node_modules` dipasang ulang atau `prisma/schema.prisma` berubah. Tanpa langkah ini, TypeScript dapat menampilkan error seperti `OrderStatus`, `Role`, atau `Prisma.Decimal` tidak diekspor oleh `@prisma/client`.

## 5. Instal dan siapkan PostgreSQL 16

Saat installer PostgreSQL 16 meminta konfigurasi, gunakan port `5432` dan user administrator database `postgres`. Gunakan password lokal yang kuat. Password tersebut harus cocok dengan password yang dipakai oleh `DATABASE_URL` lokal, tetapi **jangan pernah masukkan password production ke `.env` development**.

PostgreSQL biasanya berjalan sebagai Windows Service `postgresql-x64-16`.

Di **PowerShell sebagai Administrator**, periksa atau nyalakan servicenya:

```powershell
Get-Service postgresql-x64-16 | Select-Object Name, Status, StartType
Start-Service postgresql-x64-16
Set-Service postgresql-x64-16 -StartupType Automatic
```

`Start-Service` akan gagal bila service sudah berjalan; itu bukan masalah. Verifikasi port dan executable tanpa bergantung pada PATH:

```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" --version
& "C:\Program Files\PostgreSQL\16\bin\pg_isready.exe" -h localhost -p 5432
```

Targetnya adalah `psql (PostgreSQL) 16.x` dan `localhost:5432 - accepting connections`.

### Tambahkan PostgreSQL ke PATH (opsional, direkomendasikan)

Tambahkan folder berikut ke **User Path** melalui *Environment Variables* Windows, lalu buka terminal baru:

```text
C:\Program Files\PostgreSQL\16\bin
```

Untuk sesi PowerShell saat ini saja:

```powershell
$env:Path += ";C:\Program Files\PostgreSQL\16\bin"
psql --version
pg_isready -h localhost -p 5432
```

Pada Git Bash, tutup dan buka ulang setelah PATH Windows diperbarui. Alternatif yang selalu aman adalah menjalankan executable dengan path lengkap dari PowerShell seperti contoh sebelumnya.

## 6. Buat database lokal

Sebelum membuat database baru, pastikan tidak ada backup development yang seharusnya direstore. Membuat database baru cocok untuk environment baru tanpa data lokal yang perlu dipertahankan.

Lihat daftar database di **PowerShell**:

```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -p 5432 -l
```

Jika `fish_market` belum ada, buat:

```powershell
& "C:\Program Files\PostgreSQL\16\bin\createdb.exe" -U postgres -h localhost -p 5432 fish_market
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -p 5432 -l
```

Jika database sudah ada dan berisi data yang ingin dipertahankan, **jangan** hapus, `db push`, atau membuat ulang database. Periksa status migration lebih dulu di bagian 8.

## 7. Konfigurasi `.env` secara aman

Repository sebelumnya memakai `prisma.config.ts` yang memuat `dotenv/config`, lalu mengambil `DATABASE_URL`. Template yang terdeteksi menunjuk ke PostgreSQL lokal dengan database `fish_market`.

**Verifikasi repository:** lihat template dan daftar variabel yang dibutuhkan tanpa membagikan nilainya:

```bash
test -f .env.example && sed -n '1,220p' .env.example
sed -n '1,120p' prisma.config.ts
```

Buat `.env` dari template bila memang template tersedia:

```bash
cp .env.example .env
```

Isi `DATABASE_URL` lokal dengan format berikut (ganti placeholder hanya di komputer Anda):

```dotenv
DATABASE_URL="postgresql://postgres:<PASSWORD_URL_ENCODED>@localhost:5432/fish_market"
```

Password yang mengandung karakter URL-reserved harus di-*URL encode*. Contoh: `@` menjadi `%40`, `#` menjadi `%23`, dan `%` menjadi `%25`. Jangan menebak format variabel lain; salin nama variabel dari `.env.example` dan gunakan credential development yang terpisah dari production.

Cara memeriksa target koneksi tanpa menampilkan password di chat/log:

```bash
grep -n '^DATABASE_URL=' .env
```

Saat membagikan output, sensor bagian password, misalnya `postgresql://postgres:***@localhost:5432/fish_market`.

Jika password user PostgreSQL perlu disamakan dengan `.env`, masuk ke psql secara lokal lalu ubah tanpa membagikan nilainya:

```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -p 5432
```

```sql
ALTER USER postgres WITH PASSWORD '<PASSWORD_YANG_SAMA_DENGAN_ENV>';
\q
```

## 8. Verifikasi koneksi dan terapkan migration

Di **Git Bash**, dari root project:

```bash
pnpm prisma migrate status
```

Koneksi yang sehat akan menyebut datasource PostgreSQL `fish_market` di `localhost:5432`. Pada database baru, pernah terdeteksi **68 migration** belum diterapkan, termasuk migration terbaru yang terlihat pada saat itu:

```text
20260908173940_add_global_seo_settings
20260909232012_add_changelog
```

Untuk database lokal baru yang memang kosong, terapkan migration version-controlled:

```bash
pnpm prisma migrate deploy
pnpm prisma migrate status
```

Gunakan `migrate deploy` di sini karena tujuannya menerapkan migration yang sudah berada di repository, bukan membuat migration baru. Jangan gunakan command berikut sebagai pengganti tanpa kebutuhan yang jelas:

```bash
# Jangan jalankan pada setup awal yang mengikuti migration repository:
# pnpm prisma migrate dev
# pnpm prisma db push
```

Jika ada migration yang gagal, hentikan proses dan simpan outputnya. Jangan menghapus database atau tabel sebagai respons pertama, terutama bila database mungkin menyimpan data yang penting.

## 9. Seed data — verifikasi sebelum menjalankan

Konfigurasi Prisma yang pernah diperiksa mendeklarasikan seed:

```ts
migrations: {
  path: "prisma/migrations",
  seed: "tsx prisma/seed.ts",
}
```

Selain itu, commit changelog yang terdeteksi menambahkan `scripts/seed-changelog.ts`. Ini **tidak membuktikan** bahwa seluruh seed aman diulang atau bahwa seed changelog harus selalu dijalankan.

Sebelum seed, lakukan verifikasi ini di Git Bash:

```bash
test -f prisma/seed.ts && sed -n '1,260p' prisma/seed.ts
test -f scripts/seed-changelog.ts && sed -n '1,260p' scripts/seed-changelog.ts
node -p "require('./package.json').scripts"
```

Periksa khususnya apakah seed membuat admin default, data katalog demo, upsert idempoten, menghapus data, atau membutuhkan environment variable tambahan. Jalankan seed hanya pada database local/development yang memang boleh diisi ulang.

Jika `prisma/seed.ts` ada dan auditnya menyatakan aman, jalankan:

```bash
pnpm prisma db seed
```

Jika `package.json` menyediakan script seed khusus, gunakan nama script itu **hanya setelah diverifikasi**. Jangan menjalankan `scripts/seed-changelog.ts` hanya karena file tersebut ada; periksa dokumentasi/script project untuk command yang tepat dan dampak datanya.

## 10. Jalankan aplikasi lokal

Di **Git Bash**:

```bash
pnpm dev
```

Buka URL yang dicetak terminal (umumnya `http://localhost:3000`; verifikasi dari output). Jika halaman memunculkan `PrismaClientInitializationError` ketika memuat data seperti Flash Sale, itu biasanya berarti database belum dapat dihubungi — periksa bagian troubleshooting, bukan file repository yang disebut stack trace.

Hentikan server dengan `Ctrl+C` setelah pengujian.

## 11. Validasi sebelum mulai bekerja atau membuat perubahan

Jalankan dari root project:

```bash
pnpm exec tsc --noEmit
git diff --check
```

Untuk build production, **verifikasi repository** dahulu apakah `package.json` memiliki script `build`. Salah satu command berikut yang sesuai dengan script Anda dapat digunakan:

```bash
pnpm build
# atau, bila memang tidak ada wrapper script build:
pnpm exec next build
```

Dalam konteks project sebelumnya, `pnpm exec tsc --noEmit` pernah lulus setelah Prisma Client di-generate, dan `pnpm exec next build` menjadi validasi yang direncanakan. Build dapat membutuhkan semua environment variable server-side yang dipakai aplikasi; jangan mengganti nilai production hanya untuk membuat build lokal lolos.

Tambahan pemeriksaan baseline:

```bash
git status --short --branch
pnpm prisma migrate status
```

`git diff --check` idealnya tidak mengeluarkan error. Peringatan Windows `LF will be replaced by CRLF` perlu dibedakan dari error whitespace nyata.

## 12. Troubleshooting

### `P1001: Can't reach database server at localhost:5432`

Artinya Prisma tidak dapat menjangkau server, bukan otomatis bug di query yang muncul pada stack trace.

Di PowerShell:

```powershell
Get-Service postgresql-x64-16 | Select-Object Name, Status, StartType
& "C:\Program Files\PostgreSQL\16\bin\pg_isready.exe" -h localhost -p 5432
```

Nyalakan service bila statusnya `Stopped`, lalu pastikan `.env` memang menunjuk ke `localhost:5432` bila targetnya database lokal.

### `P1000: Authentication failed`

Server dapat dijangkau, tetapi user/password di `DATABASE_URL` tidak cocok. Bandingkan host, port, user, dan nama database tanpa menampilkan password. Pastikan password URL-encoded bila mengandung karakter khusus. Jika perlu, ubah password user `postgres` secara lokal melalui `ALTER USER` seperti di bagian 7, lalu ulangi:

```bash
pnpm prisma migrate status
```

### `psql` atau `pg_isready`: command not found

PostgreSQL mungkin sudah terpasang tetapi folder bin belum masuk PATH. Gunakan path lengkap di PowerShell:

```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" --version
```

Kemudian tambahkan `C:\Program Files\PostgreSQL\16\bin` ke User Path dan buka terminal baru.

### Prisma Client belum generated / export `@prisma/client` hilang

Setelah `pnpm install`, perubahan schema, atau pemasangan ulang `node_modules`:

```bash
pnpm prisma generate
pnpm exec tsc --noEmit
```

Jangan mengedit puluhan import TypeScript sebelum memastikan Prisma Client sudah dibuat ulang.

### Error Windows ACL / `node_modules` rusak atau terkunci

Tutup dev server, editor yang sedang mengunci file, dan terminal lain yang memakai project. Hindari menghapus dependency secara membabi buta pada working tree yang memiliki perubahan penting. Setelah memastikan perubahan source aman dan proses Node berhenti, pasang ulang dependency:

```bash
pnpm install
pnpm prisma generate
```

Jika penghapusan `node_modules` benar-benar diperlukan, lakukan hanya setelah mengaudit status Git dan gunakan folder project yang tepat. Jangan memakai perintah destruktif pada folder induk yang luas.

### `Prisma config detected, skipping environment variable loading`

Pesan ini normal pada project yang memakai `prisma.config.ts`. Konfigurasi yang terverifikasi mengimpor `dotenv/config`; pastikan `DATABASE_URL` ada di `.env` dan jalankan command dari root repository agar file konfigurasi dan `.env` ditemukan.

### Migration sudah ada, tetapi database tidak kosong

Jangan langsung menjalankan `migrate deploy` berulang, `migrate dev`, atau `db push`. Jalankan `pnpm prisma migrate status`, catat hasilnya, lalu tentukan apakah database harus direstore dari backup atau diselaraskan melalui prosedur migration tim.

## 13. Catatan deployment / production

- `DATABASE_URL=localhost` hanya cocok untuk development lokal. Production harus menggunakan endpoint database production yang terkelola dan secret production yang berbeda.
- CI yang terdeteksi menggunakan PostgreSQL 16 dengan database sementara `ci` di `127.0.0.1:5432`; credential CI bukan credential untuk `.env` lokal atau production.
- Jalankan `pnpm prisma migrate deploy` terhadap production hanya melalui proses deployment yang disetujui dan setelah backup serta review migration. Jangan menggunakan `db push` untuk menggantikan migration production.
- Jangan commit `.env`, password database, token, API key, credential email/payment, atau dump database. Pastikan `.env` tercantum di `.gitignore`.
- Perubahan yang belum di-commit pada branch lama dapat mencakup feature shipping `PICKUP`, footer/changelog, atau pekerjaan lain. Audit dengan `git status`, `git diff`, dan `git diff --check` sebelum pull, restore, atau cleanup.
- Riwayat yang terlihat menunjukkan commit changelog `1602d70` berada pada `ci/linux-production-build`; verifikasi ulang hash dan branch aktual Anda sebelum membuat keputusan deployment.

## 14. Checklist akhir

- [ ] Git, Node 24 LTS, Corepack/pnpm, dan PostgreSQL 16 terpasang.
- [ ] PostgreSQL service `postgresql-x64-16` berjalan dan port `5432` menerima koneksi.
- [ ] `psql --version` menampilkan PostgreSQL 16 (PATH atau path lengkap berfungsi).
- [ ] Repository di-clone dan berada di branch `ci/linux-production-build` yang benar.
- [ ] `pnpm install` dan `pnpm prisma generate` berhasil.
- [ ] `.env` dibuat dari template yang diverifikasi; tidak ada secret yang dibagikan atau di-commit.
- [ ] `DATABASE_URL` mengarah ke database local yang benar: `fish_market` pada `localhost:5432`.
- [ ] `pnpm prisma migrate status` dapat terkoneksi tanpa P1000/P1001.
- [ ] Database baru menerapkan migration dengan `pnpm prisma migrate deploy` dan status diperiksa ulang.
- [ ] Seed hanya dijalankan setelah isi/dampaknya diverifikasi.
- [ ] `pnpm dev` menjalankan aplikasi dan halaman lokal dapat dibuka.
- [ ] `pnpm exec tsc --noEmit` dan `git diff --check` lulus.
- [ ] Build yang sesuai script repository telah dicoba bila semua environment variable build tersedia.
- [ ] Tidak ada `.env`, secret, atau perubahan lokal penting yang terhapus/tercommit tanpa audit.
