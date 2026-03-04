import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { usePledgeStore } from '../store/pledgeStore'
import { usePledgeStoreSecond } from '../store/pledgeStoreSecond'
import { useCategoryStore } from '../store/categoryStore'
import { Save, X, ChevronLeft, User, Gem, Wallet } from 'lucide-react'
import DateInput from '../components/DateInput'
import CategoryBadge from '../components/CategoryBadge'

const pledgeSchema = z.object({
  pledge_no: z.string().min(1, 'Pledge number is required'),
  date: z.string().min(1, 'Date is required'),
  place: z.string().optional(),
  customer_name: z.string().min(1, 'Customer name is required'),
  phone_number: z.string().optional(),
  initialAmount: z.number().min(1, 'Loan amount must be greater than 0'),
  jewels_details: z.string().optional(),
  no_of_items: z.number().min(1).default(1),
  gross_weight: z.number().min(0).optional(),
  net_weight: z.number().min(0).optional(),
  jewel_type: z.enum(['GOLD', 'SILVER', 'MIXED']).default('GOLD'),
  interest_rate: z.number().min(0).max(100).default(2)
})

export default function NewPledge() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { activeCategory } = useCategoryStore()
  
  // Use appropriate store based on category
  const storeFirst = usePledgeStore()
  const storeSecond = usePledgeStoreSecond()
  const { createPledge } = activeCategory === 'FIRST' ? storeFirst : storeSecond
  const isFirst = activeCategory === 'FIRST'
  
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
      date: new Date().toISOString().split('T')[0],
      no_of_items: 1,
      initialAmount: '',
      gross_weight: '',
      net_weight: '',
      jewel_type: 'GOLD',
      interest_rate: 2
    }
  })

  const handleJewelTypeChange = (type) => {
    setSelectedJewelType(type)
    setValue('jewel_type', type)
    if (type === 'GOLD') setValue('interest_rate', 2)
    else if (type === 'SILVER') setValue('interest_rate', 3)
  }

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      await createPledge(data)
      toast.success(t('messages.pledgeCreated'))
      reset()
      navigate('/')
    } catch (error) {
      toast.error(error.message || t('common.error'))
    } finally {
      setSubmitting(false)
    }
  }

  const jewelTypes = [
    { type: 'GOLD', label: 'Gold', rate: '2%', bg: 'bg-amber-500', activeBg: 'bg-amber-600', icon: '🥇' },
    { type: 'SILVER', label: 'Silver', rate: '3%', bg: 'bg-slate-400', activeBg: 'bg-slate-500', icon: '🥈' },
    { type: 'MIXED', label: 'Mixed', rate: 'Custom', bg: isFirst ? 'bg-blue-500' : 'bg-purple-500', activeBg: isFirst ? 'bg-blue-600' : 'bg-purple-600', icon: '💎' }
  ]

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
              <Save className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-800">{t('pledge.createNew')}</h1>
              <CategoryBadge showLabel={false} />
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-4 py-5 space-y-4">
        {/* Section: Customer Info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-10 h-10 rounded-xl ${isFirst ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-purple-500 to-purple-600'} flex items-center justify-center shadow-sm`}>
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">Customer Details</h2>
              <p className="text-xs text-slate-500">Enter customer information</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Pledge No <span className="text-red-500">*</span></label>
              <input
                type="text"
                {...register('pledge_no')}
                placeholder="Enter pledge number"
                className={`w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-gray-400 focus:bg-white ${isFirst ? 'focus:border-blue-600 focus:ring-blue-600/10' : 'focus:border-purple-600 focus:ring-purple-600/10'} focus:ring-2 outline-none transition-all text-sm font-semibold`}
              />
              {errors.pledge_no && <span className="text-red-500 text-xs mt-1.5 block">{errors.pledge_no.message}</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">{t('pledge.customerName')} <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  {...register('customer_name')}
                  placeholder="Enter customer name"
                  className={`w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-gray-400 focus:bg-white ${isFirst ? 'focus:border-blue-600 focus:ring-blue-600/10' : 'focus:border-purple-600 focus:ring-purple-600/10'} focus:ring-2 outline-none transition-all text-sm`}
                />
                {errors.customer_name && <span className="text-red-500 text-xs mt-1.5 block">{errors.customer_name.message}</span>}
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">{t('pledge.phoneNumber')}</label>
                <input
                  type="tel"
                  {...register('phone_number')}
                  placeholder="Enter phone number"
                  className={`w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-gray-400 focus:bg-white ${isFirst ? 'focus:border-blue-600 focus:ring-blue-600/10' : 'focus:border-purple-600 focus:ring-purple-600/10'} focus:ring-2 outline-none transition-all text-sm`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">{t('pledge.date')} <span className="text-red-500">*</span></label>
                <DateInput
                  value={watch('date')}
                  onChange={(e) => setValue('date', e.target.value)}
                  className={`w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white ${isFirst ? 'focus:border-blue-500 focus:ring-blue-500/10' : 'focus:border-purple-500 focus:ring-purple-500/10'} focus:ring-2 outline-none transition-all text-sm`}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">{t('pledge.place')}</label>
                <input
                  type="text"
                  {...register('place')}
                  placeholder="Location"
                  className={`w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-gray-400 focus:bg-white ${isFirst ? 'focus:border-blue-600 focus:ring-blue-600/10' : 'focus:border-purple-600 focus:ring-purple-600/10'} focus:ring-2 outline-none transition-all text-sm`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section: Jewel Type */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-10 h-10 rounded-xl ${isFirst ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-purple-500 to-purple-600'} flex items-center justify-center shadow-sm`}>
              <Gem className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">Jewel Information</h2>
              <p className="text-xs text-slate-500">Select type and enter details</p>
            </div>
          </div>

          {/* Jewel Type Selector */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {jewelTypes.map(({ type, label, rate, bg, activeBg, icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => handleJewelTypeChange(type)}
                className={`py-4 px-3 rounded-xl font-semibold text-sm transition-all flex flex-col items-center gap-1.5 ${
                  selectedJewelType === type
                    ? `${activeBg} text-white shadow-lg`
                    : 'bg-slate-50 text-slate-600 hover:bg-gray-200 border border-slate-200'
                }`}
              >
                <span className="text-2xl">{icon}</span>
                <span className="font-bold">{label}</span>
                <span className={`text-xs ${selectedJewelType === type ? 'text-white/80' : 'text-slate-400'}`}>{rate}</span>
              </button>
            ))}
          </div>
          <input type="hidden" {...register('jewel_type')} />

          {/* Jewel Details */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">{t('pledge.jewelsDetails')}</label>
              <textarea
                {...register('jewels_details')}
                placeholder="Chain, Ring, Bangle..."
                rows={2}
                className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-gray-400 focus:bg-white ${isFirst ? 'focus:border-blue-600 focus:ring-blue-600/10' : 'focus:border-purple-600 focus:ring-purple-600/10'} focus:ring-2 outline-none transition-all resize-none text-sm`}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">{t('pledge.noOfItems')}</label>
                <input
                  type="number"
                  {...register('no_of_items', { valueAsNumber: true })}
                  min="1"
                  className={`w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-center font-semibold tabular-nums focus:bg-white ${isFirst ? 'focus:border-blue-600 focus:ring-blue-600/10' : 'focus:border-purple-600 focus:ring-purple-600/10'} focus:ring-2 outline-none transition-all`}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Gross (g)</label>
                <input
                  type="number"
                  step="0.001"
                  {...register('gross_weight', { valueAsNumber: true })}
                  placeholder="0.000"
                  className={`w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-center tabular-nums placeholder-gray-400 focus:bg-white ${isFirst ? 'focus:border-blue-600 focus:ring-blue-600/10' : 'focus:border-purple-600 focus:ring-purple-600/10'} focus:ring-2 outline-none transition-all`}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Net (g)</label>
                <input
                  type="number"
                  step="0.001"
                  {...register('net_weight', { valueAsNumber: true })}
                  placeholder="0.000"
                  className={`w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-center tabular-nums placeholder-gray-400 focus:bg-white ${isFirst ? 'focus:border-blue-600 focus:ring-blue-600/10' : 'focus:border-purple-600 focus:ring-purple-600/10'} focus:ring-2 outline-none transition-all`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section: Loan Amount */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">Loan Details</h2>
              <p className="text-xs text-slate-500">Enter loan amount and rate</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">{t('pledge.loanAmount')} <span className="text-red-500">*</span></label>
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

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">{t('pledge.interestRate')}</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  {...register('interest_rate', { valueAsNumber: true })}
                  className={`w-full h-12 px-4 pr-24 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold tabular-nums focus:bg-white ${isFirst ? 'focus:border-blue-600 focus:ring-blue-600/10' : 'focus:border-purple-600 focus:ring-purple-600/10'} focus:ring-2 outline-none transition-all`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">% / month</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 h-13 py-3.5 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 flex items-center justify-center gap-2 transition-all hover:bg-slate-50 hover:border-gray-300 active:scale-[0.99]"
            disabled={submitting}
          >
            <X className="w-5 h-5" />
            Cancel
          </button>
          <button
            type="submit"
            className={`flex-1 h-13 py-3.5 rounded-xl font-semibold ${isFirst ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-600/25' : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-purple-600/25'} text-white flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-lg disabled:opacity-50`}
            disabled={submitting}
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Save Pledge
          </button>
        </div>
      </form>
    </div>
  )
}




















