import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Plus } from 'lucide-react'

const amountSchema = z.object({
  amount: z.number().min(1, 'Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  interest_rate: z.number().min(0).max(100),
  notes: z.string().optional()
})

export default function AddAmountModal({ isOpen, onClose, onSubmit, defaultInterestRate = 2 }) {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: zodResolver(amountSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      interest_rate: defaultInterestRate,
      amount: 0,
      notes: ''
    }
  })

  const handleFormSubmit = async (data) => {
    setSubmitting(true)
    try {
      await onSubmit(data)
      reset()
      onClose()
    } catch (error) {
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            {t('pledge.addAmount')}
          </h3>
          <button onClick={onClose} className="btn btn-sm btn-ghost btn-circle">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Date */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">{t('pledge.date')} *</span>
            </label>
            <input
              type="date"
              {...register('date')}
              className="input input-bordered w-full focus:border-blue-600"
            />
            {errors.date && <span className="text-error text-sm mt-1">{errors.date.message}</span>}
          </div>

          {/* Amount */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">{t('pledge.amount')} *</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
              <input
                type="number"
                {...register('amount', { valueAsNumber: true })}
                placeholder="0"
                className="input input-bordered w-full pl-8 focus:border-blue-600"
              />
            </div>
            {errors.amount && <span className="text-error text-sm mt-1">{errors.amount.message}</span>}
          </div>

          {/* Interest Rate */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">{t('pledge.interestRate')} (%)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                {...register('interest_rate', { valueAsNumber: true })}
                className="input input-bordered w-full pr-8 focus:border-blue-600"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
            </div>
          </div>

          {/* Notes */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">{t('pledge.notes')}</span>
            </label>
            <textarea
              {...register('notes')}
              placeholder={t('pledge.enterNotes')}
              className="textarea textarea-bordered w-full h-20 focus:border-blue-600"
            />
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
              className="btn bg-blue-600 hover:bg-blue-700 text-white border-none flex-1"
              disabled={submitting}
            >
              {submitting ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <Plus className="w-5 h-5" />
              )}
              {t('pledge.add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


