import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-8">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-6 p-8">
          <h1 className="text-3xl font-bold">
            Fish Market Platform
          </h1>

          <p className="text-center text-muted-foreground">
            Foundation berhasil dibuat.
          </p>

          <Button>Mulai Sekarang</Button>
        </CardContent>
      </Card>
    </main>
  );
}