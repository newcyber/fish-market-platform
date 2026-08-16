import OrderService from "@/services/order/order.service";

import RestoreOrderButton from "@/components/admin/orders/RestoreOrderButton";

import ForceDeleteOrderButton from "@/components/admin/orders/ForceDeleteOrderButton";

export const dynamic =
  "force-dynamic";

export default async function OrdersTrashPage() {
  const orders =
    await OrderService.getDeletedOrders();

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Trash Order
            </h1>

            <p className="mt-1 text-muted-foreground">
              Kelola order yang telah dipindahkan ke Trash.
            </p>
          </div>

          <div className="rounded-full border px-3 py-1 text-sm font-medium">
            {orders.length} Order
          </div>
        </div>
      </div>

      {/* CONTENT */}

      <div className="rounded-xl border bg-background">
        {orders.length === 0 ? (
          <div className="flex min-h-60 flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <span className="text-xl">
                🗑️
              </span>
            </div>

            <p className="font-semibold">
              Trash kosong
            </p>

            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Tidak ada order yang berada di Trash.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {orders.map(
              (order) => (
                <div
                  key={order.id}
                  className="p-5"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    {/* ORDER INFO */}

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">
                          {order.orderNumber}
                        </p>

                        <span className="rounded-full border px-2.5 py-0.5 text-xs font-medium">
                          {order.status}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {order.user.name}
                      </p>

                      {order.user.email && (
                        <p className="text-sm text-muted-foreground">
                          {order.user.email}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          Dibuat:{" "}
                          {new Intl.DateTimeFormat(
                            "id-ID",
                            {
                              dateStyle:
                                "medium",
                              timeStyle:
                                "short",
                            }
                          ).format(
                            new Date(
                              order.createdAt
                            )
                          )}
                        </span>

                        <span>
                          Dihapus:{" "}
                          {order.deletedAt
                            ? new Intl.DateTimeFormat(
                                "id-ID",
                                {
                                  dateStyle:
                                    "medium",
                                  timeStyle:
                                    "short",
                                }
                              ).format(
                                new Date(
                                  order.deletedAt
                                )
                              )
                            : "-"}
                        </span>
                      </div>
                    </div>

                    {/* ACTIONS */}

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <RestoreOrderButton
                        id={order.id}
                      />

                      <ForceDeleteOrderButton
                        id={order.id}
                        orderNumber={
                          order.orderNumber
                        }
                      />
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}