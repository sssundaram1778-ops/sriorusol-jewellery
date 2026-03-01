import { clsx } from 'clsx'

const variants = {
  primary: 'bg-[#D4AF37] hover:bg-[#B8963A] text-white border-none',
  secondary: 'btn-outline border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white',
  danger: 'bg-red-500 hover:bg-red-600 text-white border-none',
  ghost: 'btn-ghost text-[#D4AF37]',
  outline: 'btn-outline'
}

const sizes = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg'
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  disabled = false,
  className = '',
  icon: Icon,
  ...props 
}) {
  return (
    <button
      className={clsx(
        'btn',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="loading loading-spinner loading-sm"></span>
      ) : Icon ? (
        <Icon className="w-5 h-5" />
      ) : null}
      {children}
    </button>
  )
}
