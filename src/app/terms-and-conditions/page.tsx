import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Syarat dan Ketentuan",
  description:
    "Syarat dan Ketentuan penggunaan layanan Pisjo Market.",
};

const sections = [
  {
    id: "ketentuan-umum",
    title: "Ketentuan Umum",
  },
  {
    id: "definisi",
    title: "Definisi",
  },
  {
    id: "akun",
    title: "Akun Pengguna",
  },
  {
    id: "penggunaan-layanan",
    title: "Penggunaan Layanan",
  },
  {
    id: "produk",
    title: "Produk dan Ketersediaan",
  },
  {
    id: "harga",
    title: "Harga dan Informasi Produk",
  },
  {
    id: "pesanan",
    title: "Pesanan",
  },
  {
    id: "pembayaran",
    title: "Pembayaran",
  },
  {
    id: "voucher-promo",
    title: "Voucher dan Promosi",
  },
  {
    id: "pengiriman",
    title: "Pengiriman",
  },
  {
    id: "pembatalan",
    title: "Pembatalan dan Pengembalian Dana",
  },
  {
    id: "kualitas",
    title: "Produk Segar dan Kondisi Produk",
  },
  {
    id: "larangan",
    title: "Larangan Penggunaan",
  },
  {
    id: "hak-pisjo",
    title: "Hak Pisjo Market",
  },
  {
    id: "hak-pengguna",
    title: "Hak dan Tanggung Jawab Pengguna",
  },
  {
    id: "privasi",
    title: "Data Pribadi dan Privasi",
  },
  {
    id: "gangguan",
    title: "Gangguan Layanan",
  },
  {
    id: "batas-tanggung-jawab",
    title: "Batas Tanggung Jawab",
  },
  {
    id: "perubahan",
    title: "Perubahan Syarat dan Ketentuan",
  },
  {
    id: "hukum",
    title: "Hukum yang Berlaku",
  },
  {
    id: "kontak",
    title: "Kontak",
  },
];

