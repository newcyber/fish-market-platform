"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowRight,
  ChevronDown,
  CircleHelp,
  CreditCard,
  Heart,
  Package,
  Search,
  ShieldCheck,
  ShoppingCart,
  Star,
  TicketPercent,
  Truck,
  UserRound,
  X,
} from "lucide-react";

type HelpCategory = {
  id: string;
  label: string;
  description: string;
  icon: typeof ShoppingCart;
};

type FAQ = {
  id: string;
  category: string;
  question: string;
  answer: string;
};

const categories: HelpCategory[] = [
  {
    id: "belanja",
    label: "Belanja & Produk",
    description:
      "Informasi produk, varian berat, harga, dan stok.",
    icon: ShoppingCart,
  },
  {
    id: "pesanan",
    label: "Pesanan",
    description:
      "Bantuan seputar pembuatan dan status pesanan.",
    icon: Package,
  },
  {
    id: "pembayaran",
    label: "Pembayaran",
    description:
      "Informasi pembayaran dan konfirmasi transaksi.",
    icon: CreditCard,
  },
  {
    id: "pengiriman",
    label: "Pengiriman",
    description:
      "Informasi pengiriman dan status pesanan.",
    icon: Truck,
  },
  {
    id: "voucher",
    label: "Voucher & Promo",
    description:
      "Cara menggunakan voucher dan promo.",
    icon: TicketPercent,
  },
  {
    id: "poin",
    label: "Poin & Reward",
    description:
      "Informasi poin hadiah dan reward.",
    icon: Star,
  },
  {
    id: "akun",
    label: "Akun",
    description:
      "Login, registrasi, verifikasi, dan keamanan akun.",
    icon: UserRound,
  },
  {
    id: "wishlist",
    label: "Wishlist",
    description:
      "Kelola produk yang Anda simpan.",
    icon: Heart,
  },
  {
    id: "keranjang",
    label: "Keranjang",
    description:
      "Bantuan mengenai isi dan proses keranjang.",
    icon: ShoppingCart,
  },
  {
    id: "keamanan",
    label: "Keamanan",
    description:
      "Tips menjaga keamanan akun dan transaksi.",
    icon: ShieldCheck,
  },
];

