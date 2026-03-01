import { clsx } from 'clsx'

export function EmptyState({ 
  icon: Icon,
  title,
  description,
  action,
  className = ''
}) {
  return (
    <div className={clsx('text-center py-12', className)}>
      {Icon && (
        <Icon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
      )}
      {title && <p className="text-gray-500 font-medium">{title}</p>}
      {description && <p className="text-gray-400 text-sm mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
