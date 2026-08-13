import type {
  PropsWithChildren,
} from "react";

export default function PageContainer({
  children,
}: PropsWithChildren) {
  return (
    <div className="space-y-6 p-6">
      {children}
    </div>
  );
}