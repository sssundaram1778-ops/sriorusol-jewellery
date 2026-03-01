import { X } from 'lucide-react'
import { clsx } from 'clsx'

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children,
  icon: Icon,
  iconColor = 'text-[#D4AF37]',
  size = 'md',
  className = ''
}) {
  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={clsx(
        'bg-white rounded-xl p-6 w-full max-h-[90vh] overflow-y-auto',
        sizes[size],
        className
      )}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            {Icon && <Icon className={clsx('w-5 h-5', iconColor)} />}
            {title}
          </h3>
          <button 
            onClick={onClose} 
            className="btn btn-sm btn-ghost btn-circle"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
