import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-12 w-full max-w-lg" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </CardHeader>
        <CardContent className="grid gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
