import type { Metadata } from "next";
import Link from "next/link";
import InformationalJsonLd from "@/components/seo/InformationalJsonLd";
import { getSiteUrls } from "@/services/site/site-url.service";

const title = "Kebijakan Pengembalian dan Komplain";
const description =
  "Pelajari cara mengajukan komplain atas pesanan ikan dan seafood segar di Pisjo Market, termasuk bukti yang perlu disiapkan dan proses penanganannya.";

export const metadata: Metadata = {
  title: `${title} | Pisjo Market`,
  description,
  alternates: { canonical: "/kebijakan-pengembalian" },
  openGraph: { title: `${title} | Pisjo Market`, description, type: "website", locale: "id_ID" },
};

const sections = [
  { id: "cakupan", title: "Cakupan Kebijakan" },
  { id: "kondisi", title: "Kondisi yang Dapat Dilaporkan" },
  { id: "pengajuan", title: "Cara Mengajukan Komplain" },
  { id: "penanganan", title: "Pemeriksaan dan Penyelesaian" },
  { id: "pengecualian", title: "Hal yang Perlu Diperhatikan" },
  { id: "kontak", title: "Hubungi Kami" },
];

export default async function ReturnPolicyPage() {
  const siteUrls = await getSiteUrls();
  const siteUrl = siteUrls.storefrontUrl.replace(/\/+$/, "");
  const pageUrl = `${siteUrl}/kebijakan-pengembalian`;

  return (
    <main className="min-h-screen bg-slate-50">
      <InformationalJsonLd
        type="WebPage"
        name={`${title} | Pisjo Market`}
        description={description}
        url={pageUrl}
        siteUrl={siteUrl}
        breadcrumbs={[{ name: "Beranda", url: `${siteUrl}/` }, { name: title, url: pageUrl }]}
      />
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-sm font-medium text-cyan-700">
              <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M4 5.5v16M8 7h8M8 11h8" /></svg>
              Informasi Pelanggan
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">Kebijakan Pengembalian dan Komplain</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">Kami ingin pesanan ikan dan seafood segar Anda diterima dalam kondisi yang sesuai. Halaman ini menjelaskan cara melaporkan masalah pesanan dan bagaimana laporan akan ditinjau oleh tim Pisjo Market.</p>
            <p className="mt-4 text-sm text-slate-500">Karena produk yang dijual dapat berupa bahan pangan segar, mohon periksa pesanan sesegera mungkin setelah diterima.</p>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-4 text-sm font-semibold text-slate-900">Daftar Isi</p>
              <nav aria-label="Daftar isi kebijakan" className="space-y-1">
                {sections.map((section) => <a key={section.id} href={`#${section.id}`} className="block rounded-lg px-3 py-2 text-sm leading-5 text-slate-600 transition hover:bg-cyan-50 hover:text-cyan-700">{section.title}</a>)}
              </nav>
            </div>
          </aside>
          <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
            <div className="prose prose-slate max-w-none">
              <section id="cakupan" className="scroll-mt-8"><SectionHeading number="01" title="Cakupan Kebijakan" /><p>Kebijakan ini berlaku untuk laporan terkait pesanan yang dilakukan melalui Pisjo Market. Setiap laporan akan ditinjau berdasarkan detail pesanan, kondisi produk saat diterima, bukti pendukung, serta informasi lain yang relevan.</p><p>Kebijakan ini merupakan panduan pengajuan dan pemeriksaan komplain. Pengajuan tidak otomatis berarti pengembalian barang atau dana disetujui; hasilnya akan dikomunikasikan setelah peninjauan.</p></section>
              <Divider />
              <section id="kondisi" className="scroll-mt-8"><SectionHeading number="02" title="Kondisi yang Dapat Dilaporkan" /><p>Silakan hubungi kami apabila pesanan mengalami masalah, termasuk:</p><ul><li>Produk yang diterima berbeda dari produk atau varian yang dipesan.</li><li>Jumlah atau item pesanan tidak sesuai dengan rincian pesanan.</li><li>Produk atau kemasan mengalami kerusakan saat diterima.</li><li>Terdapat indikasi masalah kesegaran atau kualitas produk ketika pesanan diterima.</li></ul><p>Jelaskan masalah yang ditemukan secara spesifik agar tim kami dapat melakukan pemeriksaan dengan tepat.</p></section>
              <Divider />
              <section id="pengajuan" className="scroll-mt-8"><SectionHeading number="03" title="Cara Mengajukan Komplain" /><ol><li>Siapkan nomor pesanan atau informasi transaksi yang dapat membantu kami menemukan pesanan Anda.</li><li>Ambil foto atau video yang jelas dari produk, kemasan, label, dan bagian yang menunjukkan masalah. Sertakan beberapa sudut jika diperlukan.</li><li>Hubungi tim Pisjo Market melalui halaman <Link href="/kontak-kami">Kontak Kami</Link> sesegera mungkin setelah pesanan diterima.</li><li>Sampaikan kronologi singkat dan solusi yang Anda harapkan, misalnya pemeriksaan lebih lanjut, penggantian produk, atau pengembalian dana.</li></ol><p>Mohon simpan produk dan kemasan sementara laporan ditinjau, jika aman dan memungkinkan. Jangan mengonsumsi produk yang Anda duga tidak aman.</p></section>
              <Divider />
              <section id="penanganan" className="scroll-mt-8"><SectionHeading number="04" title="Pemeriksaan dan Penyelesaian" /><p>Tim kami akan memeriksa detail pesanan dan bukti yang disampaikan. Kami dapat meminta informasi tambahan jika dibutuhkan untuk memahami kondisi produk atau proses pengiriman.</p><p>Jika laporan terverifikasi, solusi akan ditentukan berdasarkan jenis masalah dan hasil pemeriksaan. Solusi yang dapat dipertimbangkan meliputi penggantian produk, pengembalian dana, atau penyelesaian lain yang disepakati sesuai kondisi kasus.</p><p>Persetujuan, bentuk penyelesaian, dan estimasi waktunya akan diinformasikan kepada pelanggan setelah pemeriksaan. Jangan menganggap penggantian atau pengembalian dana telah disetujui sebelum menerima konfirmasi dari tim kami.</p></section>
              <Divider />
              <section id="pengecualian" className="scroll-mt-8"><SectionHeading number="05" title="Hal yang Perlu Diperhatikan" /><ul><li>Periksa pesanan sesegera mungkin setelah diterima, terutama untuk produk segar.</li><li>Foto atau video sebaiknya memperlihatkan kondisi produk saat diterima dan tidak diedit sehingga mengubah informasi yang relevan.</li><li>Kualitas produk segar dapat memiliki variasi alami. Perbedaan yang tidak menunjukkan ketidaksesuaian atau kerusakan akan dinilai berdasarkan informasi produk dan kondisi pesanan.</li><li>Kondisi penyimpanan setelah pesanan diterima dapat menjadi pertimbangan dalam pemeriksaan.</li><li>Hak pelanggan berdasarkan peraturan perundang-undangan yang berlaku tetap dihormati.</li></ul><p>Apabila terdapat ketentuan khusus pada produk atau promosi tertentu, silakan periksa informasi tersebut pada halaman produk atau materi promosi terkait.</p></section>
              <Divider />
              <section id="kontak" className="scroll-mt-8"><SectionHeading number="06" title="Hubungi Kami" /><p>Untuk melaporkan masalah pesanan atau menanyakan proses komplain, kunjungi halaman <Link href="/kontak-kami">Kontak Kami</Link> atau buka <Link href="/help">Pusat Bantuan</Link>.</p><p>Sertakan nomor pesanan dan bukti pendukung saat menghubungi kami agar laporan dapat ditangani dengan lebih efisien.</p></section>
            </div>
            <div className="mt-10 flex flex-col gap-3 rounded-xl border border-cyan-100 bg-cyan-50 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-slate-900">Ada masalah dengan pesanan Anda?</h2><p className="mt-1 text-sm leading-6 text-slate-600">Hubungi kami dan sertakan nomor pesanan serta bukti yang relevan.</p></div><Link href="/kontak-kami" className="inline-flex shrink-0 items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">Hubungi Kami</Link></div>
          </article>
        </div>
      </section>
    </main>
  );
}

function SectionHeading({ number, title }: { number: string; title: string }) {
  return <div className="not-prose mb-4 flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-sm font-bold text-cyan-700">{number}</span><h2 className="pt-1 text-xl font-bold tracking-tight text-slate-900">{title}</h2></div>;
}

function Divider() {
  return <hr className="my-8 border-slate-200" />;
}
