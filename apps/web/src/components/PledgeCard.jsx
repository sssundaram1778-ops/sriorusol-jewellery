import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { MapPin, Phone, ChevronRight, Calendar, Gem, Scale, Landmark } from 'lucide-react'
import { useCategoryStore } from '../store/categoryStore'

export default function PledgeCard({ pledge, showStatus = false }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { activeCategory } = useCategoryStore()
  const isFirst = activeCategory === 'FIRST'

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
      case 'CLOSED': return { bg: 'bg-red-500', label: t('pledge.closed') }
      case 'REPLEDGED': return { bg: 'bg-orange-500', label: t('pledge.repledged') }
      default: return { bg: 'bg-slate-400', label: status }
    }
  }

  // Check if this pledge is a returned pledge (has parent) or was returned (has return_pledge)
  const isReturnedPledge = pledge.parent_pledge_id || pledge.parent_pledge_no
  const wasReturned = pledge.return_pledge_id || pledge.return_pledge_no

  const getJewelBadge = (type) => {
    switch (type) {
      case 'GOLD': return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Gold' }
      case 'SILVER': return { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Silver' }
      case 'MIXED': return { bg: isFirst ? 'bg-blue-100' : 'bg-purple-100', text: isFirst ? 'text-blue-600' : 'text-purple-600', label: 'Mixed' }
      default: return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Gold' }
    }
  }

  const status = getStatusBadge(pledge.status)
  const jewel = getJewelBadge(pledge.jewel_type)

  return (
    <div 
      className={`bg-white rounded-2xl overflow-hidden cursor-pointer border border-slate-200 ${isFirst ? 'hover:border-blue-400 hover:shadow-blue-500/10' : 'hover:border-purple-400 hover:shadow-purple-500/10'} hover:shadow-xl transition-all duration-300 active:scale-[0.98] group`}
      onClick={() => navigate(`/pledge/${pledge.id}`)}
    >
      {/* Header */}
      <div className={`${isFirst ? 'bg-gradient-to-r from-blue-600 via-blue-600 to-blue-500' : 'bg-gradient-to-r from-purple-600 via-purple-600 to-purple-500'} px-4 py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-white tracking-wide">
              {pledge.pledge_no}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${jewel.bg} ${jewel.text}`}>
              {jewel.label}
            </span>
            {showStatus && (
              <>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.bg} text-white`}>
                  {status.label}
                </span>
                {/* Show Returned badge for closed pledges that were returned */}
                {pledge.status === 'CLOSED' && wasReturned && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isFirst ? 'bg-blue-500' : 'bg-purple-500'} text-white`}>
                    {t('pledge.returned')}
                  </span>
                )}
                {/* Show Returned badge for active pledges that are a return */}
                {pledge.status === 'ACTIVE' && isReturnedPledge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500 text-white">
                    {t('pledge.returned')}
                  </span>
                )}
              </>
            )}
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <div className={`flex items-center gap-1.5 ${isFirst ? 'text-blue-100' : 'text-purple-100'}`}>
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-xs font-medium tabular-nums">{formatDate(pledge.date)}</span>
            </div>
            {/* Show closed date for closed pledges */}
            {(pledge.status === 'CLOSED' || pledge.status === 'REPLEDGED') && pledge.canceled_date && (
              <div className="flex items-center gap-1.5 text-red-200">
                <span className="text-[10px] font-medium">Closed:</span>
                <span className="text-[10px] font-medium tabular-nums">{formatDate(pledge.canceled_date)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Customer Row */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 ${isFirst ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30' : 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/30'} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0`}>
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

        {/* Jewels Details Row */}
        {pledge.jewels_details && (
          <div className="flex items-center gap-2 mb-3 px-1">
            <Gem className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-slate-600 truncate">{pledge.jewels_details}</p>
          </div>
        )}

        {/* Stats Row */}
        <div className={`flex items-center justify-between ${isFirst ? 'bg-blue-100' : 'bg-purple-100'} rounded-xl px-4 py-3 mb-4`}>
          <div className="text-center">
            <p className={`text-[10px] ${isFirst ? 'text-blue-500' : 'text-purple-500'} uppercase font-semibold`}>Items</p>
            <p className="text-sm font-bold text-slate-700">{pledge.no_of_items || 1}</p>
          </div>
          <div className={`h-8 w-px ${isFirst ? 'bg-blue-200' : 'bg-purple-200'}`}></div>
          <div className="text-center">
            <p className={`text-[10px] ${isFirst ? 'text-blue-500' : 'text-purple-500'} uppercase font-semibold`}>Gross Wt</p>
            <p className="text-sm font-bold text-slate-700">{pledge.gross_weight || 0}g</p>
          </div>
          <div className={`h-8 w-px ${isFirst ? 'bg-blue-200' : 'bg-purple-200'}`}></div>
          <div className="text-center">
            <p className={`text-[10px] ${isFirst ? 'text-blue-500' : 'text-purple-500'} uppercase font-semibold`}>Net Wt</p>
            <p className="text-sm font-bold text-slate-700">{pledge.net_weight || 0}g</p>
          </div>
          <div className={`h-8 w-px ${isFirst ? 'bg-blue-200' : 'bg-purple-200'}`}></div>
          <div className="text-center">
            <p className={`text-[10px] ${isFirst ? 'text-blue-500' : 'text-purple-500'} uppercase font-semibold`}>Interest</p>
            <p className={`text-sm font-bold ${isFirst ? 'text-blue-600' : 'text-purple-600'}`}>{pledge.interest_rate || 2}%</p>
          </div>
          <div className={`h-8 w-px ${isFirst ? 'bg-blue-200' : 'bg-purple-200'}`}></div>
          <div className="text-center">
            <p className={`text-[10px] ${isFirst ? 'text-blue-500' : 'text-purple-500'} uppercase font-semibold`}>Principal</p>
            <p className="text-sm font-bold text-slate-700">{formatCurrency(pledge.totalPrincipal || 0)}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Total Outstanding</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${isFirst ? 'text-blue-600' : 'text-purple-600'}`}>
                {formatCurrency(pledge.grandTotal || pledge.totalPrincipal || 0)}
              </span>
              {pledge.totalInterest > 0 && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  +{formatCurrency(pledge.totalInterest)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Financer Names Badge - supports multiple financers */}
            {pledge.financer_name && (
              <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl ${isFirst ? 'bg-blue-50 border border-blue-200' : 'bg-purple-50 border border-purple-200'}`}>
                <Landmark className={`w-4 h-4 ${isFirst ? 'text-blue-500' : 'text-purple-500'} flex-shrink-0`} />
                <span className={`text-xs font-bold ${isFirst ? 'text-blue-700' : 'text-purple-700'} max-w-[100px] truncate`}>
                  {pledge.financer_count > 1 
                    ? `${pledge.financer_name.split(',')[0].trim()} +${pledge.financer_count - 1}`
                    : pledge.financer_name
                  }
                </span>
              </div>
            )}
            <button className={`w-11 h-11 rounded-xl ${isFirst ? 'bg-blue-600 shadow-blue-500/30 group-hover:bg-blue-700 group-hover:shadow-blue-600/40' : 'bg-purple-600 shadow-purple-500/30 group-hover:bg-purple-700 group-hover:shadow-purple-600/40'} flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300`}>
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}