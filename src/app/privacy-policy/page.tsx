import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Kebijakan Privasi Pisjo Market mengenai pengumpulan, penggunaan, penyimpanan, dan perlindungan data pribadi pengguna.",
};

const sections = [
  {
    id: "pendahuluan",
    title: "Pendahuluan",
  },
  {
    id: "data-yang-dikumpulkan",
    title: "Data Pribadi yang Kami Kumpulkan",
  },
  {
    id: "penggunaan-data",
    title: "Penggunaan Data Pribadi",
  },
  {
    id: "dasar-pemrosesan",
    title: "Dasar Pemrosesan Data",
  },
  {
    id: "cookie",
    title: "Cookie dan Teknologi Serupa",
  },
  {
    id: "web-push",
    title: "Notifikasi Web Push",
  },
  {
    id: "pengungkapan",
    title: "Pengungkapan Data kepada Pihak Lain",
  },
  {
    id: "keamanan",
    title: "Keamanan Data",
  },
  {
    id: "retensi",
    title: "Penyimpanan dan Retensi Data",
  },
  {
    id: "hak-pengguna",
    title: "Hak Pengguna",
  },
  {
    id: "penghapusan-akun",
    title: "Penghapusan Akun",
  },
  {
    id: "perubahan",
    title: "Perubahan Kebijakan Privasi",
  },
  {
    id: "kontak",
    title: "Kontak",
  },
];

