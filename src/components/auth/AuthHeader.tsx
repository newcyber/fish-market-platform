import { Fish } from "lucide-react";

interface AuthHeaderProps {
  title: string;
  description: string;
}

export function AuthHeader({
  title,
  description,
}: AuthHeaderProps) {
  return (
    <div className="mb-8 flex flex-col items-center text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-lg shadow-cyan-600/20">
        <Fish className="h-8 w-8" />
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        {title}
      </h1>

      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}