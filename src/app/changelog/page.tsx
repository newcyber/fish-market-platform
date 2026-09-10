import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Bug,
  CheckCircle2,
  Gauge,
  Sparkles,
} from "lucide-react";

import changelogService from "@/services/changelog/changelog.service";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "Lihat fitur baru, peningkatan, dan perbaikan terbaru di Pisjo Market.",
  alternates: {
    canonical: "/changelog",
  },
};

const TYPE_CONFIG = {
  FEATURE: {
    label: "Fitur Baru",
    icon: Sparkles,
  },
  IMPROVEMENT: {
    label: "Peningkatan",
    icon: CheckCircle2,
  },
  FIX: {
    label: "Perbaikan",
    icon: Bug,
  },
  PERFORMANCE: {
    label: "Performa",
    icon: Gauge,
  },
} as const;

type ChangelogType =
  keyof typeof TYPE_CONFIG;

interface PublicChangelogEntry {
  id: string;
  type: ChangelogType;
  title: string;
  description: string;
  highlights: string[];
}

interface PublicChangelogRelease {
  id: string;
  version: string;
  date: string;
  title: string;
  description: string | null;
  entries: PublicChangelogEntry[];
}

export default async function ChangelogPage() {
  const releases =
    await changelogService.getPublishedReleases();

  const serializedReleases: PublicChangelogRelease[] =
    releases.map((release) => ({
      id: release.id,
      version: release.version,
      date: release.date.toISOString(),
      title: release.title,
      description: release.description,
      entries: release.entries.map(
        (entry) => ({
          id: entry.id,
          type: entry.type,
          title: entry.title,
          description: entry.description,
          highlights:
            normalizeHighlights(
              entry.highlights,
            ),
        }),
      ),
    }));

  return (
    <main className="min-h-screen bg-slate-50">
      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="border-b bg-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <Link
            href="/"
            className="
              mb-8
              inline-flex
              items-center
              gap-2
              text-sm
              font-semibold
              text-slate-600
              transition
              hover:text-(--pisjo-primary)
            "
          >
            <ArrowLeft
              aria-hidden="true"
              className="h-4 w-4"
            />

            Kembali ke Beranda
          </Link>

          <div className="max-w-3xl">
            <div
              className="
                mb-4
                inline-flex
                items-center
                gap-2
                rounded-full
                bg-(--ice-50)
                px-3
                py-1.5
                text-xs
                font-bold
                text-(--pisjo-primary)
              "
            >
              <Sparkles
                aria-hidden="true"
                className="h-3.5 w-3.5"
              />

              UPDATE PISJO MARKET
            </div>

            <h1
              className="
                text-3xl
                font-bold
                tracking-tight
                text-[var(--ocean-950)]
                sm:text-4xl
                lg:text-5xl
              "
            >
              Apa yang baru di Pisjo?
            </h1>

            <p
              className="
                mt-4
                max-w-2xl
                text-sm
                leading-6
                text-slate-600
                sm:text-base
                sm:leading-7
              "
            >
              Kami terus meningkatkan Pisjo Market agar
              pengalaman belanja Anda semakin mudah,
              nyaman, dan cepat.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          CHANGELOG
      ====================================================== */}

      <section className="w-full">
        <div
          className="
            mx-auto
            w-full
            max-w-5xl
            px-4
            py-10
            sm:px-6
            sm:py-14
            lg:px-8
          "
        >
          {serializedReleases.length === 0 ? (
            <div
              className="
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-8
                text-center
                shadow-sm
                sm:p-12
              "
            >
              <Sparkles
                aria-hidden="true"
                className="mx-auto h-8 w-8 text-slate-300"
              />

              <h2 className="mt-4 text-lg font-bold text-slate-900">
                Belum ada pembaruan
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Belum ada changelog yang dipublikasikan.
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {serializedReleases.map(
                (release) => (
                  <section
                    key={release.id}
                    aria-labelledby={`release-${release.id}`}
                  >
                    {/* RELEASE HEADER */}

                    <div className="mb-6">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2
                          id={`release-${release.id}`}
                          className="
                            text-xl
                            font-bold
                            tracking-tight
                            text-[var(--ocean-950)]
                            sm:text-2xl
                          "
                        >
                          {release.title}
                        </h2>

                        <span
                          className="
                            rounded-full
                            border
                            border-slate-200
                            bg-white
                            px-2.5
                            py-1
                            text-[11px]
                            font-semibold
                            text-slate-500
                          "
                        >
                          {release.version}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        {formatReleaseDate(
                          release.date,
                        )}
                      </p>

                      {release.description && (
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                          {release.description}
                        </p>
                      )}
                    </div>

                    {/* ENTRIES */}

                    <div className="space-y-5">
                      {release.entries.map(
                        (entry) => {
                          const config =
                            TYPE_CONFIG[
                              entry.type
                            ];

                          const Icon =
                            config.icon;

                          return (
                            <article
                              key={entry.id}
                              className="
                                overflow-hidden
                                rounded-2xl
                                border
                                border-slate-200
                                bg-white
                                shadow-sm
                              "
                            >
                              <div className="p-5 sm:p-6">
                                <div className="flex items-start gap-4">
                                  <div
                                    className="
                                      flex
                                      h-10
                                      w-10
                                      shrink-0
                                      items-center
                                      justify-center
                                      rounded-xl
                                      bg-(--ice-50)
                                      text-(--pisjo-primary)
                                    "
                                  >
                                    <Icon
                                      aria-hidden="true"
                                      className="h-5 w-5"
                                    />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div
                                      className="
                                        flex
                                        flex-wrap
                                        items-center
                                        gap-x-3
                                        gap-y-1.5
                                      "
                                    >
                                      <h3
                                        className="
                                          text-base
                                          font-bold
                                          text-slate-900
                                          sm:text-lg
                                        "
                                      >
                                        {
                                          entry.title
                                        }
                                      </h3>

                                      <span
                                        className="
                                          rounded-full
                                          bg-slate-100
                                          px-2
                                          py-0.5
                                          text-[10px]
                                          font-bold
                                          uppercase
                                          tracking-wide
                                          text-slate-500
                                        "
                                      >
                                        {
                                          config.label
                                        }
                                      </span>
                                    </div>

                                    <p
                                      className="
                                        mt-2
                                        text-sm
                                        leading-6
                                        text-slate-600
                                      "
                                    >
                                      {
                                        entry.description
                                      }
                                    </p>

                                    {entry.highlights
                                      .length >
                                      0 && (
                                      <ul
                                        className="
                                          mt-4
                                          space-y-2
                                        "
                                      >
                                        {entry.highlights.map(
                                          (
                                            highlight,
                                            index,
                                          ) => (
                                            <li
                                              key={`${entry.id}-highlight-${index}`}
                                              className="
                                                flex
                                                items-start
                                                gap-2
                                                text-sm
                                                leading-6
                                                text-slate-600
                                              "
                                            >
                                              <span
                                                aria-hidden="true"
                                                className="
                                                  mt-2
                                                  h-1.5
                                                  w-1.5
                                                  shrink-0
                                                  rounded-full
                                                  bg-(--pisjo-primary)
                                                "
                                              />

                                              <span>
                                                {
                                                  highlight
                                                }
                                              </span>
                                            </li>
                                          ),
                                        )}
                                      </ul>
                                    )}

                                    <p
                                      className="
                                        mt-4
                                        text-xs
                                        font-medium
                                        text-slate-400
                                      "
                                    >
                                      {formatReleaseDate(
                                        release.date,
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </article>
                          );
                        },
                      )}
                    </div>
                  </section>
                ),
              )}
            </div>
          )}

          {/* =================================================
              FOOTER NOTE
          ================================================== */}

          <div
            className="
              mt-12
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-5
              text-center
              sm:p-6
            "
          >
            <p className="text-sm leading-6 text-slate-500">
              Kami akan terus memperbarui Pisjo Market
              untuk memberikan pengalaman belanja yang
              lebih baik.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function normalizeHighlights(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" &&
      item.trim().length > 0,
  );
}

function formatReleaseDate(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  ).format(date);
}