export default function TermsAndConditionsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* HERO */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-sm font-medium text-cyan-700">
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 3h12v18H6z" />
                <path d="M9 7h6" />
                <path d="M9 11h6" />
                <path d="M9 15h4" />
              </svg>

              Syarat dan Ketentuan
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Aturan penggunaan Pisjo Market.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Syarat dan Ketentuan ini mengatur penggunaan layanan,
              pemesanan produk, pembayaran, pengiriman, promosi, dan
              hubungan antara Pisjo Market dengan pengguna.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-500">
              <span className="rounded-lg bg-slate-100 px-3 py-2">
                Berlaku sejak 29 Agustus 2026
              </span>

              <span className="rounded-lg bg-slate-100 px-3 py-2">
                Bahasa Indonesia
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* TABLE OF CONTENTS */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-4 text-sm font-semibold text-slate-900">
                Daftar Isi
              </p>

              <nav className="space-y-1">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block rounded-lg px-3 py-2 text-sm leading-5 text-slate-600 transition hover:bg-cyan-50 hover:text-cyan-700"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* TERMS */}
          <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
            <div className="prose prose-slate max-w-none">
              {/* 01 */}
              <section id="ketentuan-umum" className="scroll-mt-8">
                <SectionHeading
                  number="01"
                  title="Ketentuan Umum"
                />

                <p>
                  Selamat datang di Pisjo Market. Syarat dan Ketentuan ini
                  berlaku bagi setiap orang yang mengakses, mendaftar,
                  melakukan pembelian, atau menggunakan layanan Pisjo Market.
                </p>

                <p>
                  Dengan membuat akun atau menggunakan layanan Pisjo Market,
                  Anda menyatakan telah membaca, memahami, dan menyetujui
                  Syarat dan Ketentuan ini.
                </p>

                <p>
                  Apabila Anda tidak menyetujui sebagian atau seluruh
                  ketentuan ini, Anda tidak diperkenankan menggunakan layanan
                  yang terkait dengan ketentuan tersebut.
                </p>

                <InfoBox>
                  Syarat dan Ketentuan ini harus dibaca bersama dengan
                  Kebijakan Privasi Pisjo Market. Ketentuan mengenai
                  pemrosesan Data Pribadi diatur lebih lanjut dalam Kebijakan
                  Privasi.
                </InfoBox>
              </section>

              <Divider />

              {/* 02 */}
              <section id="definisi" className="scroll-mt-8">
                <SectionHeading number="02" title="Definisi" />

                <p>
                  Dalam Syarat dan Ketentuan ini:
                </p>

                <ul>
                  <li>
                    <strong>“Pisjo Market”</strong> berarti layanan
                    perdagangan elektronik yang dioperasikan dengan nama
                    Pisjo Market.
                  </li>

                  <li>
                    <strong>“Pengguna”</strong> berarti setiap orang yang
                    mengakses atau menggunakan layanan Pisjo Market.
                  </li>

                  <li>
                    <strong>“Akun”</strong> berarti akun pengguna yang
                    dibuat untuk mengakses fitur tertentu dalam layanan.
                  </li>

                  <li>
                    <strong>“Produk”</strong> berarti barang yang ditawarkan
                    melalui Pisjo Market.
                  </li>

                  <li>
                    <strong>“Pesanan”</strong> berarti permintaan pembelian
                    Produk yang dibuat oleh Pengguna melalui sistem Pisjo
                    Market.
                  </li>

                  <li>
                    <strong>“Voucher”</strong> berarti kode atau manfaat
                    promosi yang dapat digunakan berdasarkan syarat yang
                    ditentukan.
                  </li>

                  <li>
                    <strong>“Layanan”</strong> berarti website, aplikasi,
                    sistem, fitur, dan layanan lain yang disediakan oleh
                    Pisjo Market.
                  </li>
                </ul>
              </section>

              <Divider />

              {/* 03 */}
              <section id="akun" className="scroll-mt-8">
                <SectionHeading number="03" title="Akun Pengguna" />

                <p>
                  Beberapa fitur Pisjo Market memerlukan Pengguna untuk
                  membuat akun.
                </p>

                <p>
                  Pengguna bertanggung jawab untuk memberikan informasi yang
                  benar, lengkap, dan dapat dipertanggungjawabkan ketika
                  membuat akun.
                </p>

                <p>
                  Pengguna juga bertanggung jawab menjaga kerahasiaan
                  kredensial akun dan aktivitas yang dilakukan menggunakan
                  akun tersebut.
                </p>

                <p>
                  Pengguna wajib segera menghubungi Pisjo Market apabila
                  mengetahui atau mencurigai adanya akses tidak sah terhadap
                  akun.
                </p>

                <p>
                  Satu akun tidak boleh digunakan untuk melakukan aktivitas
                  yang melanggar hukum, melakukan penipuan, mengganggu
                  layanan, atau merugikan pengguna lain.
                </p>
              </section>

              <Divider />

              {/* 04 */}
              <section id="penggunaan-layanan" className="scroll-mt-8">
                <SectionHeading
                  number="04"
                  title="Penggunaan Layanan"
                />

                <p>
                  Pengguna wajib menggunakan layanan Pisjo Market secara
                  wajar, sesuai fungsi yang tersedia, dan sesuai dengan
                  peraturan perundang-undangan yang berlaku.
                </p>

                <p>
                  Pengguna dilarang menggunakan layanan untuk:
                </p>

                <ul>
                  <li>
                    melakukan tindakan yang melanggar hukum;
                  </li>
                  <li>
                    melakukan penipuan atau manipulasi transaksi;
                  </li>
                  <li>
                    memperoleh manfaat promosi dengan cara yang tidak sah;
                  </li>
                  <li>
                    mengganggu keamanan atau operasional sistem;
                  </li>
                  <li>
                    mengakses akun atau data pengguna lain tanpa izin;
                  </li>
                  <li>
                    menggunakan bot, script, crawler, atau metode otomatis
                    yang mengganggu layanan tanpa izin; atau
                  </li>
                  <li>
                    melakukan aktivitas lain yang dapat merugikan Pisjo
                    Market atau pihak lain.
                  </li>
                </ul>
              </section>

              <Divider />

              {/* 05 */}
              <section id="produk" className="scroll-mt-8">
                <SectionHeading
                  number="05"
                  title="Produk dan Ketersediaan"
                />

                <p>
                  Pisjo Market berupaya menampilkan informasi Produk secara
                  akurat, termasuk nama, gambar, deskripsi, pilihan berat atau
                  varian, harga, dan ketersediaan.
                </p>

                <p>
                  Namun, Produk tertentu dapat memiliki karakteristik alami,
                  terutama Produk segar, sehingga ukuran, berat, warna,
                  bentuk, dan kondisi dapat mengalami variasi yang wajar.
                </p>

                <p>
                  Ketersediaan Produk dapat berubah sewaktu-waktu berdasarkan
                  kondisi stok.
                </p>

                <p>
                  Produk yang ditambahkan ke keranjang belum tentu berarti
                  Produk tersebut telah dipesan atau dijamin tersedia sampai
                  Pesanan berhasil dibuat dan diproses oleh sistem.
                </p>
              </section>

              <Divider />

              {/* 06 */}
              <section id="harga" className="scroll-mt-8">
                <SectionHeading
                  number="06"
                  title="Harga dan Informasi Produk"
                />

                <p>
                  Harga Produk yang berlaku adalah harga yang ditampilkan
                  dalam sistem pada saat Pesanan dibuat, kecuali dinyatakan
                  lain.
                </p>

                <p>
                  Harga dapat berubah dari waktu ke waktu karena perubahan
                  stok, promosi, biaya operasional, atau faktor bisnis
                  lainnya.
                </p>

                <p>
                  Apabila terdapat kesalahan informasi harga atau Produk yang
                  disebabkan oleh kesalahan teknis atau administratif,
                  Pisjo Market akan berupaya melakukan koreksi dan
                  memberitahukan Pengguna apabila koreksi tersebut
                  memengaruhi Pesanan.
                </p>
              </section>

              <Divider />

              {/* 07 */}
              <section id="pesanan" className="scroll-mt-8">
                <SectionHeading number="07" title="Pesanan" />

                <p>
                  Pesanan dibuat ketika Pengguna menyelesaikan proses
                  checkout dan sistem menerima data Pesanan.
                </p>

                <p>
                  Setiap Pesanan dapat memiliki nomor Pesanan, daftar Produk,
                  jumlah, pilihan berat atau varian, harga, biaya pengiriman,
                  potongan harga, Voucher, serta informasi lain yang relevan.
                </p>

                <p>
                  Setelah Pesanan dibuat, Pengguna bertanggung jawab
                  memastikan informasi Pesanan, terutama Produk, jumlah,
                  alamat, dan metode pembayaran, telah sesuai.
                </p>

                <p>
                  Pembuatan Pesanan tidak selalu berarti Pesanan langsung
                  dikirim. Pesanan dapat melalui proses verifikasi,
                  pembayaran, persiapan, dan pengiriman.
                </p>

                <InfoBox>
                  Untuk Produk segar, proses pemenuhan Pesanan dapat
                  bergantung pada ketersediaan stok dan kondisi Produk pada
                  saat Pesanan diproses.
                </InfoBox>
              </section>

              <Divider />

              {/* 08 */}
              <section id="pembayaran" className="scroll-mt-8">
                <SectionHeading number="08" title="Pembayaran" />

                <p>
                  Pengguna wajib melakukan pembayaran sesuai metode
                  pembayaran yang tersedia pada saat checkout.
                </p>

                <p>
                  Status Pesanan dapat bergantung pada keberhasilan
                  pembayaran dan verifikasi pembayaran.
                </p>

                <p>
                  Apabila Pengguna diminta mengunggah bukti pembayaran,
                  Pengguna wajib memberikan bukti yang benar dan tidak
                  dimanipulasi.
                </p>

                <p>
                  Penggunaan metode pembayaran pihak ketiga dapat tunduk pada
                  syarat dan ketentuan penyedia pembayaran tersebut.
                </p>

                <p>
                  Pisjo Market tidak bertanggung jawab atas gangguan pada
                  sistem pembayaran pihak ketiga yang berada di luar kendali
                  wajar Pisjo Market.
                </p>
              </section>

              <Divider />

              {/* 09 */}
              <section id="voucher-promo" className="scroll-mt-8">
                <SectionHeading
                  number="09"
                  title="Voucher dan Promosi"
                />

                <p>
                  Pisjo Market dapat menyediakan Voucher, diskon, promotion,
                  flash sale, atau program promosi lainnya.
                </p>

                <p>
                  Setiap promosi dapat memiliki syarat khusus seperti periode
                  berlaku, minimum transaksi, Produk tertentu, batas
                  penggunaan, kuota, atau ketentuan pengguna tertentu.
                </p>

                <p>
                  Pengguna wajib menggunakan Voucher dan manfaat promosi
                  sesuai ketentuan yang berlaku.
                </p>

                <p>
                  Penggunaan Voucher dengan cara yang melanggar ketentuan,
                  termasuk manipulasi sistem atau penyalahgunaan akun, dapat
                  menyebabkan manfaat promosi dibatalkan dan, apabila
                  diperlukan, Pesanan ditinjau kembali.
                </p>

                <p>
                  Ketentuan khusus yang ditampilkan pada suatu Voucher atau
                  promosi merupakan bagian dari ketentuan penggunaan Voucher
                  atau promosi tersebut.
                </p>
              </section>

              <Divider />

              {/* 10 */}
              <section id="pengiriman" className="scroll-mt-8">
                <SectionHeading
                  number="10"
                  title="Pengiriman"
                />

                <p>
                  Pisjo Market akan memproses pengiriman sesuai alamat dan
                  informasi pengiriman yang diberikan Pengguna.
                </p>

                <p>
                  Pengguna bertanggung jawab memastikan alamat, nomor telepon,
                  nama penerima, dan informasi pengiriman lainnya benar dan
                  dapat digunakan untuk proses pengiriman.
                </p>

                <p>
                  Estimasi pengiriman merupakan perkiraan dan dapat berubah
                  karena kondisi lalu lintas, cuaca, ketersediaan Produk,
                  kondisi operasional, alamat tujuan, atau keadaan lain di
                  luar kendali wajar Pisjo Market.
                </p>

                <p>
                  Apabila Pengguna memberikan alamat atau informasi penerima
                  yang tidak benar sehingga Pesanan tidak dapat dikirim,
                  Pengguna dapat dikenakan konsekuensi yang wajar sesuai
                  kondisi Pesanan.
                </p>
              </section>

              <Divider />

              {/* 11 */}
              <section id="pembatalan" className="scroll-mt-8">
                <SectionHeading
                  number="11"
                  title="Pembatalan dan Pengembalian Dana"
                />

                <p>
                  Pembatalan Pesanan dapat dilakukan sesuai status Pesanan,
                  kebijakan operasional, dan kondisi Produk.
                </p>

                <p>
                  Tidak semua Pesanan dapat dibatalkan setelah memasuki tahap
                  tertentu dalam proses pemenuhan.
                </p>

                <p>
                  Apabila Pesanan memenuhi kondisi untuk pengembalian dana,
                  proses refund dilakukan sesuai metode dan prosedur yang
                  berlaku untuk transaksi tersebut.
                </p>

                <p>
                  Waktu dana diterima kembali dapat bergantung pada metode
                  pembayaran dan proses penyedia pembayaran yang digunakan.
                </p>

                <p>
                  Apabila sebagian Produk dalam Pesanan bermasalah, bentuk
                  penyelesaian dapat berupa penggantian, pengembalian dana
                  sebagian, atau penyelesaian lain yang disepakati sesuai
                  kondisi kasus.
                </p>
              </section>

              <Divider />

              {/* 12 */}
              <section id="kualitas" className="scroll-mt-8">
                <SectionHeading
                  number="12"
                  title="Produk Segar dan Kondisi Produk"
                />

                <p>
                  Produk segar memiliki karakteristik alami yang dapat
                  menyebabkan variasi dalam ukuran, berat, bentuk, warna, dan
                  kondisi.
                </p>

                <p>
                  Pisjo Market berupaya menyediakan Produk sesuai standar
                  kualitas yang ditetapkan dalam operasionalnya.
                </p>

                <p>
                  Apabila Pengguna menerima Produk yang dianggap tidak sesuai,
                  Pengguna sebaiknya segera menghubungi Pisjo Market melalui
                  kanal layanan yang tersedia dan memberikan informasi yang
                  diperlukan untuk pemeriksaan.
                </p>

                <p>
                  Untuk membantu proses pemeriksaan, Pengguna dapat diminta
                  memberikan foto, video, informasi Pesanan, atau informasi
                  lain yang relevan.
                </p>
              </section>

              <Divider />

              {/* 13 */}
              <section id="larangan" className="scroll-mt-8">
                <SectionHeading
                  number="13"
                  title="Larangan Penggunaan"
                />

                <p>
                  Tanpa mengurangi ketentuan lain dalam Syarat dan Ketentuan
                  ini, Pengguna dilarang:
                </p>

                <ul>
                  <li>
                    memberikan informasi palsu dalam proses transaksi;
                  </li>
                  <li>
                    menggunakan akun orang lain tanpa izin;
                  </li>
                  <li>
                    mencoba memperoleh akses ke sistem atau data yang tidak
                    menjadi haknya;
                  </li>
                  <li>
                    memanipulasi harga, stok, promosi, Voucher, atau status
                    transaksi;
                  </li>
                  <li>
                    melakukan aktivitas yang mengganggu keamanan sistem;
                  </li>
                  <li>
                    melakukan reverse engineering atau mencoba mengeksploitasi
                    kerentanan sistem secara tidak sah;
                  </li>
                  <li>
                    menggunakan layanan untuk kegiatan penipuan atau
                    kejahatan; atau
                  </li>
                  <li>
                    melakukan tindakan lain yang melanggar hukum atau
                    merugikan pihak lain.
                  </li>
                </ul>
              </section>

              <Divider />

              {/* 14 */}
              <section id="hak-pisjo" className="scroll-mt-8">
                <SectionHeading
                  number="14"
                  title="Hak Pisjo Market"
                />

                <p>
                  Dengan tetap memperhatikan hak Pengguna berdasarkan
                  peraturan perundang-undangan, Pisjo Market dapat mengambil
                  tindakan yang wajar untuk menjaga keamanan dan keberlanjutan
                  layanan.
                </p>

                <p>
                  Tindakan tersebut dapat mencakup:
                </p>

                <ul>
                  <li>
                    menolak atau menunda pemrosesan Pesanan tertentu apabila
                    terdapat alasan yang wajar;
                  </li>
                  <li>
                    membatasi akses terhadap fitur yang disalahgunakan;
                  </li>
                  <li>
                    membatalkan manfaat Voucher atau promosi yang diperoleh
                    melalui penyalahgunaan;
                  </li>
                  <li>
                    melakukan pemeriksaan terhadap transaksi yang mencurigakan;
                    atau
                  </li>
                  <li>
                    menangguhkan atau menutup akun apabila terdapat pelanggaran
                    material terhadap ketentuan ini atau peraturan yang
                    berlaku.
                  </li>
                </ul>

                <p>
                  Apabila suatu tindakan memengaruhi hak Pengguna atau
                  Pesanan, Pisjo Market akan berupaya memberikan informasi
                  sesuai kondisi dan ketentuan yang berlaku.
                </p>
              </section>

              <Divider />

              {/* 15 */}
              <section id="hak-pengguna" className="scroll-mt-8">
                <SectionHeading
                  number="15"
                  title="Hak dan Tanggung Jawab Pengguna"
                />

                <p>
                  Pengguna berhak menggunakan layanan sesuai fungsi yang
                  tersedia, menerima informasi transaksi yang relevan, serta
                  memperoleh layanan sesuai ketentuan yang berlaku.
                </p>

                <p>
                  Pengguna juga bertanggung jawab:
                </p>

                <ul>
                  <li>
                    memberikan informasi transaksi yang benar;
                  </li>
                  <li>
                    menjaga keamanan akun;
                  </li>
                  <li>
                    memastikan alamat pengiriman benar;
                  </li>
                  <li>
                    melakukan pembayaran sesuai ketentuan;
                  </li>
                  <li>
                    menggunakan promosi secara wajar;
                  </li>
                  <li>
                    memeriksa Pesanan sebelum menyelesaikan checkout; dan
                  </li>
                  <li>
                    mematuhi Syarat dan Ketentuan serta hukum yang berlaku.
                  </li>
                </ul>
              </section>

              <Divider />

              {/* 16 */}
              <section id="privasi" className="scroll-mt-8">
                <SectionHeading
                  number="16"
                  title="Data Pribadi dan Privasi"
                />

                <p>
                  Penggunaan layanan Pisjo Market dapat melibatkan pemrosesan
                  Data Pribadi Pengguna.
                </p>

                <p>
                  Pemrosesan tersebut dilakukan sesuai Kebijakan Privasi
                  Pisjo Market dan ketentuan peraturan perundang-undangan
                  yang berlaku.
                </p>

                <p>
                  Kebijakan Privasi menjelaskan secara lebih rinci mengenai
                  Data Pribadi yang dikumpulkan, tujuan pemrosesan,
                  penyimpanan, keamanan, hak Pengguna, dan aspek lain terkait
                  privasi.
                </p>

                <Link
                  href="/privacy-policy"
                  className="not-prose inline-flex items-center gap-2 rounded-lg bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
                >
                  Baca Kebijakan Privasi
                  <span aria-hidden="true">→</span>
                </Link>
              </section>

              <Divider />

              {/* 17 */}
              <section id="gangguan" className="scroll-mt-8">
                <SectionHeading
                  number="17"
                  title="Gangguan Layanan"
                />

                <p>
                  Pisjo Market berupaya menjaga layanan tetap tersedia dan
                  berfungsi dengan baik.
                </p>

                <p>
                  Namun, layanan dapat mengalami gangguan sementara karena
                  pemeliharaan, pembaruan sistem, gangguan jaringan,
                  kegagalan infrastruktur, serangan keamanan, atau keadaan
                  lain yang berada di luar kendali wajar Pisjo Market.
                </p>

                <p>
                  Kami akan berupaya memulihkan layanan dalam waktu yang
                  wajar sesuai tingkat gangguan dan kondisi teknis yang
                  terjadi.
                </p>
              </section>

              <Divider />

              {/* 18 */}
              <section id="batas-tanggung-jawab" className="scroll-mt-8">
                <SectionHeading
                  number="18"
                  title="Batas Tanggung Jawab"
                />

                <p>
                  Pisjo Market bertanggung jawab menyediakan layanan sesuai
                  kemampuan dan ketentuan yang berlaku.
                </p>

                <p>
                  Sejauh diperbolehkan oleh hukum, Pisjo Market tidak
                  bertanggung jawab atas kerugian yang secara langsung
                  disebabkan oleh:
                </p>

                <ul>
                  <li>
                    informasi yang diberikan Pengguna secara salah atau tidak
                    lengkap;
                  </li>
                  <li>
                    penggunaan akun oleh pihak lain akibat kelalaian
                    Pengguna dalam menjaga kredensial;
                  </li>
                  <li>
                    gangguan pihak ketiga yang berada di luar kendali wajar
                    Pisjo Market;
                  </li>
                  <li>
                    keadaan kahar atau peristiwa lain yang tidak dapat
                    dikendalikan secara wajar; atau
                  </li>
                  <li>
                    penggunaan layanan yang tidak sesuai dengan Syarat dan
                    Ketentuan.
                  </li>
                </ul>

                <p>
                  Ketentuan pembatasan tanggung jawab dalam bagian ini tidak
                  dimaksudkan untuk mengurangi hak konsumen yang tidak dapat
                  dikesampingkan berdasarkan peraturan perundang-undangan.
                </p>
              </section>

              <Divider />

              {/* 19 */}
              <section id="perubahan" className="scroll-mt-8">
                <SectionHeading
                  number="19"
                  title="Perubahan Syarat dan Ketentuan"
                />

                <p>
                  Pisjo Market dapat mengubah atau memperbarui Syarat dan
                  Ketentuan ini dari waktu ke waktu untuk menyesuaikan
                  perubahan layanan, fitur, proses bisnis, teknologi, atau
                  peraturan yang berlaku.
                </p>

                <p>
                  Versi terbaru akan dipublikasikan pada halaman ini.
                </p>

                <p>
                  Apabila perubahan bersifat material, Pisjo Market akan
                  berupaya memberikan pemberitahuan melalui cara yang sesuai.
                </p>

                <p>
                  Penggunaan layanan setelah perubahan berlaku merupakan
                  bentuk penerimaan terhadap ketentuan yang telah diperbarui,
                  sepanjang diperbolehkan berdasarkan hukum yang berlaku.
                </p>
              </section>

              <Divider />

              {/* 20 */}
              <section id="hukum" className="scroll-mt-8">
                <SectionHeading
                  number="20"
                  title="Hukum yang Berlaku"
                />

                <p>
                  Syarat dan Ketentuan ini ditafsirkan berdasarkan hukum
                  Republik Indonesia.
                </p>

                <p>
                  Setiap perselisihan yang timbul sehubungan dengan
                  penggunaan layanan akan terlebih dahulu diupayakan untuk
                  diselesaikan secara musyawarah dan dengan itikad baik.
                </p>

                <p>
                  Apabila penyelesaian secara musyawarah tidak mencapai
                  kesepakatan, penyelesaian selanjutnya dilakukan melalui
                  mekanisme yang tersedia berdasarkan peraturan
                  perundang-undangan yang berlaku.
                </p>
              </section>

              <Divider />

              {/* 21 */}
              <section id="kontak" className="scroll-mt-8">
                <SectionHeading number="21" title="Kontak" />

                <p>
                  Apabila Anda memiliki pertanyaan mengenai Syarat dan
                  Ketentuan, transaksi, Produk, atau penggunaan layanan,
                  silakan menghubungi Pisjo Market melalui kanal kontak yang
                  tersedia pada layanan kami.
                </p>

                <InfoBox>
                  Untuk pengaduan terkait Pesanan, sebaiknya sertakan nomor
                  Pesanan dan informasi yang relevan agar proses pemeriksaan
                  dapat dilakukan dengan lebih cepat.
                </InfoBox>
              </section>

              <Divider />

              {/* CLOSING */}
              <section>
                <div className="rounded-2xl bg-slate-900 p-6 text-white sm:p-7">
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300">
                      <svg
                        aria-hidden="true"
                        className="h-6 w-6"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="M7 4h10v16H7z" />
                        <path d="M10 8h4" />
                        <path d="M10 12h4" />
                        <path d="M10 16h2" />
                      </svg>
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold">
                        Belanja dengan nyaman di Pisjo Market.
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        Kami berupaya memberikan pengalaman belanja yang
                        aman, transparan, dan nyaman bagi setiap pengguna.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </article>
        </div>
      </section>

      {/* FOOTER */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>
            © {new Date().getFullYear()} Pisjo Market. Seluruh hak
            dilindungi.
          </p>

          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link
              href="/privacy-policy"
              className="font-medium text-slate-600 transition hover:text-cyan-700"
            >
              Kebijakan Privasi
            </Link>

            <Link
              href="/"
              className="font-medium text-cyan-700 transition hover:text-cyan-800"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function SectionHeading({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <div className="mb-5">
      <div className="mb-2 text-xs font-bold tracking-[0.18em] text-cyan-600">
        {number}
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        {title}
      </h2>
    </div>
  );
}

function Divider() {
  return <div className="my-10 border-t border-slate-200" />;
}

function InfoBox({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="my-6 rounded-xl border border-cyan-100 bg-cyan-50 px-5 py-4 text-sm leading-6 text-cyan-900">
      <div className="flex gap-3">
        <svg
          aria-hidden="true"
          className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <path d="M12 8h.01" />
        </svg>

        <div>{children}</div>
      </div>
    </div>
  );
}
