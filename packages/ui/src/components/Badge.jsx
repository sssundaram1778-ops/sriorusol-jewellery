import { clsx } from 'clsx'

const variants = {
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  gold: 'bg-[#D4AF37]/10 text-[#D4AF37]',
  gray: 'bg-gray-100 text-gray-600'
}

export function Badge({ 
  children, 
  variant = 'gray',
  className = '' 
}) {
  return (
    <span className={clsx(
      'text-xs px-2 py-1 rounded-full font-medium',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}
