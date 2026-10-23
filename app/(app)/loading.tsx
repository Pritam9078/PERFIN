import { Skeleton } from '@/components/ui/card';

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="mb-6 h-12 w-72" />
      <div className="grid gap-4 lg:grid-cols-12">
        <Skeleton className="h-56 rounded-card lg:col-span-5" />
        <Skeleton className="h-56 rounded-card lg:col-span-3" />
        <Skeleton className="h-56 rounded-card lg:col-span-4" />
        <Skeleton className="h-80 rounded-card lg:col-span-8" />
        <Skeleton className="h-80 rounded-card lg:col-span-4" />
      </div>
    </div>
  );
}
