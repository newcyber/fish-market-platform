import { Search } from "lucide-react";

interface SiteSearchProps {
  mobile?: boolean;
}

export default function SiteSearch({
  mobile = false,
}: SiteSearchProps) {
  return (
    <form
      action="/customer/products"
      method="GET"
      role="search"
      className={[
        "relative",
        mobile
          ? "w-full"
          : "w-full max-w-md lg:max-w-lg",
      ].join(" ")}
    >
      <Search
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-3.5
          top-1/2
          h-4
          w-4
          -translate-y-1/2
          text-slate-400
        "
      />

      <input
        type="search"
        name="search"
        placeholder="Cari ikan, udang, cumi..."
        aria-label="Cari produk"
        className="
          h-10
          w-full

          rounded-xl

          border
          border-slate-200

          bg-slate-50

          pl-10
          pr-4

          text-sm
          text-slate-900

          outline-none
          transition

          placeholder:text-slate-400

          hover:border-slate-300

          focus:border-(--fresh-400)
          focus:bg-white
          focus:ring-4
          focus:ring-(--fresh-100)
        "
      />
    </form>
  );
}
