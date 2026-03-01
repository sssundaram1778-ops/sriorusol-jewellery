import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, RefreshCw, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react'

const returnSchema = z.object({
  total_amount: z.number().min(1, 'Total amount must be greater than 0'),
  new_date: z.string().min(1, 'Date is required'),
  interest_rate: z.number().min(0).max(100),
  notes: z.string().optional()
})

export default function AdditionalAmountReturnModal({
  isOpen, 
  onClose, 
  onSubmit, 
  pledge, 
  defaultInterestRate = 2 
}) {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState(1) // Step 1: Review, Step 2: Enter new amount

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      new_date: new Date().toISOString().split('T')[0],
      interest_rate: defaultInterestRate,
      total_amount: pledge?.totalPrincipal || 0,
      notes: ''
    }
  })

  const totalAmount = watch('total_amount') || 0
  const currentPrincipal = pledge?.totalPrincipal || 0
  const additionalAmount = Math.max(0, totalAmount - currentPrincipal)

  useEffect(() => {
    if (isOpen) {
      setStep(1)
      reset({
        new_date: new Date().toISOString().split('T')[0],
        interest_rate: defaultInterestRate,
        total_amount: pledge?.totalPrincipal || 0,
        notes: ''
      })
    }
  }, [isOpen, reset, defaultInterestRate, pledge?.totalPrincipal])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount || 0)
  }

  const handleFormSubmit = async (data) => {
    setSubmitting(true)
    try {
      await onSubmit({
        ...data,
        settlement_amount: pledge?.grandTotal || 0,
        old_principal: pledge?.totalPrincipal || 0,
        old_interest: pledge?.totalInterest || 0,
        additional_amount: additionalAmount,
        new_total_amount: totalAmount
      })
      reset()
      setStep(1)
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
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-emerald-600" />
            {t('pledge.repledgeForAdditional')}
          </h3>
          <button onClick={onClose} className="btn btn-sm btn-ghost btn-circle">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium ${
            step >= 1 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
          }`}>1</div>
          <div className={`flex-1 h-1 rounded ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
          <div className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium ${
            step >= 2 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
          }`}>2</div>
        </div>

        {/* Step 1: Review Current Pledge Settlement */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Info Alert */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">{t('pledge.repledgeProcessInfo')}</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>{t('pledge.repledgeStep1')}</li>
                    <li>{t('pledge.repledgeStep2')}</li>
                    <li>{t('pledge.repledgeStep3')}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Current Pledge Summary */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h4 className="font-semibold text-slate-800 text-sm mb-3">
                {t('pledge.currentPledgeSummary')}
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">{t('pledge.pledgeNo')}:</span>
                  <span className="font-medium text-slate-800">{pledge?.pledge_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">{t('pledge.customerName')}:</span>
                  <span className="font-medium text-slate-800">{pledge?.customer_name}</span>
                </div>
                <div className="border-t border-slate-200 my-2"></div>
                <div className="flex justify-between">
                  <span className="text-slate-600">{t('pledge.totalPrincipal')}:</span>
                  <span className="font-medium text-slate-800">{formatCurrency(pledge?.totalPrincipal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">{t('pledge.totalInterest')}:</span>
                  <span className="font-medium text-emerald-600">+{formatCurrency(pledge?.totalInterest)}</span>
                </div>
                <div className="border-t border-slate-200 my-2"></div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-800">{t('pledge.settlementAmount')}:</span>
                  <span className="font-bold text-lg text-red-600">{formatCurrency(pledge?.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Settlement Confirmation */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <div className="flex gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-800">
                  {t('pledge.settlementConfirmation')}
                </p>
              </div>
            </div>

            {/* Continue Button */}
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full btn bg-emerald-500 hover:bg-emerald-600 text-white border-none"
            >
              {t('pledge.proceedToNewPledge')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        )}

        {/* Step 2: Enter New Pledge Details */}
        {step === 2 && (
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* Reference Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <span className="font-medium">{t('pledge.referencePledge')}:</span> {pledge?.pledge_no}
              </p>
            </div>

            {/* New Pledge Date */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">{t('pledge.newPledgeDate')} *</span>
              </label>
              <input
                type="date"
                {...register('new_date')}
                className="input input-bordered w-full focus:border-emerald-500"
              />
              {errors.new_date && <span className="text-error text-sm mt-1">{errors.new_date.message}</span>}
            </div>

            {/* Total Amount */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">{t('pledge.totalAmount')} *</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                <input
                  type="number"
                  {...register('total_amount', { valueAsNumber: true })}
                  placeholder="0"
                  className="input input-bordered w-full pl-8 focus:border-emerald-500"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {t('pledge.currentPrincipal')}: {formatCurrency(currentPrincipal)}
              </p>
              {errors.total_amount && <span className="text-error text-sm mt-1">{errors.total_amount.message}</span>}
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
                  className="input input-bordered w-full pr-8 focus:border-emerald-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {t('pledge.defaultRates')}: {t('pledge.gold')} 2%, {t('pledge.silver')} 3%
              </p>
            </div>

            {/* New Pledge Summary */}
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <h4 className="font-semibold text-emerald-900 text-sm mb-3">
                {t('pledge.newPledgeSummary')}
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-emerald-700">{t('pledge.currentPrincipal')}:</span>
                  <span className="font-medium text-slate-800">{formatCurrency(currentPrincipal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-700">{t('pledge.additionalAmount')}:</span>
                  <span className="font-medium text-emerald-600">+{formatCurrency(additionalAmount)}</span>
                </div>
                <div className="border-t border-emerald-200 my-2"></div>
                <div className="flex justify-between">
                  <span className="font-semibold text-emerald-900">{t('pledge.newTotalLoan')}:</span>
                  <span className="font-bold text-lg text-emerald-700">{formatCurrency(totalAmount)}</span>
                </div>
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
                className="textarea textarea-bordered w-full h-16 focus:border-emerald-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-outline flex-1"
                disabled={submitting}
              >
                {t('pledge.back')}
              </button>
              <button
                type="submit"
                className="btn bg-emerald-500 hover:bg-emerald-600 text-white border-none flex-1"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <RefreshCw className="w-5 h-5" />
                )}
                {t('pledge.createNewPledge')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}


