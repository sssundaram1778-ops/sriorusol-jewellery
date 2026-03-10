import { RefreshCw } from 'lucide-react'
import { useCategoryStore } from '../store/categoryStore'

export default function LoadingSpinner({ 
  size = 'md', 
  text = 'Loading...', 
  fullScreen = false,
  className = ''
}) {
  const { activeCategory } = useCategoryStore()
  const isFirst = activeCategory === 'FIRST'
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <RefreshCw className={`${sizeClasses[size]} ${isFirst ? 'text-blue-600' : 'text-purple-600'} animate-spin`} />
      {text && <p className="text-sm text-slate-500 font-medium">{text}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    )
  }

  return spinner
}

export function LoadingOverlay({ text = 'Processing...' }) {
  return (
    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
      <LoadingSpinner text={text} />
    </div>
  )
}

export function LoadingButton({ 
  loading, 
  children, 
  className = '', 
  disabled,
  ...props 
}) {
  return (
    <button
      className={className}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <RefreshCw className="w-5 h-5 animate-spin" />
      ) : (
        children
      )}
    </button>
  )
}