const faqs: FAQ[] = [
  {
    id: "buat-pesanan",
    category: "pesanan",
    question:
      "Bagaimana cara membuat pesanan?",
    answer:
      "Pilih produk yang ingin dibeli, tentukan varian atau berat yang tersedia, masukkan produk ke keranjang, lalu lanjutkan ke checkout. Pastikan alamat pengiriman, metode pembayaran, dan detail pesanan sudah benar sebelum menyelesaikan checkout.",
  },
  {
    id: "cek-status-pesanan",
    category: "pesanan",
    question:
      "Bagaimana cara melihat status pesanan saya?",
    answer:
      "Anda dapat melihat detail dan perkembangan pesanan melalui halaman pesanan pada akun Anda. Status pesanan akan berubah mengikuti proses pemenuhan pesanan.",
  },
  {
    id: "produk-tidak-tersedia",
    category: "belanja",
    question:
      "Mengapa produk atau varian yang saya inginkan tidak tersedia?",
    answer:
      "Ketersediaan produk dan varian mengikuti stok yang tersedia. Produk atau varian tertentu dapat menjadi tidak tersedia ketika stok habis.",
  },
  {
    id: "berat-produk",
    category: "belanja",
    question:
      "Apakah produk tersedia dalam beberapa pilihan berat?",
    answer:
      "Ya. Produk tertentu dapat memiliki beberapa pilihan berat atau varian. Pilihan yang tersedia akan ditampilkan pada detail produk.",
  },
  {
    id: "harga-produk",
    category: "belanja",
    question:
      "Mengapa harga produk dapat berbeda?",
    answer:
      "Harga dapat berbeda berdasarkan varian atau berat produk serta promo yang sedang berlaku. Harga yang digunakan dalam transaksi adalah harga yang ditampilkan saat checkout.",
  },
  {
    id: "pembayaran",
    category: "pembayaran",
    question:
      "Bagaimana cara melakukan pembayaran?",
    answer:
      "Pilih metode pembayaran yang tersedia pada saat checkout, kemudian ikuti instruksi pembayaran yang ditampilkan oleh sistem.",
  },
  {
    id: "qris",
    category: "pembayaran",
    question:
      "Bagaimana jika saya sudah membayar menggunakan QRIS?",
    answer:
      "Setelah melakukan pembayaran, ikuti instruksi pada halaman pesanan untuk mengonfirmasi pembayaran. Jangan melakukan pembayaran ulang apabila transaksi sebelumnya sudah berhasil dilakukan.",
  },
  {
    id: "bukti-pembayaran",
    category: "pembayaran",
    question:
      "Apa yang harus dilakukan jika pembayaran saya belum diverifikasi?",
    answer:
      "Pastikan pembayaran sudah dilakukan sesuai nominal dan metode yang dipilih. Jika sistem meminta bukti pembayaran, unggah bukti yang sesuai dan tunggu proses verifikasi.",
  },
  {
    id: "voucher",
    category: "voucher",
    question:
      "Bagaimana cara menggunakan voucher?",
    answer:
      "Masukkan atau pilih voucher yang tersedia pada proses checkout. Sistem akan memvalidasi ketentuan voucher sebelum diskon diterapkan pada transaksi.",
  },
  {
    id: "voucher-tidak-bisa",
    category: "voucher",
    question:
      "Mengapa voucher saya tidak dapat digunakan?",
    answer:
      "Voucher memiliki ketentuan tertentu seperti periode berlaku, minimum transaksi, produk tertentu, atau batas penggunaan. Pastikan transaksi Anda memenuhi seluruh ketentuan voucher.",
  },
  {
    id: "flash-sale",
    category: "voucher",
    question:
      "Bagaimana cara mendapatkan harga promo atau Flash Sale?",
    answer:
      "Promo dan Flash Sale hanya tersedia pada produk dan periode yang telah ditentukan. Periksa detail promo pada halaman produk atau halaman promo sebelum melakukan checkout.",
  },
  {
    id: "poin",
    category: "poin",
    question:
      "Bagaimana saya mendapatkan poin?",
    answer:
      "Poin diberikan berdasarkan ketentuan program reward yang berlaku pada transaksi. Detail perolehan poin dapat mengikuti konfigurasi program reward yang sedang aktif.",
  },
  {
    id: "akun-baru",
    category: "akun",
    question:
      "Bagaimana cara membuat akun?",
    answer:
      "Pilih menu registrasi dan lengkapi data yang diperlukan. Setelah registrasi berhasil, ikuti proses verifikasi akun jika diminta oleh sistem.",
  },
  {
    id: "verifikasi-email",
    category: "akun",
    question:
      "Saya belum menerima email verifikasi. Apa yang harus dilakukan?",
    answer:
      "Periksa folder Spam atau Junk pada email Anda dan pastikan alamat email yang digunakan saat registrasi sudah benar. Jika email belum diterima, gunakan opsi pengiriman ulang verifikasi apabila tersedia.",
  },
  {
    id: "lupa-password",
    category: "akun",
    question:
      "Saya lupa password. Bagaimana cara mengatasinya?",
    answer:
      "Gunakan fitur Lupa Password pada halaman login dan ikuti instruksi pemulihan yang dikirim ke alamat email terdaftar.",
  },
  {
    id: "wishlist",
    category: "wishlist",
    question:
      "Apa fungsi Wishlist?",
    answer:
      "Wishlist digunakan untuk menyimpan produk yang ingin Anda lihat atau beli kembali dengan lebih mudah di kemudian hari.",
  },
  {
    id: "keranjang",
    category: "keranjang",
    question:
      "Mengapa isi keranjang saya berubah?",
    answer:
      "Ketersediaan stok, harga, promo, atau ketentuan Flash Sale dapat berubah sebelum checkout. Sistem akan menggunakan kondisi transaksi yang berlaku ketika pesanan dibuat.",
  },
  {
    id: "pengiriman",
    category: "pengiriman",
    question:
      "Kapan pesanan saya dikirim?",
    answer:
      "Waktu pengiriman mengikuti proses pemenuhan pesanan dan konfigurasi pengiriman yang berlaku. Periksa status pesanan Anda untuk mendapatkan informasi terbaru.",
  },
  {
    id: "alamat",
    category: "pengiriman",
    question:
      "Bagaimana jika saya salah memasukkan alamat?",
    answer:
      "Segera periksa detail alamat sebelum menyelesaikan checkout. Jika pesanan sudah dibuat, hubungi Customer Service secepatnya karena perubahan alamat bergantung pada status pesanan.",
  },
  {
    id: "pesanan-bermasalah",
    category: "pesanan",
    question:
      "Apa yang harus saya lakukan jika pesanan bermasalah?",
    answer:
      "Periksa detail pesanan dan statusnya terlebih dahulu. Jika masalah tetap terjadi, hubungi Customer Service dan siapkan nomor pesanan agar tim dapat membantu melakukan pengecekan.",
  },
  {
    id: "keamanan-akun",
    category: "keamanan",
    question:
      "Bagaimana menjaga keamanan akun saya?",
    answer:
      "Jangan membagikan password atau kode verifikasi kepada siapa pun. Gunakan password yang kuat dan segera ubah password jika Anda mencurigai adanya akses yang tidak dikenal.",
  },
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function HelpCenter() {
  const [search, setSearch] =
    useState("");

  const [activeCategory, setActiveCategory] =
    useState<string | null>(null);

  const [openFaq, setOpenFaq] =
    useState<string | null>(null);

  const normalizedSearch =
    normalize(search.trim());

  const filteredFaqs =
    useMemo(() => {
      return faqs.filter((faq) => {
        const matchesCategory =
          !activeCategory ||
          faq.category === activeCategory;

        if (!matchesCategory) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        const category =
          categories.find(
            (item) =>
              item.id === faq.category
          );

        const searchableText =
          [
            faq.question,
            faq.answer,
            category?.label ?? "",
          ].join(" ");

        return normalize(
          searchableText
        ).includes(normalizedSearch);
      });
    }, [
      activeCategory,
      normalizedSearch,
    ]);

  const selectedCategory =
    categories.find(
      (category) =>
        category.id === activeCategory
    );

  const handleCategoryClick = (
    categoryId: string
  ) => {
    setActiveCategory(
      (current) =>
        current === categoryId
          ? null
          : categoryId
    );

    setOpenFaq(null);
  };

  const clearFilters = () => {
    setSearch("");
    setActiveCategory(null);
    setOpenFaq(null);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* ====================================================== */}
      {/* HERO */}
      {/* ====================================================== */}

      <section className="border-b border-slate-200 bg-white">

        <div className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8">

          <div className="mx-auto max-w-3xl text-center">

            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <CircleHelp
                className="h-7 w-7"
                strokeWidth={2}
              />
            </div>

            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
              Pusat Bantuan
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              Ada yang bisa kami bantu?
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Temukan jawaban untuk pertanyaan
              seputar produk, pesanan,
              pembayaran, pengiriman, dan
              layanan Pisjo Market.
            </p>

            {/* SEARCH */}

            <div className="relative mx-auto mt-8 max-w-2xl">

              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                strokeWidth={2}
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Cari pertanyaan atau masalah..."
                aria-label="Cari bantuan"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  aria-label="Hapus pencarian"
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                >
                  <X
                    className="h-4 w-4"
                  />
                </button>
              )}

            </div>

          </div>

        </div>

      </section>

      {/* ====================================================== */}
      {/* CONTENT */}
      {/* ====================================================== */}

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">

        {/* ==================================================== */}
        {/* CATEGORIES */}
        {/* ==================================================== */}

        <div>

          <div className="mb-6">

            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Pilih topik
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              Bagaimana kami bisa membantu?
            </h2>

          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

            {categories.map(
              (category) => {
                const Icon =
                  category.icon;

                const isActive =
                  activeCategory ===
                  category.id;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() =>
                      handleCategoryClick(
                        category.id
                      )
                    }
                    className={[
                      "group rounded-2xl border p-5 text-left transition",
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm",
                    ].join(" ")}
                  >

                    <div
                      className={[
                        "mb-4 flex h-10 w-10 items-center justify-center rounded-xl",
                        isActive
                          ? "bg-white/10 text-white"
                          : "bg-slate-100 text-slate-700",
                      ].join(" ")}
                    >
                      <Icon
                        className="h-5 w-5"
                        strokeWidth={2}
                      />
                    </div>

                    <div
                      className={[
                        "text-sm font-bold",
                        isActive
                          ? "text-white"
                          : "text-slate-900",
                      ].join(" ")}
                    >
                      {category.label}
                    </div>

                    <div
                      className={[
                        "mt-1 text-xs leading-5",
                        isActive
                          ? "text-slate-300"
                          : "text-slate-500",
                      ].join(" ")}
                    >
                      {category.description}
                    </div>

                  </button>
                );
              }
            )}

          </div>

        </div>

        {/* ==================================================== */}
        {/* FAQ */}
        {/* ==================================================== */}

        <div className="mx-auto mt-14 max-w-4xl">

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                FAQ
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                {selectedCategory
                  ? selectedCategory.label
                  : "Pertanyaan yang sering ditanyakan"}
              </h2>

            </div>

            {(search ||
              activeCategory) && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 sm:self-auto"
              >
                <X className="h-3.5 w-3.5" />
                Reset filter
              </button>
            )}

          </div>

          {filteredFaqs.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

              {filteredFaqs.map(
                (faq, index) => {
                  const isOpen =
                    openFaq === faq.id;

                  return (
                    <div
                      key={faq.id}
                      className={
                        index > 0
                          ? "border-t border-slate-200"
                          : ""
                      }
                    >

                      <button
                        type="button"
                        onClick={() =>
                          setOpenFaq(
                            (current) =>
                              current === faq.id
                                ? null
                                : faq.id
                          )
                        }
                        aria-expanded={isOpen}
                        className="flex w-full items-center justify-between gap-6 px-5 py-5 text-left transition hover:bg-slate-50 sm:px-6"
                      >

                        <span className="text-sm font-semibold leading-6 text-slate-900">
                          {faq.question}
                        </span>

                        <ChevronDown
                          className={[
                            "h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200",
                            isOpen
                              ? "rotate-180"
                              : "",
                          ].join(" ")}
                        />

                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5 sm:px-6">

                          <div className="rounded-xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                            {faq.answer}
                          </div>

                        </div>
                      )}

                    </div>
                  );
                }
              )}

            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <Search
                  className="h-5 w-5"
                />
              </div>

              <h3 className="mt-4 text-base font-bold text-slate-900">
                Pertanyaan tidak ditemukan
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Coba gunakan kata kunci
                yang berbeda atau hubungi
                Customer Service kami untuk
                mendapatkan bantuan.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Lihat semua bantuan
              </button>

            </div>
          )}

        </div>

        {/* ==================================================== */}
        {/* CUSTOMER SERVICE CTA */}
        {/* ==================================================== */}

        <div className="mx-auto mt-14 max-w-4xl overflow-hidden rounded-3xl bg-slate-900">

          <div className="px-6 py-8 sm:px-10 sm:py-10">

            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

              <div className="max-w-xl">

                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Masih membutuhkan bantuan?
                </p>

                <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
                  Tim Customer Service siap membantu.
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Jika jawaban yang Anda cari
                  belum tersedia, silakan hubungi
                  Customer Service kami.
                </p>

              </div>

              <Link
                href="/"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
              >
                Kembali ke Beranda
                <ArrowRight
                  className="h-4 w-4"
                />
              </Link>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}