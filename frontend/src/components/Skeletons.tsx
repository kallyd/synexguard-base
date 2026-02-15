export const CardSkeleton = ({ lines = 3 }: { lines?: number }) => (
  <div className="card animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div>
        <div className="w-24 h-3 bg-white/10 rounded mb-2" />
        <div className="w-16 h-8 bg-white/15 rounded" />
      </div>
      <div className="w-10 h-10 bg-white/10 rounded-xl" />
    </div>
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-3 bg-white/5 rounded ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  </div>
)

export const StatCardSkeleton = () => (
  <div className="card animate-pulse">
    <div className="flex items-start justify-between">
      <div>
        <div className="w-20 h-3 bg-white/10 rounded mb-2" />
        <div className="w-12 h-8 bg-white/15 rounded" />
      </div>
      <div className="w-10 h-10 bg-white/10 rounded-xl" />
    </div>
  </div>
)

export const TableSkeleton = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
  <div className="card">
    <div className="w-32 h-5 bg-white/15 rounded mb-4" />
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className={`h-4 bg-white/5 rounded animate-pulse ${
                j === 0 ? 'w-8' : j === cols - 1 ? 'w-16' : 'flex-1'
              }`}
              style={{
                animationDelay: `${(i * cols + j) * 100}ms`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
)

export const ServerCardSkeleton = () => (
  <div className="card animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div>
        <div className="w-24 h-4 bg-white/15 rounded mb-1" />
        <div className="w-32 h-3 bg-white/10 rounded" />
      </div>
      <div className="w-16 h-5 bg-white/10 rounded-full" />
    </div>
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex justify-between">
          <div className="w-16 h-3 bg-white/5 rounded" />
          <div className="w-12 h-3 bg-white/10 rounded" />
        </div>
      ))}
    </div>
  </div>
)

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div className="xl:col-span-2">
        <TableSkeleton rows={8} cols={3} />
      </div>
      <div>
        <CardSkeleton lines={6} />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <CardSkeleton key={i} lines={2} />
      ))}
    </div>
  </div>
)