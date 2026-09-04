"use client";

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  Check,
  ChevronDown,
  Loader2,
  X,
} from "lucide-react";

import {
  getCartProductVariants,
} from "@/actions/cart/get-cart-product-variants";

import {
  changeCartItemSkuAction,
} from "@/actions/cart/change-cart-item-sku";

function formatRupiah(value: unknown) {
  const amount =
    typeof value === "number"
      ? value
      : Number(value);

  if (!Number.isFinite(amount)) {
    return "Rp 0";
  }

  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }
  ).format(amount);
}

interface VariantOption {
  id: string;
  label: string;
  sortOrder: number;
}

interface VariantGroup {
  id: string;
  name: string;
  sortOrder: number;
  options: VariantOption[];
}

interface SkuOption {
  variantOptionId: string;
  label: string;
  groupId: string;
  groupName: string;
}

interface ProductSku {
  id: string;
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
  options: SkuOption[];
}

interface VariantData {
  productId: string;
  productName: string;
  currentSkuId: string | null;
  variantGroups: VariantGroup[];
  skus: ProductSku[];
}

interface CartVariantSheetProps {
  cartItemId: string;
  productName: string;
  currentSkuId: string | null;
  currentLabel: string;
  onChanged?: () => void;
}

export default function CartVariantSheet({
  cartItemId,
  productName,
  currentSkuId,
  currentLabel,
  onChanged,
}: CartVariantSheetProps) {
  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );

  const [
    data,
    setData,
  ] = useState<VariantData | null>(
    null
  );

  const [
    selectedOptions,
    setSelectedOptions,
  ] = useState<
    Record<string, string>
  >({});

  /**
   * ==========================================================
   * OPEN SHEET
   * ==========================================================
   */

  async function handleOpen() {
    setIsOpen(true);
    setError(null);

    if (data) {
      return;
    }

    setIsLoading(true);

    try {
      const result =
        await getCartProductVariants({
          cartItemId,
        });

      if (!result.success) {
        setError(
          result.message ??
            "Gagal mengambil varian."
        );
        return;
      }

      if (!result.success || !result.data) {
        setError(
          result.message ??
            "Gagal mengambil varian."
        );
        return;
      }

      const variantData =
        result.data;

      setData(variantData);

      /**
       * ======================================================
       * INITIAL SELECTION
       * ======================================================
       *
       * Ambil option dari SKU yang sedang dipakai.
       */

      const currentSku =
        variantData.skus.find(
          (sku) =>
            sku.id ===
            variantData.currentSkuId
        );

      if (currentSku) {
        const initialSelection:
          Record<string, string> = {};

        for (const option of currentSku.options) {
          initialSelection[
            option.groupId
          ] =
            option.variantOptionId;
        }

        setSelectedOptions(
          initialSelection
        );
      }
    } catch {
      setError(
        "Gagal mengambil pilihan varian."
      );
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * ==========================================================
   * CLOSE
   * ==========================================================
   */

  function handleClose() {
    if (isPending) {
      return;
    }

    setIsOpen(false);
  }

  /**
   * ==========================================================
   * OPTION SELECTION
   * ==========================================================
   */

  function handleSelectOption(
    groupId: string,
    optionId: string
  ) {
    setSelectedOptions(
      (current) => ({
        ...current,
        [groupId]: optionId,
      })
    );

    setError(null);
  }

  /**
   * ==========================================================
   * RESOLVE SELECTED SKU
   * ==========================================================
   *
   * SKU valid hanya apabila:
   *
   * 1. aktif
   * 2. memiliki jumlah option yang sesuai
   * 3. setiap option yang dipilih cocok
   */

  const selectedSku =
    useMemo(() => {
      if (!data) {
        return null;
      }

      const selectedGroupIds =
        data.variantGroups
          .filter(
            (group) =>
              group.options.length > 0
          )
          .map(
            (group) => group.id
          );

      if (
        selectedGroupIds.length ===
        0
      ) {
        return data.skus.find(
          (sku) =>
            sku.isActive
        ) ?? null;
      }

      const allGroupsSelected =
        selectedGroupIds.every(
          (groupId) =>
            Boolean(
              selectedOptions[
                groupId
              ]
            )
        );

      if (!allGroupsSelected) {
        return null;
      }

      return (
        data.skus.find(
          (sku) => {
            if (!sku.isActive) {
              return false;
            }

            if (
              sku.options.length !==
              selectedGroupIds.length
            ) {
              return false;
            }

            return selectedGroupIds.every(
              (groupId) => {
                const selectedOptionId =
                  selectedOptions[
                    groupId
                  ];

                return sku.options.some(
                  (option) =>
                    option.groupId ===
                      groupId &&
                    option.variantOptionId ===
                      selectedOptionId
                );
              }
            );
          }
        ) ?? null
      );
    }, [
      data,
      selectedOptions,
    ]);

  /**
   * ==========================================================
   * SAVE
   * ==========================================================
   */

  function handleSave() {
    if (!selectedSku) {
      setError(
        "Silakan pilih kombinasi varian yang tersedia."
      );
      return;
    }

    if (selectedSku.stock <= 0) {
      setError(
        "Varian yang dipilih sedang habis."
      );
      return;
    }

    if (
      selectedSku.id ===
      currentSkuId
    ) {
      setIsOpen(false);
      return;
    }

    setError(null);

    startTransition(
      async () => {
        const result =
          await changeCartItemSkuAction({
            cartItemId,
            skuId:
              selectedSku.id,
          });

        if (!result.success) {
          setError(
            result.message ??
              "Gagal mengubah varian."
          );
          return;
        }

        setIsOpen(false);

        /**
         * Cart parent dapat melakukan refresh
         * setelah server action selesai.
         */

        onChanged?.();
      }
    );
  }

  /**
   * ==========================================================
   * SELECTED LABEL
   * ==========================================================
   */

  const selectedLabel =
    selectedSku?.options
      .map(
        (option) =>
          option.label
      )
      .join(" • ") ??
    currentLabel;

  return (
    <>
      {/* ==================================================== */}
      {/* TRIGGER                                              */}
      {/* ==================================================== */}

      <button
        type="button"
        onClick={handleOpen}
        className="
          mt-1
          inline-flex
          max-w-full
          items-center
          gap-1
          rounded-md
          text-left
          text-[12px]
          font-medium
          text-emerald-700
          transition
          hover:text-emerald-800
        "
      >
        <span className="truncate">
          {selectedLabel ||
            "Pilih varian"}
        </span>

        <ChevronDown
          className="
            h-3.5
            w-3.5
            shrink-0
          "
        />
      </button>

      {/* ==================================================== */}
      {/* SHEET OVERLAY                                        */}
      {/* ==================================================== */}

      {isOpen && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-end
            justify-center
          "
        >
          {/* BACKDROP */}

          <button
            type="button"
            aria-label="Tutup pilihan varian"
            onClick={handleClose}
            className="
              absolute
              inset-0
              bg-black/40
            "
          />

          {/* ================================================= */}
          {/* SHEET                                             */}
          {/* ================================================= */}

          <section
            className="
              relative
              z-10
              w-full
              max-w-2xl
              overflow-hidden
              rounded-t-2xl
              bg-white
              shadow-2xl
            "
          >
            {/* HEADER */}

            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-slate-200
                px-4
                py-4
              "
            >
              <div className="min-w-0">
                <h2
                  className="
                    text-base
                    font-bold
                    text-slate-950
                  "
                >
                  Pilih Varian
                </h2>

                <p
                  className="
                    mt-0.5
                    truncate
                    text-xs
                    text-slate-500
                  "
                >
                  {productName}
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-slate-100
                  text-slate-600
                  transition
                  hover:bg-slate-200
                "
                aria-label="Tutup"
              >
                <X
                  className="
                    h-5
                    w-5
                  "
                />
              </button>
            </div>

            {/* CONTENT */}

            <div
              className="
                max-h-[65vh]
                overflow-y-auto
                px-4
                py-4
              "
            >
              {isLoading ? (
                <div
                  className="
                    flex
                    min-h-40
                    items-center
                    justify-center
                  "
                >
                  <Loader2
                    className="
                      h-6
                      w-6
                      animate-spin
                      text-emerald-600
                    "
                  />
                </div>
              ) : error && !data ? (
                <div
                  className="
                    rounded-xl
                    bg-red-50
                    px-4
                    py-3
                    text-sm
                    text-red-700
                  "
                >
                  {error}
                </div>
              ) : data ? (
                <div className="space-y-5">
                  {data.variantGroups.map(
                    (group) => (
                      <div
                        key={group.id}
                      >
                        <h3
                          className="
                            text-sm
                            font-semibold
                            text-slate-900
                          "
                        >
                          {group.name}
                        </h3>

                        <div
                          className="
                            mt-2
                            flex
                            flex-wrap
                            gap-2
                          "
                        >
                          {group.options.map(
                            (option) => {
                              const isSelected =
                                selectedOptions[
                                  group.id
                                ] ===
                                option.id;

                              const matchingSku =
                                data.skus.find(
                                  (sku) => {
                                    if (
                                      !sku.isActive
                                    ) {
                                      return false;
                                    }

                                    return sku.options.some(
                                      (skuOption) =>
                                        skuOption.groupId ===
                                          group.id &&
                                        skuOption.variantOptionId ===
                                          option.id
                                    );
                                  }
                                );

const hasStock =
  data.skus.some(
    (sku) => {
      /**
       * SKU harus aktif dan memiliki stok.
       */
      if (
        !sku.isActive ||
        sku.stock <= 0
      ) {
        return false;
      }

      /**
       * Option yang sedang diperiksa harus
       * ada pada SKU ini.
       */
      const currentOptionMatches =
        sku.options.some(
          (skuOption) =>
            skuOption.groupId ===
              group.id &&
            skuOption.variantOptionId ===
              option.id
        );

      if (!currentOptionMatches) {
        return false;
      }

      /**
       * Semua pilihan dari group lain yang
       * SUDAH dipilih harus cocok dengan SKU ini.
       *
       * Group yang sedang diperiksa sengaja
       * tidak ikut dibandingkan karena option
       * candidate sudah dicek di atas.
       */
      return Object.entries(
        selectedOptions
      ).every(
        ([selectedGroupId, selectedOptionId]) => {
          if (
            selectedGroupId ===
            group.id
          ) {
            return true;
          }

          return sku.options.some(
            (skuOption) =>
              skuOption.groupId ===
                selectedGroupId &&
              skuOption.variantOptionId ===
                selectedOptionId
          );
        }
      );
    }
  );

                              return (
                                <button
                                  key={
                                    option.id
                                  }
                                  type="button"
                                  disabled={
                                    !hasStock
                                  }
                                  onClick={() =>
                                    handleSelectOption(
                                      group.id,
                                      option.id
                                    )
                                  }
                                  className={`
                                    relative
                                    rounded-lg
                                    border
                                    px-3
                                    py-2
                                    text-sm
                                    transition
                                    ${
                                      isSelected
                                        ? "border-emerald-600 bg-emerald-50 font-semibold text-emerald-700"
                                        : hasStock
                                          ? "border-slate-200 bg-white text-slate-700 hover:border-emerald-300"
                                          : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                                    }
                                  `}
                                >
                                  {option.label}

                                  {isSelected && (
                                    <Check
                                      className="
                                        ml-1
                                        inline-block
                                        h-3.5
                                        w-3.5
                                      "
                                    />
                                  )}

                                  {!hasStock && (
                                    <span
                                      className="
                                        ml-1
                                        text-[10px]
                                      "
                                    >
                                      Habis
                                    </span>
                                  )}

                                  {matchingSku &&
                                    hasStock &&
                                    matchingSku.options.length ===
                                      1 && (
                                      <span className="sr-only">
                                        Tersedia
                                      </span>
                                    )}
                                </button>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )
                  )}

                  {data.variantGroups.length ===
                    0 && (
                    <div
                      className="
                        rounded-xl
                        bg-slate-50
                        px-4
                        py-4
                        text-sm
                        text-slate-600
                      "
                    >
                      Produk ini tidak
                      memiliki pilihan
                      varian.
                    </div>
                  )}

                  {/* ======================================= */}
                  {/* SELECTED SKU                             */}
                  {/* ======================================= */}

                  {selectedSku && (
                    <div
                      className="
                        rounded-xl
                        border
                        border-emerald-100
                        bg-emerald-50
                        px-4
                        py-3
                      "
                    >
                      <div
                        className="
                          flex
                          items-center
                          justify-between
                          gap-3
                        "
                      >
                        <div>
                          <p
                            className="
                              text-xs
                              text-emerald-700
                            "
                          >
                            Pilihan Anda
                          </p>

                          <p
                            className="
                              mt-0.5
                              text-sm
                              font-semibold
                              text-slate-950
                            "
                          >
                            {selectedSku.options
                              .map(
                                (option) =>
                                  option.label
                              )
                              .join(" • ")}
                          </p>
                        </div>

                        <div className="text-right">
                          <p
                            className="
                              text-base
                              font-bold
                              text-slate-950
                            "
                          >
                            {formatRupiah(
                              selectedSku.price
                            )}
                          </p>

                          <p
                            className="
                              text-[11px]
                              text-slate-500
                            "
                          >
                            Stok{" "}
                            {
                              selectedSku.stock
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div
                      className="
                        rounded-lg
                        bg-red-50
                        px-3
                        py-2
                        text-xs
                        text-red-700
                      "
                    >
                      {error}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* FOOTER */}

            <div
              className="
                border-t
                border-slate-200
                bg-white
                px-4
                pb-[calc(env(safe-area-inset-bottom)+1rem)]
                pt-3
              "
            >
              <button
                type="button"
                onClick={handleSave}
                disabled={
                  isPending ||
                  isLoading ||
                  !selectedSku
                }
                className="
                  flex
                  h-11
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-emerald-600
                  text-sm
                  font-bold
                  text-white
                  transition
                  hover:bg-emerald-700
                  disabled:cursor-not-allowed
                  disabled:bg-slate-300
                "
              >
                {isPending ? (
                  <>
                    <Loader2
                      className="
                        h-4
                        w-4
                        animate-spin
                      "
                    />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Pilihan"
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
