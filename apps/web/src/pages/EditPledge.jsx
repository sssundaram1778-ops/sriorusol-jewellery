import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { usePledgeStore } from '../store/pledgeStore'
import { Save, X, CircleDot, ChevronLeft, Edit2 } from 'lucide-react'

const pledgeSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  place: z.string().optional(),
  customer_name: z.string().min(1, 'Customer name is required'),
  phone_number: z.string().optional(),
  jewels_details: z.string().optional(),
  no_of_items: z.number().min(1).default(1),
  gross_weight: z.number().min(0).optional(),
  net_weight: z.number().min(0).optional(),
  jewel_type: z.enum(['GOLD', 'SILVER', 'MIXED']).default('GOLD'),
  interest_rate: z.number().min(0).max(100).default(2)
})

export default function EditPledge() {
  const { id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { currentPledge, fetchPledgeById, updatePledge, isLoading, clearCurrentPledge } = usePledgeStore()
  const [submitting, setSubmitting] = useState(false)
  const [selectedJewelType, setSelectedJewelType] = useState('GOLD')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    resolver: zodResolver(pledgeSchema),
    defaultValues: {
      date: '',
      no_of_items: 1,
      gross_weight: '',
      net_weight: '',
      jewel_type: 'GOLD',
      interest_rate: 2
    }
  })

  useEffect(() => {
    if (id) fetchPledgeById(id)
    return () => clearCurrentPledge()
  }, [id, fetchPledgeById, clearCurrentPledge])

  useEffect(() => {
    if (currentPledge) {
      const jewelType = currentPledge.jewel_type || 'GOLD'
      setSelectedJewelType(jewelType)
      reset({
        date: currentPledge.date,
        place: currentPledge.place || '',
        customer_name: currentPledge.customer_name,
        phone_number: currentPledge.phone_number || '',
        jewels_details: currentPledge.jewels_details || '',
        no_of_items: currentPledge.no_of_items || 1,
        gross_weight: currentPledge.gross_weight || '',
        net_weight: currentPledge.net_weight || '',
        jewel_type: jewelType,
        interest_rate: currentPledge.interest_rate || 2
      })
    }
  }, [currentPledge, reset])

  // Handle jewel type change - auto-set interest rate
  const handleJewelTypeChange = (type) => {
    setSelectedJewelType(type)
    setValue('jewel_type', type)
    if (type === 'GOLD') {
      setValue('interest_rate', 2)
    } else if (type === 'SILVER') {
      setValue('interest_rate', 3)
    }
    // MIXED keeps current rate or allows custom
  }

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      await updatePledge(id, data)
      toast.success(t('messages.pledgeUpdated'))
      navigate(`/pledge/${id}`)
    } catch (error) {
      toast.error(error.message || t('common.error'))
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading || !currentPledge) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-blue-600"></span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-50 pb-24">
      {/* Header */}
      <div className="bg-blue-50 border-b border-blue-200/50">
        <div className="px-4 py-3 flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50 hover:bg-slate-200 transition-colors border border-slate-200"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/25">
              <Edit2 className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-800">{t('pledge.editPledge')}</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-4 py-4 space-y-4">
        {/* Pledge No (Read-only) */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">{t('pledge.pledgeNo')}</span>
          </label>
          <input
            type="text"
            value={currentPledge.pledge_no}
            disabled
            className="input input-bordered w-full bg-slate-50"
          />
        </div>

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

        {/* Customer Name & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">{t('pledge.customerName')} *</span>
            </label>
            <input
              type="text"
              {...register('customer_name')}
              placeholder={t('pledge.enterCustomerName')}
              className="input input-bordered w-full focus:border-blue-600"
            />
            {errors.customer_name && <span className="text-error text-sm mt-1">{errors.customer_name.message}</span>}
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">{t('pledge.phoneNumber')}</span>
            </label>
            <input
              type="tel"
              {...register('phone_number')}
              placeholder="Enter phone number"
              className="input input-bordered w-full focus:border-blue-600"
            />
          </div>
        </div>

        {/* Place */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">{t('pledge.place')}</span>
          </label>
          <input
            type="text"
            {...register('place')}
            placeholder={t('pledge.enterPlace')}
            className="input input-bordered w-full focus:border-blue-600"
          />
        </div>

        {/* Jewel Type Selector */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">{t('pledge.jewelType')} *</span>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleJewelTypeChange('GOLD')}
              className={`flex-1 btn btn-sm h-12 ${
                selectedJewelType === 'GOLD'
                  ? 'bg-blue-600 text-white border-none hover:bg-blue-700'
                  : 'btn-outline border-blue-600 text-blue-600'
              }`}
            >
              <CircleDot className="w-4 h-4" />
              {t('pledge.gold')} (2%)
            </button>
            <button
              type="button"
              onClick={() => handleJewelTypeChange('SILVER')}
              className={`flex-1 btn btn-sm h-12 ${
                selectedJewelType === 'SILVER'
                  ? 'bg-slate-500 text-white border-none hover:bg-gray-600'
                  : 'btn-outline border-gray-400 text-slate-600'
              }`}
            >
              <CircleDot className="w-4 h-4" />
              {t('pledge.silver')} (3%)
            </button>
            <button
              type="button"
              onClick={() => handleJewelTypeChange('MIXED')}
              className={`flex-1 btn btn-sm h-12 ${
                selectedJewelType === 'MIXED'
                  ? 'bg-blue-500 text-white border-none hover:bg-blue-600'
                  : 'btn-outline border-blue-400 text-blue-600'
              }`}
            >
              <CircleDot className="w-4 h-4" />
              {t('pledge.mixed')}
            </button>
          </div>
          <input type="hidden" {...register('jewel_type')} />
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
              placeholder="2"
              className="input input-bordered w-full pr-8 focus:border-blue-600"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
          </div>
          <label className="label">
            <span className="label-text-alt text-slate-500">
              {t('pledge.defaultRates')}: {t('pledge.gold')} 2%, {t('pledge.silver')} 3%
            </span>
          </label>
        </div>

        {/* Jewels Details */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">{t('pledge.jewelsDetails')}</span>
          </label>
          <textarea
            {...register('jewels_details')}
            placeholder={t('pledge.enterJewelsDetails')}
            className="textarea textarea-bordered w-full h-24 focus:border-blue-600"
          />
        </div>

        {/* No of Items */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">{t('pledge.noOfItems')}</span>
          </label>
          <input
            type="number"
            {...register('no_of_items', { valueAsNumber: true })}
            min="1"
            className="input input-bordered w-full focus:border-blue-600"
          />
        </div>

        {/* Gross Weight & Net Weight */}
        <div className="grid grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">{t('pledge.grossWeight')}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                {...register('gross_weight', { valueAsNumber: true })}
                placeholder="0.000"
                className="input input-bordered w-full pr-8 focus:border-blue-600"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">g</span>
            </div>
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">{t('pledge.netWeight')}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                {...register('net_weight', { valueAsNumber: true })}
                placeholder="0.000"
                className="input input-bordered w-full pr-8 focus:border-blue-600"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">g</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-outline flex-1"
            disabled={submitting}
          >
            <X className="w-5 h-5" />
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
              <Save className="w-5 h-5" />
            )}
            {t('pledge.save')}
          </button>
        </div>
      </form>
    </div>
  )
}




















