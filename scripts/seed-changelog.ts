import { PrismaClient, ChangelogType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const releaseDate = new Date("2026-09-10T00:00:00.000Z");

  const release = await prisma.changelogRelease.upsert({
    where: {
      id: "changelog-september-2026",
    },
    update: {
      version: "September 2026",
      date: releaseDate,
      title: "Peningkatan pengalaman Pisjo Market",
      description:
        "Berbagai peningkatan pengalaman pengguna, tampilan mobile, dan perbaikan pengaturan telah diterapkan di Pisjo Market.",
      isPublished: true,
      sortOrder: 0,
    },
    create: {
      id: "changelog-september-2026",
      version: "September 2026",
      date: releaseDate,
      title: "Peningkatan pengalaman Pisjo Market",
      description:
        "Berbagai peningkatan pengalaman pengguna, tampilan mobile, dan perbaikan pengaturan telah diterapkan di Pisjo Market.",
      isPublished: true,
      sortOrder: 0,
    },
  });

  const entries = [
    {
      id: "changelog-category-mobile-expand",
      type: ChangelogType.IMPROVEMENT,
      title: "Pengalaman kategori lebih baik",
      description:
        "Tampilan kategori produk sekarang lebih nyaman digunakan pada perangkat mobile maupun desktop.",
      highlights: [
        "Mobile menampilkan 5 kategori pada tampilan awal.",
        "Tombol Lihat Lebih Banyak muncul ketika kategori lebih dari 5.",
        "Desktop menampilkan hingga 7 kategori pada tampilan awal.",
        "Daftar kategori dapat diperluas untuk melihat seluruh kategori.",
      ],
      sortOrder: 0,
    },
    {
      id: "changelog-smart-seo-settings",
      type: ChangelogType.FIX,
      title: "Perbaikan pengaturan Smart SEO",
      description:
        "Menyimpan pengaturan SEO sekarang tidak lagi mengubah atau menghapus pengaturan toko lainnya.",
      highlights: [
        "Pengaturan SEO diperbarui secara lebih aman.",
        "Pengaturan toko lainnya tetap dipertahankan.",
        "Nilai SEO yang tidak diubah tidak akan ikut tertimpa.",
      ],
      sortOrder: 1,
    },
    {
      id: "changelog-mobile-experience",
      type: ChangelogType.IMPROVEMENT,
      title: "Peningkatan pengalaman mobile",
      description:
        "Beberapa bagian antarmuka telah disesuaikan agar pengalaman menggunakan Pisjo Market di perangkat mobile menjadi lebih nyaman.",
      highlights: [
        "Layout kategori lebih responsif.",
        "Navigasi dan tampilan tetap nyaman pada layar kecil.",
        "Elemen antarmuka mengikuti ukuran layar perangkat.",
      ],
      sortOrder: 2,
    },
  ];

  for (const entry of entries) {
    await prisma.changelogEntry.upsert({
      where: {
        id: entry.id,
      },
      update: {
        releaseId: release.id,
        type: entry.type,
        title: entry.title,
        description: entry.description,
        highlights: entry.highlights,
        sortOrder: entry.sortOrder,
      },
      create: {
        id: entry.id,
        releaseId: release.id,
        type: entry.type,
        title: entry.title,
        description: entry.description,
        highlights: entry.highlights,
        sortOrder: entry.sortOrder,
      },
    });
  }

  console.log(
    `Seeded changelog release "${release.version}" with ${entries.length} entries.`,
  );
}

main()
  .catch((error) => {
    console.error("Failed to seed changelog:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
