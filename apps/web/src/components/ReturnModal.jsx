import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, UserPlus } from 'lucide-react'
import DateInput from './DateInput'

const returnSchema = z.object({
  new_customer_name: z.string().min(1, 'New customer name is required'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  interest_rate: z.number().min(0).max(100),
  notes: z.string().optional()
})

export default function ReturnModal({ isOpen, onClose, onSubmit, pledge, defaultInterestRate = 2 }) {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      interest_rate: defaultInterestRate,
      amount: pledge?.grandTotal || pledge?.totalPrincipal || 0,
      new_customer_name: '',
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
            <UserPlus className="w-5 h-5 text-blue-500" />
            {t('pledge.repledge')}
          </h3>
          <button onClick={onClose} className="btn btn-sm btn-ghost btn-circle">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            {t('pledge.repledgeInfo')}
          </p>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* New Customer Name */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">{t('pledge.newCustomerName')} *</span>
            </label>
            <input
              type="text"
              {...register('new_customer_name')}
              placeholder={t('pledge.enterNewCustomerName')}
              className="input input-bordered w-full focus:border-blue-600"
            />
            {errors.new_customer_name && <span className="text-error text-sm mt-1">{errors.new_customer_name.message}</span>}
          </div>

          {/* Date */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">{t('pledge.date')} *</span>
            </label>
            <DateInput
              value={watch('date')}
              onChange={(e) => setValue('date', e.target.value)}
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
              className="btn bg-blue-500 hover:bg-blue-600 text-white border-none flex-1"
              disabled={submitting}
            >
              {submitting ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
              {t('pledge.transfer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


