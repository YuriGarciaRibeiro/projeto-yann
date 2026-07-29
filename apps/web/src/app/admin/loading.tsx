import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground md:px-8 md:py-10 xl:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <Skeleton className="h-6 w-32 rounded-none" />
        <Skeleton className="h-12 w-full max-w-lg rounded-none" />
        <Card className="rounded-none">
          <CardHeader>
            <Skeleton className="h-6 w-48 rounded-none" />
            <Skeleton className="h-4 w-full max-w-2xl rounded-none" />
          </CardHeader>
          <CardContent className="grid gap-3">
            <Skeleton className="h-10 w-full rounded-none" />
            <Skeleton className="h-10 w-full rounded-none" />
            <Skeleton className="h-10 w-full rounded-none" />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
