import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { usePledgeStore } from '../store/pledgeStore'
import { usePledgeStoreSecond } from '../store/pledgeStoreSecond'
import { useCategoryStore } from '../store/categoryStore'
import { Save, X, CircleDot, ChevronLeft, Edit2, Wallet } from 'lucide-react'
import DateInput from '../components/DateInput'

const pledgeSchema = z.object({
  pledge_no: z.string().min(1, 'Pledge number is required'),
  date: z.string().min(1, 'Date is required'),
  place: z.string().optional(),
  customer_name: z.string().min(1, 'Customer name is required'),
  phone_number: z.string().optional(),
  jewels_details: z.string().optional(),
  no_of_items: z.number().min(1).default(1),
  gross_weight: z.union([z.number().min(0), z.literal('')]).optional(),
  net_weight: z.union([z.number().min(0), z.literal('')]).optional(),
  jewel_type: z.enum(['GOLD', 'SILVER', 'MIXED']).default('GOLD'),
  interest_rate: z.number().min(0).max(100).default(2),
  initialAmount: z.number().min(1, 'Loan amount must be greater than 0')
})

export default function EditPledge() {
  const { id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { activeCategory } = useCategoryStore()
  const isFirst = activeCategory === 'FIRST'
  
  // Use appropriate store based on category
  const storeFirst = usePledgeStore()
  const storeSecond = usePledgeStoreSecond()
  const { currentPledge, fetchPledgeById, updatePledge, isLoading, clearCurrentPledge } = 
    activeCategory === 'FIRST' ? storeFirst : storeSecond
    
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
      pledge_no: '',
      date: '',
      place: '',
      customer_name: '',
      phone_number: '',
      jewels_details: '',
      no_of_items: 1,
      gross_weight: '',
      net_weight: '',
      jewel_type: 'GOLD',
      interest_rate: 2,
      initialAmount: 0
    }
  })

  useEffect(() => {
    if (id) {
      fetchPledgeById(id).catch(err => {
        console.error('Failed to fetch pledge:', err)
      })
    }
    return () => clearCurrentPledge()
  }, [id, fetchPledgeById, clearCurrentPledge])

  useEffect(() => {
    if (currentPledge) {
      const jewelType = currentPledge.jewel_type || 'GOLD'
      setSelectedJewelType(jewelType)
      // Get initial amount from first amount entry or totalPrincipal
      const initialAmountEntry = currentPledge.amounts?.find(a => a.amount_type === 'INITIAL')
      const initialAmountValue = parseFloat(initialAmountEntry?.amount) 
        || parseFloat(currentPledge.totalPrincipal) 
        || 0
      reset({
        pledge_no: currentPledge.pledge_no || '',
        date: currentPledge.date || '',
        place: currentPledge.place || '',
        customer_name: currentPledge.customer_name || '',
        phone_number: currentPledge.phone_number || '',
        jewels_details: currentPledge.jewels_details || '',
        no_of_items: parseInt(currentPledge.no_of_items) || 1,
        gross_weight: parseFloat(currentPledge.gross_weight) || '',
        net_weight: parseFloat(currentPledge.net_weight) || '',
        jewel_type: jewelType,
        interest_rate: parseFloat(currentPledge.interest_rate) || 2,
        initialAmount: initialAmountValue
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
      <div className={`min-h-screen flex items-center justify-center ${isFirst ? 'bg-blue-50' : 'bg-purple-50'}`}>
        <span className={`loading loading-spinner loading-lg ${isFirst ? 'text-blue-600' : 'text-purple-600'}`}></span>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isFirst ? 'bg-blue-50' : 'bg-purple-50'} pb-24`}>
      {/* Header */}
      <div className={`${isFirst ? 'bg-blue-50 border-blue-200/50' : 'bg-purple-50 border-purple-200/50'} border-b`}>
        <div className="px-4 py-3 flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50 hover:bg-slate-200 transition-colors border border-slate-200"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 ${isFirst ? 'bg-gradient-to-br from-blue-600 to-blue-500 shadow-blue-500/25' : 'bg-gradient-to-br from-purple-600 to-purple-500 shadow-purple-500/25'} rounded-xl flex items-center justify-center shadow-md`}>
              <Edit2 className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-800">{t('pledge.editPledge')}</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-4 py-4 space-y-4">
        {/* Pledge No */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">{t('pledge.pledgeNo')} *</span>
          </label>
          <input
            type="text"
            {...register('pledge_no')}
            placeholder="Enter pledge number"
            className={`input input-bordered w-full ${isFirst ? 'focus:border-blue-600' : 'focus:border-purple-600'}`}
          />
          {errors.pledge_no && <span className="text-error text-sm mt-1">{errors.pledge_no.message}</span>}
        </div>

        {/* Date */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">{t('pledge.date')} *</span>
          </label>
          <DateInput
            value={watch('date')}
            onChange={(e) => setValue('date', e.target.value)}
            className={`input input-bordered w-full ${isFirst ? 'focus:border-blue-600' : 'focus:border-purple-600'}`}
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
              className={`input input-bordered w-full ${isFirst ? 'focus:border-blue-600' : 'focus:border-purple-600'}`}
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
              className={`input input-bordered w-full ${isFirst ? 'focus:border-blue-600' : 'focus:border-purple-600'}`}
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
            className={`input input-bordered w-full ${isFirst ? 'focus:border-blue-600' : 'focus:border-purple-600'}`}
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
                  ? isFirst 
                    ? 'bg-blue-600 text-white border-none hover:bg-blue-700'
                    : 'bg-purple-600 text-white border-none hover:bg-purple-700'
                  : isFirst 
                    ? 'btn-outline border-blue-600 text-blue-600'
                    : 'btn-outline border-purple-600 text-purple-600'
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
                  ? isFirst 
                    ? 'bg-blue-500 text-white border-none hover:bg-blue-600'
                    : 'bg-purple-500 text-white border-none hover:bg-purple-600'
                  : isFirst 
                    ? 'btn-outline border-blue-400 text-blue-600'
                    : 'btn-outline border-purple-400 text-purple-600'
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
            className={`textarea textarea-bordered w-full h-24 ${isFirst ? 'focus:border-blue-600' : 'focus:border-purple-600'}`}
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
            className={`input input-bordered w-full ${isFirst ? 'focus:border-blue-600' : 'focus:border-purple-600'}`}
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
                className={`input input-bordered w-full pr-8 ${isFirst ? 'focus:border-blue-600' : 'focus:border-purple-600'}`}
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
                className={`input input-bordered w-full pr-8 ${isFirst ? 'focus:border-blue-600' : 'focus:border-purple-600'}`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">g</span>
            </div>
          </div>
        </div>

        {/* Loan Amount */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">{t('pledge.loanAmount')} *</h2>
              <p className="text-xs text-slate-500">Edit the loan amount</p>
            </div>
          </div>
          <div className="form-control">
            <div className="relative">
              <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${isFirst ? 'text-blue-600' : 'text-purple-600'} font-bold text-xl`}>₹</span>
              <input
                type="number"
                {...register('initialAmount', { valueAsNumber: true })}
                placeholder="0"
                className={`w-full h-16 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-2xl font-bold placeholder-gray-300 tabular-nums focus:bg-white ${isFirst ? 'focus:border-blue-600 focus:ring-blue-600/10' : 'focus:border-purple-600 focus:ring-purple-600/10'} focus:ring-2 outline-none transition-all`}
              />
            </div>
            {errors.initialAmount && <span className="text-red-500 text-xs mt-1.5 block">{errors.initialAmount.message}</span>}
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
            className={`btn ${isFirst ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'} text-white border-none flex-1`}
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




















