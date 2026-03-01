import { clsx } from 'clsx'

export function LoadingSpinner({ 
  size = 'lg',
  className = '' 
}) {
  return (
    <span className={clsx(
      'loading loading-spinner text-[#D4AF37]',
      `loading-${size}`,
      className
    )}></span>
  )
}

export function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="text-center animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F4E4BC] flex items-center justify-center animate-pulse-glow">
          <span className="text-white text-2xl font-bold">ஸ்</span>
        </div>
        <LoadingSpinner size="lg" />
        <p className="text-gray-500 text-sm mt-3">Loading...</p>
      </div>
    </div>
  )
}

// Skeleton components for loading states
export function SkeletonCard({ className = '' }) {
  return (
    <div className={clsx('glass rounded-2xl p-4 animate-fade-in', className)}>
      <div className="flex justify-between items-start mb-3">
        <div className="skeleton h-6 w-24 rounded-lg"></div>
        <div className="skeleton h-4 w-20 rounded"></div>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className="skeleton w-10 h-10 rounded-full"></div>
        <div className="flex-1">
          <div className="skeleton h-5 w-32 mb-2 rounded"></div>
          <div className="skeleton h-3 w-20 rounded"></div>
        </div>
      </div>
      <div className="skeleton h-8 w-full rounded mt-3"></div>
    </div>
  )
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      <div className="glass rounded-xl p-4">
        <div className="skeleton h-10 w-10 rounded-xl mb-2"></div>
        <div className="skeleton h-8 w-16 rounded mb-2"></div>
        <div className="skeleton h-3 w-24 rounded"></div>
      </div>
      <div className="glass rounded-xl p-4">
        <div className="skeleton h-10 w-10 rounded-xl mb-2"></div>
        <div className="skeleton h-8 w-16 rounded mb-2"></div>
        <div className="skeleton h-3 w-24 rounded"></div>
      </div>
    </div>
  )
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="space-y-3 stagger-children">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
