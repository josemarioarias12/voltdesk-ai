// Skeleton.tsx — Base skeleton components for async data loading

interface SkeletonProps {
  className?: string
}

export function SkeletonLine({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-slate-200 rounded h-4 ${className}`} />
  )
}

export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-6 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2 flex-1">
          <SkeletonLine className="w-3/4 h-5" />
          <SkeletonLine className="w-1/2 h-4" />
        </div>
        <div className="animate-pulse bg-slate-200 rounded-full h-8 w-16 ml-4" />
      </div>
      <div className="space-y-2">
        <SkeletonLine className="w-full" />
        <SkeletonLine className="w-5/6" />
      </div>
      <div className="flex gap-2 mt-4">
        <div className="animate-pulse bg-slate-200 rounded-full h-6 w-20" />
        <div className="animate-pulse bg-slate-200 rounded-full h-6 w-16" />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200">
        <SkeletonLine className="w-48 h-5" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="px-6 py-4 flex items-center gap-4">
            <div className="animate-pulse bg-slate-200 rounded-full h-8 w-8 shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonLine className="w-2/3 h-4" />
              <SkeletonLine className="w-1/3 h-3" />
            </div>
            <div className="animate-pulse bg-slate-200 rounded-full h-6 w-20" />
            <div className="animate-pulse bg-slate-200 rounded h-6 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="animate-pulse bg-slate-200 rounded-lg h-10 w-10" />
              <div className="animate-pulse bg-slate-200 rounded-full h-6 w-16" />
            </div>
            <SkeletonLine className="w-1/2 h-7 mb-1" />
            <SkeletonLine className="w-3/4 h-3" />
          </div>
        ))}
      </div>
      {/* Chart row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6">
            <SkeletonLine className="w-48 h-5 mb-6" />
            <div className="animate-pulse bg-slate-100 rounded-xl h-48" />
          </div>
        ))}
      </div>
      {/* Table row */}
      <SkeletonTable rows={4} />
    </div>
  )
}

export function SkeletonTicketDetail() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-2 flex-1">
            <SkeletonLine className="w-2/3 h-7" />
            <div className="flex gap-2">
              <div className="animate-pulse bg-slate-200 rounded-full h-6 w-20" />
              <div className="animate-pulse bg-slate-200 rounded-full h-6 w-16" />
              <div className="animate-pulse bg-slate-200 rounded-full h-6 w-24" />
            </div>
          </div>
          <div className="animate-pulse bg-slate-200 rounded-xl h-10 w-32" />
        </div>
        <div className="space-y-2">
          <SkeletonLine className="w-full" />
          <SkeletonLine className="w-full" />
          <SkeletonLine className="w-4/5" />
        </div>
      </div>
      <div className="animate-pulse bg-slate-200 rounded-2xl h-32" />
      <SkeletonTable rows={3} />
    </div>
  )
}