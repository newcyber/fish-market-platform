"use client";

import {
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  updateOrderAction,
} from "@/actions/order/update-order";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

import {
  Textarea,
} from "@/components/ui/textarea";

interface AddressOption {
  id: string;

  label?: string | null;

  receiverName?: string | null;

  receiverPhone?: string | null;

  province?: string | null;

  city?: string | null;

  district?: string | null;

  village?: string | null;

  postalCode?: string | null;

  fullAddress?: string | null;

  notes?: string | null;
}

interface CustomerOption {
  id: string;

  name: string;

  email: string;

  addresses: AddressOption[];
}

interface ProductOption {
  id: string;

  name: string;

  sku?: string | null;

  price: number;

  stock: number;

}

interface EditOrderItem {
  productId: string;

  quantity: number;
}

interface EditOrderData {
  id: string;

  userId: string;

  addressId: string;

  shippingCost: number;

  notes: string;

  items: EditOrderItem[];
}

interface EditOrderFormProps {
  order: EditOrderData;

  customers: CustomerOption[];

  products: ProductOption[];
}

function formatCurrency(
  value: number
) {
  return `Rp ${value.toLocaleString(
    "id-ID"
  )}`;
}

function getAddressLabel(
  address: AddressOption
) {
  const parts = [
    address.label,

    address.receiverName,

    address.fullAddress,

    address.city,

    address.province,

    address.postalCode,
  ].filter(Boolean);

  return (
    parts.join(" — ") ||
    `Alamat #${address.id.slice(
      0,
      8
    )}`
  );
}

