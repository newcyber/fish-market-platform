import type { ColumnDef } from "@tanstack/react-table";

interface TextColumnOptions<
  TData,
  TValue = unknown,
> {
  accessorKey: keyof TData;

  header: string;

  className?: string;

  formatter?: (
    value: TValue
  ) => string;
}

export function textColumn<
  TData,
  TValue = unknown,
>({
  accessorKey,
  header,
  className,
  formatter,
}: TextColumnOptions<
  TData,
  TValue
>): ColumnDef<TData> {
  return {
    accessorKey:
      accessorKey as string,

    header,

    cell: ({ getValue }) => {
      const value =
        getValue() as TValue;

      return (
        <span
          className={[
            "font-medium",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {formatter
            ? formatter(value)
            : String(
                value ?? "-"
              )}
        </span>
      );
    },
  };
}