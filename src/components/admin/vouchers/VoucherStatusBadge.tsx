type VoucherStatusBadgeProps = {
  isActive: boolean;
  usageLimit: number | null;
  usageCount: number;
  startAt: Date | string | null;
  endAt: Date | string | null;
};

function getVoucherStatus({
  isActive,
  usageLimit,
  usageCount,
  startAt,
  endAt,
}: VoucherStatusBadgeProps) {
  const now = new Date();

  if (!isActive) {
    return {
      label: "Nonaktif",
      className:
        "bg-gray-100 text-gray-700 border-gray-200",
    };
  }

  if (
    startAt &&
    new Date(startAt) > now
  ) {
    return {
      label: "Belum Mulai",
      className:
        "bg-blue-50 text-blue-700 border-blue-200",
    };
  }

  if (
    endAt &&
    new Date(endAt) < now
  ) {
    return {
      label: "Berakhir",
      className:
        "bg-red-50 text-red-700 border-red-200",
    };
  }

  if (
    usageLimit !== null &&
    usageCount >= usageLimit
  ) {
    return {
      label: "Limit Habis",
      className:
        "bg-orange-50 text-orange-700 border-orange-200",
    };
  }

  return {
    label: "Aktif",
    className:
      "bg-green-50 text-green-700 border-green-200",
  };
}

export function VoucherStatusBadge(
  props: VoucherStatusBadgeProps
) {
  const status =
    getVoucherStatus(props);

  return (
    <span
      className={[
        "inline-flex",
        "items-center",
        "rounded-full",
        "border",
        "px-2.5",
        "py-1",
        "text-xs",
        "font-medium",
        status.className,
      ].join(" ")}
    >
      {status.label}
    </span>
  );
}