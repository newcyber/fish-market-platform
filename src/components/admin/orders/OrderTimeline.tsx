import {
  CheckCircle2,
  Circle,
  Clock3,
  PackageCheck,
  ReceiptText,
  Trash2,
} from "lucide-react";

import {
  OrderStatus,
  PaymentStatus,
} from "@prisma/client";

interface OrderTimelineProps {
  createdAt: Date | string;

  paidAt?: Date | string | null;

  completedAt?: Date | string | null;

  deletedAt?: Date | string | null;

  status: OrderStatus;

  paymentStatus: PaymentStatus;
}

interface TimelineItem {
  title: string;

  description: string;

  date?: Date | string | null;

  completed: boolean;

  current?: boolean;

  icon:
    | "created"
    | "payment"
    | "completed"
    | "deleted";
}

function formatDate(
  value?: Date | string | null
) {
  if (!value) {
    return null;
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}

function TimelineIcon({
  type,
  completed,
  current,
}: {
  type: TimelineItem["icon"];

  completed: boolean;

  current?: boolean;
}) {
  if (completed) {
    return (
      <CheckCircle2 className="h-5 w-5" />
    );
  }

  if (type === "payment") {
    return (
      <ReceiptText className="h-5 w-5" />
    );
  }

  if (type === "completed") {
    return (
      <PackageCheck className="h-5 w-5" />
    );
  }

  if (type === "deleted") {
    return (
      <Trash2 className="h-5 w-5" />
    );
  }

  if (current) {
    return (
      <Clock3 className="h-5 w-5" />
    );
  }

  return (
    <Circle className="h-5 w-5" />
  );
}

export default function OrderTimeline({
  createdAt,
  paidAt,
  completedAt,
  deletedAt,
  status,
  paymentStatus,
}: OrderTimelineProps) {
  const items: TimelineItem[] = [
    {
      title: "Order dibuat",

      description:
        "Order berhasil dibuat dan masuk ke dalam sistem.",

      date: createdAt,

      completed: true,

      icon: "created",
    },

    {
      title: "Pembayaran",

      description:
        paymentStatus ===
        PaymentStatus.VERIFIED
          ? "Pembayaran telah diverifikasi."
          : "Menunggu pembayaran atau verifikasi pembayaran.",

      date: paidAt,

      completed:
        paymentStatus ===
        PaymentStatus.VERIFIED,

      current:
        paymentStatus !==
        PaymentStatus.VERIFIED,

      icon: "payment",
    },

    {
      title: "Order selesai",

      description:
        status ===
        OrderStatus.COMPLETED
          ? "Order telah diselesaikan."
          : "Order belum berstatus selesai.",

      date: completedAt,

      completed:
        status ===
        OrderStatus.COMPLETED,

      current:
        status !==
          OrderStatus.COMPLETED &&
        status !==
          OrderStatus.CANCELLED,

      icon: "completed",
    },
  ];

  if (deletedAt) {
    items.push({
      title: "Dipindahkan ke Trash",

      description:
        "Order dipindahkan ke Trash dan tidak lagi dianggap sebagai order aktif.",

      date: deletedAt,

      completed: true,

      icon: "deleted",
    });
  }

  return (
    <section className="rounded-xl border bg-background">
      {/* HEADER */}

      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
            <Clock3 className="h-4 w-4" />
          </div>

          <div>
            <h2 className="font-semibold">
              Timeline Order
            </h2>

            <p className="text-sm text-muted-foreground">
              Riwayat milestone utama order.
            </p>
          </div>
        </div>
      </div>

      {/* TIMELINE */}

      <div className="p-6">
        <div className="relative">
          {items.map(
            (item, index) => {
              const isLast =
                index ===
                items.length - 1;

              const formattedDate =
                formatDate(
                  item.date
                );

              return (
                <div
                  key={`${item.title}-${index}`}
                  className="relative flex gap-4"
                >
                  {/* CONNECTOR */}

                  {!isLast && (
                    <div
                      className={[
                        "absolute left-[15px] top-8 h-[calc(100%-8px)] w-px",
                        item.completed
                          ? "bg-foreground/30"
                          : "bg-border",
                      ].join(" ")}
                    />
                  )}

                  {/* ICON */}

                  <div
                    className={[
                      "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                      item.completed
                        ? "bg-foreground text-background"
                        : item.current
                          ? "bg-muted text-foreground"
                          : "bg-background text-muted-foreground",
                    ].join(" ")}
                  >
                    <TimelineIcon
                      type={item.icon}
                      completed={
                        item.completed
                      }
                      current={
                        item.current
                      }
                    />
                  </div>

                  {/* CONTENT */}

                  <div
                    className={[
                      "min-w-0 flex-1",
                      isLast
                        ? "pb-0"
                        : "pb-8",
                    ].join(" ")}
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div>
                        <h3 className="font-medium">
                          {item.title}
                        </h3>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {
                            item.description
                          }
                        </p>
                      </div>

                      {formattedDate && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formattedDate}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    </section>
  );
}