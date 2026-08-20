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
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <form
          method="GET"
          className="flex flex-1 flex-col gap-3 sm:flex-row"
        >
          {/* SEARCH */}

          <div className="w-full sm:max-w-sm">
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

          <div className="w-full sm:w-48">
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

          <div className="w-full sm:w-52">
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

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              Filter
            </button>

            <Link
              href="/admin/vouchers"
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Reset
            </Link>
          </div>
        </form>

        {/* CREATE VOUCHER */}

        <Link
          href="/admin/vouchers/create"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          + Tambah Voucher
        </Link>
      </div>
    </div>
  );
}