export default function PrivacyPolicyPage() {
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
                <path d="M12 3 5 6v5c0 4.5 2.9 8.5 7 10 4.1-1.5 7-5.5 7-10V6l-7-3Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>

              Kebijakan Privasi
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Privasi Anda adalah bagian penting dari layanan kami.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Kebijakan Privasi ini menjelaskan bagaimana Pisjo Market
              mengumpulkan, menggunakan, menyimpan, dan melindungi Data
              Pribadi ketika Anda menggunakan layanan kami.
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

          {/* POLICY */}
          <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
            <div className="prose prose-slate max-w-none">
              {/* 1 */}
              <section id="pendahuluan" className="scroll-mt-8">
                <SectionHeading number="01" title="Pendahuluan" />

                <p>
                  Selamat datang di Pisjo Market. Kami menghargai privasi
                  pengguna dan berkomitmen untuk melindungi Data Pribadi
                  yang diberikan kepada kami ketika Anda menggunakan situs,
                  aplikasi, dan layanan Pisjo Market.
                </p>

                <p>
                  Kebijakan Privasi ini menjelaskan jenis Data Pribadi yang
                  dapat kami kumpulkan, tujuan penggunaannya, bagaimana data
                  tersebut dilindungi, serta hak Anda sebagai pengguna.
                </p>

                <p>
                  Kebijakan ini dibuat dengan memperhatikan ketentuan
                  peraturan perundang-undangan yang berlaku di Indonesia,
                  termasuk Undang-Undang Nomor 27 Tahun 2022 tentang
                  Pelindungan Data Pribadi.
                </p>
              </section>

              <Divider />

              {/* 2 */}
              <section
                id="data-yang-dikumpulkan"
                className="scroll-mt-8"
              >
                <SectionHeading
                  number="02"
                  title="Data Pribadi yang Kami Kumpulkan"
                />

                <p>
                  Jenis data yang kami kumpulkan bergantung pada bagaimana
                  Anda menggunakan layanan Pisjo Market. Data tersebut dapat
                  meliputi:
                </p>

                <Subheading title="Informasi akun" />

                <ul>
                  <li>Nama atau nama tampilan.</li>
                  <li>Alamat email.</li>
                  <li>Nomor telepon apabila diberikan.</li>
                  <li>Informasi autentikasi akun.</li>
                </ul>

                <Subheading title="Informasi alamat dan pengiriman" />

                <ul>
                  <li>Nama penerima.</li>
                  <li>Alamat pengiriman.</li>
                  <li>Nomor telepon penerima apabila diperlukan.</li>
                  <li>Catatan atau informasi tambahan untuk pengiriman.</li>
                </ul>

                <Subheading title="Informasi transaksi" />

                <ul>
                  <li>Produk dan varian yang dipesan.</li>
                  <li>Jumlah dan berat produk.</li>
                  <li>Informasi harga, diskon, voucher, dan promotion.</li>
                  <li>Nomor dan status pesanan.</li>
                  <li>Riwayat transaksi dan status pembayaran.</li>
                  <li>Catatan yang diberikan dalam pesanan.</li>
                </ul>

                <Subheading title="Informasi pembayaran" />

                <p>
                  Dalam proses pembayaran, kami dapat memproses informasi
                  yang diperlukan untuk memverifikasi pembayaran, termasuk
                  bukti pembayaran yang Anda unggah melalui layanan Pisjo
                  Market.
                </p>

                <p>
                  Kami tidak bermaksud mengumpulkan data pembayaran yang tidak
                  diperlukan untuk proses transaksi. Apabila suatu metode
                  pembayaran melibatkan penyedia layanan pihak ketiga,
                  pemrosesan data oleh pihak tersebut dapat tunduk pada
                  kebijakan privasi mereka sendiri.
                </p>

                <Subheading title="Informasi perangkat dan teknis" />

                <p>
                  Ketika Anda menggunakan layanan kami, sistem dapat menerima
                  informasi teknis tertentu seperti jenis browser, perangkat,
                  alamat IP, waktu akses, serta informasi teknis yang
                  diperlukan untuk keamanan dan pengoperasian layanan.
                </p>
              </section>

              <Divider />

              {/* 3 */}
              <section id="penggunaan-data" className="scroll-mt-8">
                <SectionHeading
                  number="03"
                  title="Penggunaan Data Pribadi"
                />

                <p>Data Pribadi dapat digunakan untuk:</p>

                <ul>
                  <li>
                    Membuat, mengelola, dan mengamankan akun pengguna.
                  </li>
                  <li>
                    Memproses pesanan dan menyediakan layanan kepada Anda.
                  </li>
                  <li>
                    Memproses dan memverifikasi pembayaran.
                  </li>
                  <li>
                    Mengatur pengiriman dan alamat tujuan.
                  </li>
                  <li>
                    Menampilkan riwayat dan status pesanan.
                  </li>
                  <li>
                    Mengelola voucher, diskon, promotion, dan program
                    promosi lainnya.
                  </li>
                  <li>
                    Mengirim informasi terkait pesanan dan layanan.
                  </li>
                  <li>
                    Mengirim notifikasi apabila fitur tersebut diaktifkan.
                  </li>
                  <li>
                    Mendeteksi, mencegah, dan menangani aktivitas yang
                    berpotensi melanggar keamanan layanan.
                  </li>
                  <li>
                    Memperbaiki, memelihara, dan mengembangkan layanan.
                  </li>
                  <li>
                    Memenuhi kewajiban hukum yang berlaku.
                  </li>
                </ul>
              </section>

              <Divider />

              {/* 4 */}
              <section id="dasar-pemrosesan" className="scroll-mt-8">
                <SectionHeading
                  number="04"
                  title="Dasar Pemrosesan Data"
                />

                <p>
                  Pemrosesan Data Pribadi dilakukan berdasarkan dasar yang
                  sesuai dengan tujuan pemrosesan dan ketentuan hukum yang
                  berlaku.
                </p>

                <p>Dasar tersebut dapat meliputi:</p>

                <ul>
                  <li>
                    Pelaksanaan perjanjian atau penyediaan layanan yang Anda
                    minta.
                  </li>
                  <li>
                    Persetujuan yang Anda berikan untuk tujuan tertentu.
                  </li>
                  <li>
                    Pemenuhan kewajiban hukum.
                  </li>
                  <li>
                    Perlindungan kepentingan yang sah sepanjang tidak
                    bertentangan dengan hak Anda.
                  </li>
                  <li>
                    Dasar lain yang diperbolehkan berdasarkan peraturan
                    perundang-undangan.
                  </li>
                </ul>
              </section>

              <Divider />

              {/* 5 */}
              <section id="cookie" className="scroll-mt-8">
                <SectionHeading
                  number="05"
                  title="Cookie dan Teknologi Serupa"
                />

                <p>
                  Pisjo Market dapat menggunakan cookie atau teknologi
                  serupa yang diperlukan agar layanan dapat berjalan dengan
                  baik.
                </p>

                <p>
                  Teknologi tersebut dapat digunakan untuk mempertahankan
                  sesi pengguna, menyimpan preferensi tertentu, meningkatkan
                  keamanan, dan memahami penggunaan layanan.
                </p>

                <p>
                  Anda dapat mengatur browser untuk menolak cookie tertentu.
                  Namun, menonaktifkan cookie yang diperlukan dapat
                  menyebabkan sebagian fungsi layanan tidak berjalan
                  sebagaimana mestinya.
                </p>
              </section>

              <Divider />

              {/* 6 */}
              <section id="web-push" className="scroll-mt-8">
                <SectionHeading
                  number="06"
                  title="Notifikasi Web Push"
                />

                <p>
                  Pisjo Market menyediakan fitur notifikasi Web Push untuk
                  pengguna yang memberikan izin melalui browser mereka.
                </p>

                <p>
                  Fitur ini dapat digunakan untuk mengirim pemberitahuan
                  terkait aktivitas layanan, termasuk informasi pesanan dan
                  pemberitahuan sistem.
                </p>

                <p>
                  Subscription Web Push dikaitkan dengan akun pengguna agar
                  notifikasi dapat dikirim kepada pengguna dan perangkat yang
                  sesuai.
                </p>

                <InfoBox>
                  Anda dapat mencabut izin notifikasi melalui pengaturan
                  browser pada perangkat yang digunakan. Setelah izin
                  dicabut, Pisjo Market tidak dapat mengirim notifikasi Web
                  Push ke browser tersebut.
                </InfoBox>
              </section>

              <Divider />

              {/* 7 */}
              <section id="pengungkapan" className="scroll-mt-8">
                <SectionHeading
                  number="07"
                  title="Pengungkapan Data kepada Pihak Lain"
                />

                <p>
                  Pisjo Market tidak menjual Data Pribadi pengguna sebagai
                  komoditas.
                </p>

                <p>
                  Data Pribadi dapat dibagikan atau diproses oleh pihak lain
                  apabila diperlukan untuk menyediakan layanan, menjalankan
                  transaksi, menjaga keamanan sistem, atau memenuhi
                  kewajiban hukum.
                </p>

                <p>Contohnya dapat mencakup:</p>

                <ul>
                  <li>
                    Penyedia infrastruktur atau hosting yang digunakan untuk
                    menjalankan layanan.
                  </li>
                  <li>
                    Penyedia layanan pembayaran apabila diperlukan untuk
                    menyelesaikan transaksi.
                  </li>
                  <li>
                    Penyedia layanan pengiriman apabila diperlukan untuk
                    memenuhi pesanan.
                  </li>
                  <li>
                    Penyedia layanan teknis yang membantu pengoperasian
                    sistem.
                  </li>
                  <li>
                    Aparat atau pihak berwenang apabila diwajibkan oleh
                    hukum.
                  </li>
                </ul>

                <p>
                  Pihak ketiga tersebut dapat memiliki kebijakan privasi
                  tersendiri dan pemrosesan data oleh mereka dapat tunduk pada
                  ketentuan yang berlaku bagi masing-masing penyedia.
                </p>
              </section>

              <Divider />

              {/* 8 */}
              <section id="keamanan" className="scroll-mt-8">
                <SectionHeading
                  number="08"
                  title="Keamanan Data"
                />

                <p>
                  Kami berupaya menerapkan langkah teknis dan organisatoris
                  yang wajar untuk melindungi Data Pribadi dari akses,
                  penggunaan, perubahan, pengungkapan, kehilangan, atau
                  pemrosesan yang tidak sah.
                </p>

                <p>
                  Akses terhadap data dalam sistem dibatasi berdasarkan
                  kebutuhan dan kewenangan. Sistem Pisjo Market juga
                  menerapkan pembatasan kepemilikan data pada beberapa fitur,
                  termasuk notification dan Web Push subscription yang
                  dikaitkan dengan akun pengguna.
                </p>

                <InfoBox>
                  Tidak ada sistem elektronik yang dapat dijamin 100% aman.
                  Karena itu, kami tidak dapat menjamin bahwa seluruh
                  transmisi atau penyimpanan data akan selalu bebas dari
                  risiko keamanan.
                </InfoBox>
              </section>

              <Divider />

              {/* 9 */}
              <section id="retensi" className="scroll-mt-8">
                <SectionHeading
                  number="09"
                  title="Penyimpanan dan Retensi Data"
                />

                <p>
                  Data Pribadi disimpan selama diperlukan untuk memenuhi
                  tujuan pengumpulan dan pemrosesan, menyediakan layanan,
                  menyelesaikan transaksi, menjaga keamanan, menyelesaikan
                  sengketa, serta memenuhi kewajiban hukum.
                </p>

                <p>
                  Setelah data tidak lagi diperlukan, data dapat dihapus,
                  dimusnahkan, dianonimkan, atau dipertahankan apabila
                  terdapat dasar hukum yang mengharuskan atau memperbolehkan
                  penyimpanannya.
                </p>
              </section>

              <Divider />

              {/* 10 */}
              <section id="hak-pengguna" className="scroll-mt-8">
                <SectionHeading
                  number="10"
                  title="Hak Pengguna"
                />

                <p>
                  Sesuai dengan ketentuan peraturan perundang-undangan yang
                  berlaku, Anda memiliki hak terkait Data Pribadi Anda,
                  termasuk hak untuk:
                </p>

                <ul>
                  <li>
                    Mendapatkan informasi mengenai pemrosesan Data Pribadi.
                  </li>
                  <li>
                    Memperbarui atau memperbaiki Data Pribadi yang tidak
                    akurat.
                  </li>
                  <li>
                    Meminta akses dan salinan Data Pribadi sesuai ketentuan
                    yang berlaku.
                  </li>
                  <li>
                    Meminta penghentian pemrosesan dalam kondisi tertentu.
                  </li>
                  <li>
                    Meminta penghapusan atau pemusnahan Data Pribadi sesuai
                    ketentuan yang berlaku.
                  </li>
                  <li>
                    Menarik kembali persetujuan apabila pemrosesan didasarkan
                    pada persetujuan.
                  </li>
                  <li>
                    Meminta pembatasan pemrosesan dalam kondisi tertentu.
                  </li>
                  <li>
                    Mengajukan keberatan terhadap pemrosesan tertentu sesuai
                    dengan ketentuan hukum.
                  </li>
                </ul>

                <p>
                  Pelaksanaan hak dapat tunduk pada persyaratan,
                  pengecualian, dan batasan sebagaimana ditentukan oleh
                  peraturan perundang-undangan.
                </p>
              </section>

              <Divider />

              {/* 11 */}
              <section id="penghapusan-akun" className="scroll-mt-8">
                <SectionHeading
                  number="11"
                  title="Penghapusan Akun"
                />

                <p>
                  Anda dapat menghubungi Pisjo Market apabila ingin meminta
                  penghapusan akun atau Data Pribadi tertentu.
                </p>

                <p>
                  Permintaan penghapusan tidak selalu berarti seluruh data
                  dapat langsung dihapus. Beberapa data dapat tetap
                  diperlukan untuk memenuhi kewajiban hukum, menyelesaikan
                  transaksi, mencegah penipuan, menyelesaikan sengketa, atau
                  memenuhi dasar hukum lainnya.
                </p>

                <p>
                  Kami akan menilai setiap permintaan berdasarkan identitas
                  pemohon, tujuan permintaan, jenis data, serta ketentuan
                  hukum yang berlaku.
                </p>
              </section>

              <Divider />

              {/* 12 */}
              <section id="perubahan" className="scroll-mt-8">
                <SectionHeading
                  number="12"
                  title="Perubahan Kebijakan Privasi"
                />

                <p>
                  Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke
                  waktu untuk mencerminkan perubahan layanan, teknologi,
                  proses bisnis, atau ketentuan hukum.
                </p>

                <p>
                  Versi terbaru akan dipublikasikan pada halaman ini.
                  Perubahan penting dapat diberitahukan melalui cara yang
                  sesuai dengan kondisi dan ketentuan yang berlaku.
                </p>
              </section>

              <Divider />

              {/* 13 */}
              <section id="kontak" className="scroll-mt-8">
                <SectionHeading
                  number="13"
                  title="Kontak"
                />

                <p>
                  Jika Anda memiliki pertanyaan, permintaan, atau keluhan
                  terkait Kebijakan Privasi dan pemrosesan Data Pribadi,
                  silakan menghubungi Pisjo Market melalui kanal kontak yang
                  tersedia pada layanan kami.
                </p>

                <InfoBox>
                  Untuk permintaan terkait Data Pribadi, mohon jelaskan
                  identitas Anda, jenis permintaan, serta informasi yang
                  diperlukan agar kami dapat memproses permintaan tersebut
                  dengan tepat.
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
                        <path d="M12 3 5 6v5c0 4.5 2.9 8.5 7 10 4.1-1.5 7-5.5 7-10V6l-7-3Z" />
                        <path d="M9 12h6" />
                        <path d="M12 9v6" />
                      </svg>
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold">
                        Terima kasih telah mempercayai Pisjo Market.
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        Kami berkomitmen untuk menggunakan Data Pribadi
                        secara bertanggung jawab dan menjaga kepercayaan
                        pengguna dalam setiap layanan yang kami berikan.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </article>
        </div>
      </section>

      {/* FOOTER NOTE */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>
            © {new Date().getFullYear()} Pisjo Market. Seluruh hak
            dilindungi.
          </p>

          <Link
            href="/"
            className="font-medium text-cyan-700 transition hover:text-cyan-800"
          >
            Kembali ke Beranda
          </Link>
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

function Subheading({
  title,
}: {
  title: string;
}) {
  return (
    <h3 className="mt-7 text-lg font-semibold text-slate-900">
      {title}
    </h3>
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