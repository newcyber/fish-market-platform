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
  createOrderAction,
} from "@/actions/order/create-order";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

import {
  Textarea,
} from "@/components/ui/textarea";

import {
  PaymentMethod,
} from "@prisma/client";

interface AddressOption {
  id: string;

  label?: string | null;

  name?: string | null;

  address?: string | null;

  city?: string | null;

  province?: string | null;

  postalCode?: string | null;

  phone?: string | null;
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

  unit: string;
}

interface CartItem {
  productId: string;

  quantity: number;
}

interface CreateOrderFormProps {
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
    address.name,
    address.address,
    address.city,
    address.province,
    address.postalCode,
  ].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(" — ");
  }

  return `Alamat #${address.id.slice(
    0,
    8
  )}`;
}

export default function CreateOrderForm({
  customers,
  products,
}: CreateOrderFormProps) {
  const router = useRouter();

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [
    customerId,
    setCustomerId,
  ] = useState("");

  const [
    addressId,
    setAddressId,
  ] = useState("");

  const [
    shippingCost,
    setShippingCost,
  ] = useState("0");

  const [
    notes,
    setNotes,
  ] = useState("");

  const [
    selectedProductId,
    setSelectedProductId,
  ] = useState("");

  const [
    selectedQuantity,
    setSelectedQuantity,
  ] = useState("1");

  const [
    items,
    setItems,
  ] = useState<CartItem[]>([]);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
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

  const availableAddresses =
    selectedCustomer?.addresses ??
    [];

  const selectedProduct =
    useMemo(
      () =>
        products.find(
          (product) =>
            product.id ===
            selectedProductId
        ),
      [
        products,
        selectedProductId,
      ]
    );

  const subtotal =
    useMemo(() => {
      return items.reduce(
        (total, item) => {
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
    Number(shippingCost) || 0;

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
      Number(selectedQuantity);

    if (
      !Number.isInteger(
        quantity
      ) ||
      quantity < 1
    ) {
      setError(
        "Quantity produk harus minimal 1."
      );

      return;
    }

    if (
      quantity >
      selectedProduct.stock
    ) {
      setError(
        `Stock ${selectedProduct.name} hanya ${selectedProduct.stock}.`
      );

      return;
    }

    setItems(
      (currentItems) => {
        const existing =
          currentItems.find(
            (item) =>
              item.productId ===
              selectedProduct.id
          );

        if (!existing) {
          return [
            ...currentItems,
            {
              productId:
                selectedProduct.id,
              quantity,
            },
          ];
        }

        const nextQuantity =
          existing.quantity +
          quantity;

        if (
          nextQuantity >
          selectedProduct.stock
        ) {
          setError(
            `Total quantity ${selectedProduct.name} melebihi stock.`
          );

          return currentItems;
        }

        return currentItems.map(
          (item) =>
            item.productId ===
            selectedProduct.id
              ? {
                  ...item,
                  quantity:
                    nextQuantity,
                }
              : item
        );
      }
    );

    setSelectedProductId("");
    setSelectedQuantity("1");
  }

  function removeProduct(
    productId: string
  ) {
    setItems(
      (currentItems) =>
        currentItems.filter(
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
        Math.min(
          quantity,
          product.stock
        )
      );

    setItems(
      (currentItems) =>
        currentItems.map(
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

  function submitOrder() {
    setError("");
    setSuccess("");

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
        "Minimal satu produk harus dipilih."
      );

      return;
    }

    const parsedShipping =
      Number(shippingCost);

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
      await createOrderAction({
        userId: customerId,

        addressId,

        paymentMethod:
          PaymentMethod.BANK_TRANSFER,

        shippingCost:
          parsedShipping,

        notes:
          notes.trim() ||
          undefined,

        items,
      });

    if (!result.success) {
      setError(
        result.message ??
          "Gagal membuat order."
      );

      return;
    }

    setSuccess(
      "Order berhasil dibuat."
    );

    router.push(
      "/admin/orders"
    );

    router.refresh();
  }
);
  }

  return (
    <div className="space-y-6">
      {/* ================================================== */}
      {/* ERROR / SUCCESS */}
      {/* ================================================== */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* ================================================== */}
      {/* CUSTOMER */}
      {/* ================================================== */}

      <section className="rounded-xl border bg-background">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">
            Customer
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Pilih customer yang membuat order.
          </p>
        </div>

        <div className="space-y-4 p-6">
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
            <option value="">
              Pilih customer
            </option>

            {customers.map(
              (customer) => (
                <option
                  key={customer.id}
                  value={customer.id}
                >
                  {customer.name} —{" "}
                  {customer.email}
                </option>
              )
            )}
          </select>

          {selectedCustomer && (
            <div className="rounded-lg bg-muted/40 p-4 text-sm">
              <p className="font-medium">
                {selectedCustomer.name}
              </p>

              <p className="text-muted-foreground">
                {selectedCustomer.email}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ================================================== */}
      {/* ADDRESS */}
      {/* ================================================== */}

      <section className="rounded-xl border bg-background">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">
            Alamat Pengiriman
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Pilih alamat customer.
          </p>
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
              !selectedCustomer
            }
            className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">
              {!selectedCustomer
                ? "Pilih customer terlebih dahulu"
                : "Pilih alamat pengiriman"}
            </option>

            {availableAddresses.map(
              (address) => (
                <option
                  key={address.id}
                  value={address.id}
                >
                  {getAddressLabel(
                    address
                  )}
                </option>
              )
            )}
          </select>

          {selectedCustomer &&
            availableAddresses.length ===
              0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                Customer ini belum memiliki
                alamat.
              </p>
            )}
        </div>
      </section>

      {/* ================================================== */}
      {/* PRODUCTS */}
      {/* ================================================== */}

      <section className="rounded-xl border bg-background">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">
            Produk
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Tambahkan produk ke order.
          </p>
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
                    key={product.id}
                    value={product.id}
                    disabled={
                      product.stock <=
                      0
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
              max={
                selectedProduct?.stock ??
                undefined
              }
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
              placeholder="Qty"
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

          {items.length > 0 ? (
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
                              max={
                                product.stock
                              }
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
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Belum ada produk dalam order.
            </div>
          )}
        </div>
      </section>

      {/* ================================================== */}
      {/* PAYMENT + SHIPPING */}
      {/* ================================================== */}

      <section className="rounded-xl border bg-background">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">
            Pembayaran & Pengiriman
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Atur biaya pengiriman dan metode pembayaran.
          </p>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-2">
          <div className="space-y-2">
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
              value={shippingCost}
              onChange={(event) =>
                setShippingCost(
                  event.target.value
                )
              }
              disabled={isPending}
              placeholder="0"
            />

            <p className="text-xs text-muted-foreground">
              Masukkan 0 jika tidak ada biaya
              pengiriman.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Metode Pembayaran
            </label>

            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              Bank Transfer
            </div>

            <p className="text-xs text-muted-foreground">
              Saat ini OrderService hanya menerima
              Bank Transfer.
            </p>
          </div>
        </div>
      </section>

      {/* ================================================== */}
      {/* NOTES */}
      {/* ================================================== */}

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
            placeholder="Catatan tambahan untuk order..."
            rows={4}
          />
        </div>
      </section>

      {/* ================================================== */}
      {/* SUMMARY */}
      {/* ================================================== */}

      <section className="rounded-xl border bg-background">
        <div className="ml-auto w-full max-w-md space-y-3 p-6">
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-muted-foreground">
              Subtotal
            </span>

            <span>
              {formatCurrency(
                subtotal
              )}
            </span>
          </div>

          <div className="flex justify-between gap-4 text-sm">
            <span className="text-muted-foreground">
              Pengiriman
            </span>

            <span>
              {formatCurrency(
                shipping
              )}
            </span>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between gap-4">
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

      {/* ================================================== */}
      {/* ACTION */}
      {/* ================================================== */}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            router.push(
              "/admin/orders"
            )
          }
          disabled={isPending}
        >
          Batal
        </Button>

        <Button
          type="button"
          onClick={submitOrder}
          disabled={
            isPending ||
            !customerId ||
            !addressId ||
            items.length === 0
          }
        >
          {isPending
            ? "Membuat Order..."
            : "Buat Order"}
        </Button>
      </div>
    </div>
  );
}