import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-transparent border-t-primary" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}
