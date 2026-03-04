import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, CheckCircle, Calendar } from 'lucide-react'
import DateInput from './DateInput'
import { useCategoryStore } from '../store/categoryStore'

const closeSchema = z.object({
  release_date: z.string().min(1, 'Release date is required')
})

export default function CloseOwnerRepledgeModal({
  isOpen,
  onClose,
  onSubmit,
  ownerRepledge
}) {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const { activeCategory } = useCategoryStore()
  const isFirst = activeCategory === 'FIRST'

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm({
    resolver: zodResolver(closeSchema),
    defaultValues: {
      release_date: new Date().toISOString().split('T')[0]
    }
  })

  useEffect(() => {
    if (isOpen) {
      reset({
        release_date: new Date().toISOString().split('T')[0]
      })
    }
  }, [isOpen, reset])

  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(num)
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const handleFormSubmit = async (data) => {
    setSubmitting(true)
    try {
      await onSubmit(data.release_date)
      reset()
      onClose()
    } catch (error) {
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen || !ownerRepledge) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            {t('ownerRepledge.closeTitle')}
          </h3>
          <button onClick={onClose} className="btn btn-sm btn-ghost btn-circle">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Re-Pledge Info */}
        <div className={`${isFirst ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'} rounded-lg p-3 mb-4 border`}>
          <div className="text-sm space-y-1">
            <p><span className={`${isFirst ? 'text-blue-700' : 'text-purple-700'}`}>{t('ownerRepledge.financerName')}:</span> <span className={`font-medium ${isFirst ? 'text-blue-900' : 'text-purple-900'}`}>{ownerRepledge.financer_name}</span></p>
            <p><span className={`${isFirst ? 'text-blue-700' : 'text-purple-700'}`}>{t('ownerRepledge.amount')}:</span> <span className={`font-medium ${isFirst ? 'text-blue-900' : 'text-purple-900'}`}>{formatCurrency(ownerRepledge.amount)}</span></p>
            <p><span className={`${isFirst ? 'text-blue-700' : 'text-purple-700'}`}>{t('ownerRepledge.debtDate')}:</span> <span className={`font-medium ${isFirst ? 'text-blue-900' : 'text-purple-900'}`}>{formatDate(ownerRepledge.debt_date)}</span></p>
            {ownerRepledge.interest_amount > 0 && (
              <p><span className={`${isFirst ? 'text-blue-700' : 'text-purple-700'}`}>{t('ownerRepledge.interestAmount')}:</span> <span className="font-medium text-orange-600">{formatCurrency(ownerRepledge.interest_amount)}</span></p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Release Date */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t('ownerRepledge.releaseDate')} *
              </span>
            </label>
            <DateInput
              value={watch('release_date')}
              onChange={(e) => setValue('release_date', e.target.value)}
              className="input input-bordered w-full focus:border-green-500"
            />
            {errors.release_date && <span className="text-error text-sm mt-1">{errors.release_date.message}</span>}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline flex-1"
              disabled={submitting}
            >
              {t('pledge.cancel')}
            </button>
            <button
              type="submit"
              className="btn bg-green-500 hover:bg-green-600 text-white border-none flex-1"
              disabled={submitting}
            >
              {submitting ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              {t('ownerRepledge.closeRepledge')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


