import Link from "next/link";

type VoucherToolbarProps = {
  search?: string;
  isActive?: string;
  discountType?: string;
};

export function VoucherToolbar({
  search = "",
  isActive = "",
  discountType = "",
}: VoucherToolbarProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <form
          method="GET"
          className="grid w-full flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(280px,1fr)_192px_208px_auto] lg:items-end"
        >
          {/* SEARCH */}

          <div className="w-full min-w-0">
            <label
              htmlFor="search"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Cari Voucher
            </label>

            <input
              id="search"
              name="search"
              type="search"
              defaultValue={search}
              placeholder="Cari kode atau nama voucher..."
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* STATUS FILTER */}

          <div className="w-full min-w-0">
            <label
              htmlFor="isActive"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Status
            </label>

            <select
              id="isActive"
              name="isActive"
              defaultValue={isActive}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">
                Semua Status
              </option>

              <option value="true">
                Aktif
              </option>

              <option value="false">
                Nonaktif
              </option>
            </select>
          </div>

          {/* DISCOUNT TYPE FILTER */}

          <div className="w-full min-w-0">
            <label
              htmlFor="discountType"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Tipe Diskon
            </label>

            <select
              id="discountType"
              name="discountType"
              defaultValue={discountType}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">
                Semua Tipe
              </option>

              <option value="PERCENTAGE">
                Persentase
              </option>

              <option value="FIXED_AMOUNT">
                Nominal
              </option>
            </select>
          </div>

          {/* SUBMIT */}

          <div className="flex w-full gap-2 sm:col-span-2 lg:col-span-1 lg:w-auto">
            <button
              type="submit"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/30 sm:flex-none"
            >
              Filter
            </button>

            <Link
              href="/admin/vouchers"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 sm:flex-none"
            >
              Reset
            </Link>
          </div>
        </form>

        {/* CREATE VOUCHER */}

        <Link
          href="/admin/vouchers/create"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 lg:w-auto"
        >
          + Tambah Voucher
        </Link>
      </div>
    </div>
  );
}