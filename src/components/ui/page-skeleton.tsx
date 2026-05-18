// PageSkeleton — skeletons preset por padrão de página do Orion.
// Substitui o spinner Loader2 que ainda é usado em várias telas.
// Reduz layout shift (Cumulative Layout Shift) e melhora percepção de velocidade.

import { Skeleton } from "@/components/ui/skeleton";

interface PageSkeletonProps {
  variant?: "dashboard" | "list" | "kanban" | "detail" | "studio";
}

const HeaderSkeleton = () => (
  <div className="flex items-center justify-between gap-4 flex-wrap">
    <div className="space-y-2">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-9 w-28" />
      <Skeleton className="h-9 w-32" />
    </div>
  </div>
);

const KpiRowSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className={`grid grid-cols-2 ${count > 2 ? "md:grid-cols-4" : ""} gap-3`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
    ))}
  </div>
);

const CardListSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="flex justify-between items-start">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    ))}
  </div>
);

export const PageSkeleton = ({ variant = "list" }: PageSkeletonProps) => {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <HeaderSkeleton />

      {variant === "dashboard" && (
        <>
          <KpiRowSkeleton count={4} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CardListSkeleton count={3} />
            <CardListSkeleton count={3} />
          </div>
        </>
      )}

      {variant === "list" && <CardListSkeleton count={5} />}

      {variant === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardListSkeleton count={3} />
          <CardListSkeleton count={2} />
          <CardListSkeleton count={4} />
        </div>
      )}

      {variant === "detail" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 space-y-3">
            <CardListSkeleton count={4} />
          </div>
          <div className="md:col-span-2 space-y-3">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      )}

      {variant === "studio" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 space-y-3">
            <CardListSkeleton count={4} />
          </div>
          <div className="lg:col-span-2 space-y-3">
            <Skeleton className="h-40 w-full rounded-xl" />
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageSkeleton;
