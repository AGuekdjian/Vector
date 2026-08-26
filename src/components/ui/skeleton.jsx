export function Skeleton({ className = "h-5 w-full" }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-lg bg-zinc-200/80 ${className}`}
    />
  );
}

export function CardSkeleton({ count = 3 }) {
  return Array.from({ length: count }, (_, index) => (
    <div key={index} className="surface-card space-y-3 p-5" aria-hidden="true">
      <Skeleton className="h-4 w-2/5" />
      <Skeleton className="h-8 w-1/4" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  ));
}

export function ListSkeleton({ count = 5 }) {
  return (
    <div
      className="surface-card divide-y divide-zinc-100"
      aria-label="Cargando información"
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="space-y-2 p-4" aria-hidden="true">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}
