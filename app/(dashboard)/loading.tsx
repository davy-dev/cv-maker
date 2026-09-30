import { Skeleton } from "@/components/ui/skeleton";

// Shown inside the dashboard layout while a page loads its data.
export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Chargement">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-gray-200 bg-white p-5">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