export default function EditOrderForm({
  order,
  customers,
  products,
}: EditOrderFormProps) {
  const router = useRouter();

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [
    customerId,
    setCustomerId,
  ] = useState(
    order.userId
  );

  const [
    addressId,
    setAddressId,
  ] = useState(
    order.addressId
  );

  const [
    shippingCost,
    setShippingCost,
  ] = useState(
    String(order.shippingCost)
  );

  const [
    notes,
    setNotes,
  ] = useState(
    order.notes
  );

  const [
    items,
    setItems,
  ] = useState<
    EditOrderItem[]
  >(order.items);

  const [
    selectedProductId,
    setSelectedProductId,
  ] = useState("");

  const [
    selectedQuantity,
    setSelectedQuantity,
  ] = useState("1");

  const [
    error,
    setError,
  ] = useState("");

  const selectedCustomer =
    useMemo(
      () =>
        customers.find(
          (customer) =>
            customer.id ===
            customerId
        ),
      [
        customers,
        customerId,
      ]
    );

  const addresses =
    selectedCustomer?.addresses ??
    [];

  const selectedProduct =
    products.find(
      (product) =>
        product.id ===
        selectedProductId
    );

  const subtotal =
    useMemo(() => {
      return items.reduce(
        (
          total,
          item
        ) => {
          const product =
            products.find(
              (product) =>
                product.id ===
                item.productId
            );

          if (!product) {
            return total;
          }

          return (
            total +
            product.price *
              item.quantity
          );
        },
        0
      );
    }, [items, products]);

  const shipping =
    Number(
      shippingCost
    ) || 0;

  const total =
    subtotal + shipping;

  function addProduct() {
    setError("");

    if (!selectedProduct) {
      setError(
        "Silakan pilih produk."
      );

      return;
    }

    const quantity =
      Number(
        selectedQuantity
      );

    if (
      !Number.isInteger(
        quantity
      ) ||
      quantity < 1
    ) {
      setError(
        "Quantity harus minimal 1."
      );

      return;
    }

    const existing =
      items.find(
        (item) =>
          item.productId ===
          selectedProduct.id
      );

    const nextQuantity =
      (existing?.quantity ??
        0) + quantity;

    /**
     * Untuk product yang sudah ada
     * di order, stock saat ini belum
     * dikurangi di UI.
     *
     * Karena service akan mengembalikan
     * stock lama terlebih dahulu saat
     * transaction berjalan.
     */
    if (
      nextQuantity >
      selectedProduct.stock +
        (existing?.quantity ??
          0)
    ) {
      setError(
        `Quantity ${selectedProduct.name} melebihi stock yang tersedia.`
      );

      return;
    }

    if (existing) {
      setItems(
        (current) =>
          current.map(
            (item) =>
              item.productId ===
              selectedProduct.id
                ? {
                    ...item,
                    quantity:
                      nextQuantity,
                  }
                : item
          )
      );
    } else {
      setItems(
        (current) => [
          ...current,
          {
            productId:
              selectedProduct.id,
            quantity,
          },
        ]
      );
    }

    setSelectedProductId("");

    setSelectedQuantity("1");
  }

  function removeProduct(
    productId: string
  ) {
    setItems(
      (current) =>
        current.filter(
          (item) =>
            item.productId !==
            productId
        )
    );
  }

  function updateQuantity(
    productId: string,
    quantity: number
  ) {
    const product =
      products.find(
        (item) =>
          item.id ===
          productId
      );

    if (!product) {
      return;
    }

    const safeQuantity =
      Math.max(
        1,
        Math.floor(quantity)
      );

    setItems(
      (current) =>
        current.map(
          (item) =>
            item.productId ===
            productId
              ? {
                  ...item,
                  quantity:
                    safeQuantity,
                }
              : item
        )
    );
  }

  function submit() {
    setError("");

    if (!customerId) {
      setError(
        "Customer wajib dipilih."
      );

      return;
    }

    if (!addressId) {
      setError(
        "Alamat pengiriman wajib dipilih."
      );

      return;
    }

    if (items.length === 0) {
      setError(
        "Minimal satu produk harus ada."
      );

      return;
    }

    const parsedShipping =
      Number(
        shippingCost
      );

    if (
      !Number.isFinite(
        parsedShipping
      ) ||
      parsedShipping < 0
    ) {
      setError(
        "Biaya pengiriman tidak valid."
      );

      return;
    }

    startTransition(
      async () => {
        const result =
          await updateOrderAction(
            order.id,
            {
              userId:
                customerId,

              addressId,

              shippingCost:
                parsedShipping,

              notes:
                notes.trim() ||
                undefined,

              items,
            }
          );

        if (!result.success) {
          setError(
            result.message ??
              "Gagal memperbarui order."
          );

          return;
        }

        router.push(
          `/admin/orders/${order.id}`
        );

        router.refresh();
      }
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* CUSTOMER */}

      <section className="rounded-xl border bg-background">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">
            Customer
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Customer order.
          </p>
        </div>

        <div className="p-6">
          <select
            value={customerId}
            onChange={(event) => {
              setCustomerId(
                event.target.value
              );

              setAddressId("");
            }}
            disabled={isPending}
            className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {customers.map(
              (customer) => (
                <option
                  key={
                    customer.id
                  }
                  value={
                    customer.id
                  }
                >
                  {customer.name} —{" "}
                  {customer.email}
                </option>
              )
            )}
          </select>
        </div>
      </section>

      {/* ADDRESS */}

      <section className="rounded-xl border bg-background">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">
            Alamat Pengiriman
          </h2>
        </div>

        <div className="p-6">
          <select
            value={addressId}
            onChange={(event) =>
              setAddressId(
                event.target.value
              )
            }
            disabled={
              isPending ||
              addresses.length ===
                0
            }
            className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">
              Pilih alamat pengiriman
            </option>

            {addresses.map(
              (address) => (
                <option
                  key={
                    address.id
                  }
                  value={
                    address.id
                  }
                >
                  {getAddressLabel(
                    address
                  )}
                </option>
              )
            )}
          </select>
        </div>
      </section>

      {/* PRODUCTS */}

      <section className="rounded-xl border bg-background">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">
            Produk
          </h2>
        </div>

        <div className="space-y-6 p-6">
          <div className="grid gap-3 md:grid-cols-[1fr_140px_auto]">
            <select
              value={
                selectedProductId
              }
              onChange={(event) =>
                setSelectedProductId(
                  event.target.value
                )
              }
              disabled={isPending}
              className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">
                Pilih produk
              </option>

              {products.map(
                (product) => (
                  <option
                    key={
                      product.id
                    }
                    value={
                      product.id
                    }
                  >
                    {product.name} —{" "}
                    {formatCurrency(
                      product.price
                    )}{" "}
                    — Stock{" "}
                    {product.stock}
                  </option>
                )
              )}
            </select>

            <Input
              type="number"
              min={1}
              value={
                selectedQuantity
              }
              onChange={(event) =>
                setSelectedQuantity(
                  event.target.value
                )
              }
              disabled={
                isPending ||
                !selectedProduct
              }
            />

            <Button
              type="button"
              variant="outline"
              onClick={addProduct}
              disabled={
                isPending ||
                !selectedProduct
              }
            >
              Tambah
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-3 text-left">
                    Produk
                  </th>

                  <th className="px-4 py-3 text-right">
                    Harga
                  </th>

                  <th className="px-4 py-3 text-center">
                    Qty
                  </th>

                  <th className="px-4 py-3 text-right">
                    Subtotal
                  </th>

                  <th className="px-4 py-3 text-right">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.map(
                  (item) => {
                    const product =
                      products.find(
                        (product) =>
                          product.id ===
                          item.productId
                      );

                    if (!product) {
                      return null;
                    }

                    return (
                      <tr
                        key={
                          item.productId
                        }
                        className="border-b last:border-0"
                      >
                        <td className="px-4 py-4">
                          <div className="font-medium">
                            {
                              product.name
                            }
                          </div>

                          {product.sku && (
                            <div className="text-xs text-muted-foreground">
                              SKU:{" "}
                              {
                                product.sku
                              }
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-4 text-right">
                          {formatCurrency(
                            product.price
                          )}
                        </td>

                        <td className="px-4 py-4 text-center">
                          <Input
                            type="number"
                            min={1}
                            value={
                              item.quantity
                            }
                            onChange={(
                              event
                            ) =>
                              updateQuantity(
                                item.productId,
                                Number(
                                  event
                                    .target
                                    .value
                                )
                              )
                            }
                            className="mx-auto w-20 text-center"
                            disabled={
                              isPending
                            }
                          />
                        </td>

                        <td className="px-4 py-4 text-right font-medium">
                          {formatCurrency(
                            product.price *
                              item.quantity
                          )}
                        </td>

                        <td className="px-4 py-4 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              removeProduct(
                                item.productId
                              )
                            }
                            disabled={
                              isPending
                            }
                          >
                            Hapus
                          </Button>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SHIPPING */}

      <section className="rounded-xl border bg-background">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">
            Pengiriman
          </h2>
        </div>

        <div className="p-6">
          <label
            htmlFor="shippingCost"
            className="text-sm font-medium"
          >
            Biaya Pengiriman
          </label>

          <Input
            id="shippingCost"
            type="number"
            min={0}
            value={
              shippingCost
            }
            onChange={(event) =>
              setShippingCost(
                event.target.value
              )
            }
            disabled={isPending}
            className="mt-2"
          />
        </div>
      </section>

      {/* NOTES */}

      <section className="rounded-xl border bg-background">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">
            Catatan
          </h2>
        </div>

        <div className="p-6">
          <Textarea
            value={notes}
            onChange={(event) =>
              setNotes(
                event.target.value
              )
            }
            disabled={isPending}
            rows={4}
            placeholder="Catatan order..."
          />
        </div>
      </section>

      {/* SUMMARY */}

      <section className="rounded-xl border bg-background">
        <div className="ml-auto max-w-md space-y-3 p-6">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Subtotal
            </span>

            <span>
              {formatCurrency(
                subtotal
              )}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Pengiriman
            </span>

            <span>
              {formatCurrency(
                shipping
              )}
            </span>
          </div>

          <div className="border-t pt-3">
            <div className="flex justify-between">
              <span className="font-semibold">
                Total
              </span>

              <span className="text-xl font-bold">
                {formatCurrency(
                  total
                )}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ACTION */}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() =>
            router.push(
              `/admin/orders/${order.id}`
            )
          }
        >
          Batal
        </Button>

        <Button
          type="button"
          disabled={
            isPending ||
            items.length === 0
          }
          onClick={submit}
        >
          {isPending
            ? "Menyimpan..."
            : "Simpan Perubahan"}
        </Button>
      </div>
    </div>
  );
}