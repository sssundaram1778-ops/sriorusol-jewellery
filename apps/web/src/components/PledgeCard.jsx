import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { MapPin, Phone, ChevronRight, Calendar, Gem, Scale } from 'lucide-react'

export default function PledgeCard({ pledge, showStatus = false }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const formatDate = (date) => {
    if (!date) return '-'
    return format(new Date(date), 'dd MMM yy')
  }

  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num)
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE': return { bg: 'bg-emerald-500', label: t('pledge.active') }
      case 'CLOSED': return { bg: 'bg-blue-500', label: t('pledge.returned') }
      case 'REPLEDGED': return { bg: 'bg-orange-500', label: t('pledge.repledged') }
      default: return { bg: 'bg-slate-400', label: status }
    }
  }

  const getJewelBadge = (type) => {
    switch (type) {
      case 'GOLD': return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Gold' }
      case 'SILVER': return { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Silver' }
      case 'MIXED': return { bg: 'bg-blue-100', text: 'text-blue-600', label: 'Mixed' }
      default: return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Gold' }
    }
  }

  const status = getStatusBadge(pledge.status)
  const jewel = getJewelBadge(pledge.jewel_type)

  return (
    <div 
      className="bg-white rounded-2xl overflow-hidden cursor-pointer border border-slate-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 active:scale-[0.98] group"
      onClick={() => navigate(`/pledge/${pledge.id}`)}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-600 to-blue-500 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white tracking-wide">
              {pledge.pledge_no}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${jewel.bg} ${jewel.text}`}>
              {jewel.label}
            </span>
            {showStatus && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.bg} text-white`}>
                {status.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-blue-100">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-xs font-medium tabular-nums">{formatDate(pledge.date)}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Customer Row */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30 flex-shrink-0">
            {pledge.customer_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 text-[15px] truncate">
              {pledge.customer_name}
            </p>
            <div className="flex items-center gap-3 mt-1">
              {pledge.phone_number && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {pledge.phone_number}
                </span>
              )}
              {pledge.place && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate max-w-[100px]">{pledge.place}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between bg-blue-100 rounded-xl px-4 py-3 mb-4">
          <div className="text-center">
            <p className="text-[10px] text-blue-500 uppercase font-semibold">Items</p>
            <p className="text-sm font-bold text-slate-700">{pledge.no_of_items || 1}</p>
          </div>
          <div className="h-8 w-px bg-blue-200"></div>
          <div className="text-center">
            <p className="text-[10px] text-blue-500 uppercase font-semibold">Weight</p>
            <p className="text-sm font-bold text-slate-700">{pledge.net_weight || 0}g</p>
          </div>
          <div className="h-8 w-px bg-blue-200"></div>
          <div className="text-center">
            <p className="text-[10px] text-blue-500 uppercase font-semibold">Rate</p>
            <p className="text-sm font-bold text-blue-600">{pledge.interest_rate || 2}%</p>
          </div>
          <div className="h-8 w-px bg-blue-200"></div>
          <div className="text-center">
            <p className="text-[10px] text-blue-500 uppercase font-semibold">Principal</p>
            <p className="text-sm font-bold text-slate-700">{formatCurrency(pledge.totalPrincipal || 0)}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Total Outstanding</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-600">
                {formatCurrency(pledge.grandTotal || pledge.totalPrincipal || 0)}
              </span>
              {pledge.totalInterest > 0 && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  +{formatCurrency(pledge.totalInterest)}
                </span>
              )}
            </div>
          </div>
          <button className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:bg-blue-700 group-hover:shadow-blue-600/40 group-hover:scale-110 transition-all duration-300">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}


