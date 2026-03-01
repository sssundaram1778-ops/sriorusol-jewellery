import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Landmark, FileText, Search } from 'lucide-react'
import { getFinancerList } from '../lib/database'

const ownerRepledgeSchema = z.object({
  financer_name: z.string().min(1, 'Financer name is required'),
  financer_place: z.string().optional(),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  interest_amount: z.number().min(0).optional(),
  debt_date: z.string().min(1, 'Debt date is required'),
  notes: z.string().optional()
})

export default function OwnerRepledgeModal({
  isOpen,
  onClose,
  onSubmit,
  pledge
}) {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [financerList, setFinancerList] = useState([])
  const [filteredFinancers, setFilteredFinancers] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    resolver: zodResolver(ownerRepledgeSchema),
    defaultValues: {
      financer_name: '',
      financer_place: '',
      amount: 0,
      interest_amount: 0,
      debt_date: new Date().toISOString().split('T')[0],
      notes: ''
    }
  })

  // Load financer list on modal open
  useEffect(() => {
    if (isOpen) {
      reset({
        financer_name: '',
        financer_place: '',
        amount: 0,
        interest_amount: 0,
        debt_date: new Date().toISOString().split('T')[0],
        notes: ''
      })
      setSearchQuery('')
      setShowSuggestions(false)
      
      // Fetch financer list
      getFinancerList().then(list => {
        setFinancerList(list)
      }).catch(err => console.error('Error loading financers:', err))
    }
  }, [isOpen, reset])

  // Filter financers based on search
  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = financerList.filter(f => 
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredFinancers(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setFilteredFinancers([])
      setShowSuggestions(false)
    }
  }, [searchQuery, financerList])

  const handleFinancerSelect = (financer) => {
    setValue('financer_name', financer.name)
    setValue('financer_place', financer.place || '')
    setSearchQuery(financer.name)
    setShowSuggestions(false)
  }

  const handleFinancerInputChange = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    setValue('financer_name', value)
  }

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
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Landmark className="w-5 h-5 text-blue-600" />
            {t('ownerRepledge.title')}
          </h3>
          <button onClick={onClose} className="btn btn-sm btn-ghost btn-circle">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Jewellery Info (Read-only) */}
        <div className="bg-slate-50 rounded-lg p-3 mb-4 border border-slate-200">
          <h4 className="font-semibold text-slate-800 text-sm mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            {t('ownerRepledge.jewelleryDetails')}
          </h4>
          <div className="text-sm space-y-1">
            <p><span className="text-slate-500">{t('pledge.pledgeNo')}:</span> <span className="font-medium">{pledge?.pledge_no}</span></p>
            <p><span className="text-slate-500">{t('pledge.customerName')}:</span> <span className="font-medium">{pledge?.customer_name}</span></p>
            <p><span className="text-slate-500">{t('pledge.jewelsDetails')}:</span> <span className="font-medium">{pledge?.jewels_details || '-'}</span></p>
            <p><span className="text-slate-500">{t('pledge.netWeight')}:</span> <span className="font-medium">{pledge?.net_weight || 0}g</span></p>
          </div>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Financer Name with Search */}
          <div className="form-control relative">
            <label className="label">
              <span className="label-text font-medium">{t('ownerRepledge.financerName')} *</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleFinancerInputChange}
                onFocus={() => searchQuery.length > 0 && filteredFinancers.length > 0 && setShowSuggestions(true)}
                placeholder={t('ownerRepledge.searchFinancer')}
                className="input input-bordered w-full pl-10 focus:border-blue-500"
                autoComplete="off"
              />
            </div>
            {/* Suggestions Dropdown */}
            {showSuggestions && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredFinancers.map((financer, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleFinancerSelect(financer)}
                    className="w-full px-4 py-2 text-left hover:bg-blue-50 border-b border-slate-100 last:border-0"
                  >
                    <span className="font-medium text-slate-800">{financer.name}</span>
                    {financer.place && <span className="text-slate-500 text-sm ml-2">({financer.place})</span>}
                  </button>
                ))}
              </div>
            )}
            {errors.financer_name && <span className="text-error text-sm mt-1">{errors.financer_name.message}</span>}
            {financerList.length > 0 && (
              <p className="text-xs text-slate-500 mt-1">{t('ownerRepledge.searchHint')}</p>
            )}
          </div>

          {/* Financer Place */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">{t('ownerRepledge.financerPlace')}</span>
            </label>
            <input
              type="text"
              {...register('financer_place')}
              placeholder={t('ownerRepledge.enterFinancerPlace')}
              className="input input-bordered w-full focus:border-blue-500"
            />
          </div>

          {/* Amount */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">{t('ownerRepledge.amount')} *</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
              <input
                type="number"
                {...register('amount', { valueAsNumber: true })}
                placeholder="0"
                className="input input-bordered w-full pl-8 focus:border-blue-500"
              />
            </div>
            {errors.amount && <span className="text-error text-sm mt-1">{errors.amount.message}</span>}
          </div>

          {/* Interest Amount (Optional) */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">{t('ownerRepledge.interestAmount')} ({t('common.optional')})</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
              <input
                type="number"
                {...register('interest_amount', { valueAsNumber: true })}
                placeholder="0"
                className="input input-bordered w-full pl-8 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Debt Date */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">{t('ownerRepledge.debtDate')} *</span>
            </label>
            <input
              type="date"
              {...register('debt_date')}
              className="input input-bordered w-full focus:border-blue-500"
            />
            {errors.debt_date && <span className="text-error text-sm mt-1">{errors.debt_date.message}</span>}
          </div>

          {/* Notes */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">{t('pledge.notes')}</span>
            </label>
            <textarea
              {...register('notes')}
              placeholder={t('pledge.enterNotes')}
              className="textarea textarea-bordered w-full h-16 focus:border-blue-500"
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
                <Landmark className="w-5 h-5" />
              )}
              {t('ownerRepledge.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


