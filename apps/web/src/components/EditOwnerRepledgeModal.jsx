import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Landmark, Edit2, Search } from 'lucide-react'
import { getFinancerList } from '../lib/database'
import DateInput from './DateInput'
import { useCategoryStore } from '../store/categoryStore'

const editOwnerRepledgeSchema = z.object({
  financer_name: z.string().min(1, 'Financer name is required'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  debt_date: z.string().min(1, 'Debt date is required'),
  notes: z.string().optional()
})

export default function EditOwnerRepledgeModal({
  isOpen,
  onClose,
  onSubmit,
  ownerRepledge
}) {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [financerList, setFinancerList] = useState([])
  const [filteredFinancers, setFilteredFinancers] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { activeCategory } = useCategoryStore()
  const isFirst = activeCategory === 'FIRST'

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    resolver: zodResolver(editOwnerRepledgeSchema),
    defaultValues: {
      financer_name: '',
      amount: 0,
      debt_date: '',
      notes: ''
    }
  })

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && ownerRepledge) {
      const amount = parseFloat(ownerRepledge.amount) || 0
      // Format date to yyyy-mm-dd (handle ISO timestamp or Date object)
      let debtDateValue = ownerRepledge.debt_date || ''
      if (debtDateValue instanceof Date) {
        debtDateValue = debtDateValue.toISOString().split('T')[0]
      } else if (typeof debtDateValue === 'string' && debtDateValue.includes('T')) {
        debtDateValue = debtDateValue.split('T')[0]
      }
      reset({
        financer_name: ownerRepledge.financer_name || '',
        amount: amount,
        debt_date: debtDateValue,
        notes: ownerRepledge.notes || ''
      })
      setSearchQuery(ownerRepledge.financer_name || '')
      setShowSuggestions(false)
      
      // Fetch financer list
      getFinancerList().then(list => {
        setFinancerList(list)
      }).catch(err => console.error('Error loading financers:', err))
    }
  }, [isOpen, ownerRepledge, reset])

  // Filter financers based on search
  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = financerList.filter(f => 
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredFinancers(filtered)
    } else {
      setFilteredFinancers([])
      setShowSuggestions(false)
    }
  }, [searchQuery, financerList])

  const handleFinancerSelect = (financer) => {
    setValue('financer_name', financer.name)
    setSearchQuery(financer.name)
    setShowSuggestions(false)
  }

  const handleFinancerInputChange = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    setValue('financer_name', value)
    if (value.length > 0) {
      setShowSuggestions(true)
    }
  }

  const handleFormSubmit = async (data) => {
    setSubmitting(true)
    try {
      await onSubmit(ownerRepledge.id, data)
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
      <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Edit2 className={`w-5 h-5 ${isFirst ? 'text-blue-600' : 'text-purple-600'}`} />
            {t('ownerRepledge.editTitle') || 'Edit Financer Pledge'}
          </h3>
          <button onClick={onClose} className="btn btn-sm btn-ghost btn-circle">
            <X className="w-5 h-5" />
          </button>
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
                className={`input input-bordered w-full pl-10 ${isFirst ? 'focus:border-blue-500' : 'focus:border-purple-500'}`}
                autoComplete="off"
              />
            </div>
            {/* Suggestions Dropdown */}
            {showSuggestions && filteredFinancers.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredFinancers.map((financer, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleFinancerSelect(financer)}
                    className={`w-full px-4 py-2 text-left ${isFirst ? 'hover:bg-blue-50' : 'hover:bg-purple-50'} border-b border-slate-100 last:border-0`}
                  >
                    <span className="font-medium text-slate-800">{financer.name}</span>
                    {financer.place && <span className="text-slate-500 text-sm ml-2">({financer.place})</span>}
                  </button>
                ))}
              </div>
            )}
            {errors.financer_name && <span className="text-error text-sm mt-1">{errors.financer_name.message}</span>}
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
                className={`input input-bordered w-full pl-8 ${isFirst ? 'focus:border-blue-500' : 'focus:border-purple-500'}`}
              />
            </div>
            {errors.amount && <span className="text-error text-sm mt-1">{errors.amount.message}</span>}
          </div>

          {/* Debt Date */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">{t('ownerRepledge.debtDate')} *</span>
            </label>
            <DateInput
              value={watch('debt_date')}
              onChange={(e) => setValue('debt_date', e.target.value)}
              className={`input input-bordered w-full ${isFirst ? 'focus:border-blue-500' : 'focus:border-purple-500'}`}
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
              className={`textarea textarea-bordered w-full h-16 ${isFirst ? 'focus:border-blue-500' : 'focus:border-purple-500'}`}
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
              className={`btn ${isFirst ? 'bg-blue-500 hover:bg-blue-600' : 'bg-purple-500 hover:bg-purple-600'} text-white border-none flex-1`}
              disabled={submitting}
            >
              {submitting ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <Edit2 className="w-5 h-5" />
              )}
              {t('pledge.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
