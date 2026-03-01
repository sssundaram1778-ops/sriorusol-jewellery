import { clsx } from 'clsx'

export function Input({
  label,
  error,
  prefix,
  suffix,
  className = '',
  wrapperClassName = '',
  required = false,
  ...props
}) {
  return (
    <div className={clsx('form-control', wrapperClassName)}>
      {label && (
        <label className="label">
          <span className="label-text font-medium">
            {label} {required && '*'}
          </span>
        </label>
      )}
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {prefix}
          </span>
        )}
        <input
          className={clsx(
            'input input-bordered w-full focus:border-[#D4AF37]',
            prefix && 'pl-8',
            suffix && 'pr-8',
            error && 'input-error',
            className
          )}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <span className="text-error text-sm mt-1">{error}</span>
      )}
    </div>
  )
}

export function Textarea({
  label,
  error,
  className = '',
  wrapperClassName = '',
  required = false,
  ...props
}) {
  return (
    <div className={clsx('form-control', wrapperClassName)}>
      {label && (
        <label className="label">
          <span className="label-text font-medium">
            {label} {required && '*'}
          </span>
        </label>
      )}
      <textarea
        className={clsx(
          'textarea textarea-bordered w-full focus:border-[#D4AF37]',
          error && 'textarea-error',
          className
        )}
        {...props}
      />
      {error && (
        <span className="text-error text-sm mt-1">{error}</span>
      )}
    </div>
  )
}
