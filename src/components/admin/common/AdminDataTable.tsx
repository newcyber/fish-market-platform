import type { ReactNode } from "react";

interface AdminDataTableProps {
  headers: ReactNode[];

  children: ReactNode;
}

export default function AdminDataTable({
  headers,
  children,
}: AdminDataTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-6 py-4 text-left text-sm font-semibold"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}