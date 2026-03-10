import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { usePledgeStore } from '../store/pledgeStore'
import { usePledgeStoreSecond } from '../store/pledgeStoreSecond'
import { useCategoryStore } from '../store/categoryStore'
import Header from '../components/Header'
import PledgeCard from '../components/PledgeCard'
import CategoryBadge from '../components/CategoryBadge'
import { PlusCircle, Search, TrendingUp, Calendar, Wallet, ArrowRight, RefreshCw, ChevronRight, Landmark, Settings, Gem } from 'lucide-react'

export default function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { activeCategory } = useCategoryStore()
  
  // Use appropriate store based on category
  const storeFirst = usePledgeStore()
  const storeSecond = usePledgeStoreSecond()
  const store = activeCategory === 'FIRST' ? storeFirst : storeSecond
  
  const { 
    activePledges, 
    dashboardStats, 
    isLoading, 
    fetchActivePledges, 
    fetchDashboardStats 
  } = store

  useEffect(() => {
    fetchActivePledges()
    fetchDashboardStats()
  }, [fetchActivePledges, fetchDashboardStats, activeCategory])

  const handleRefresh = () => {
    fetchActivePledges()
    fetchDashboardStats()
  }

  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num)
  }
  
  // Dynamic colors based on category
  const isFirst = activeCategory === 'FIRST'
  const primaryColor = isFirst ? 'blue' : 'purple'
  const gradientClass = isFirst 
    ? 'bg-gradient-to-br from-blue-600 to-blue-500' 
    : 'bg-gradient-to-br from-purple-600 to-purple-500'
  const shadowClass = isFirst ? 'shadow-blue-500/30' : 'shadow-purple-500/30'

  return (
    <div className={`min-h-screen pb-20 ${isFirst ? 'bg-blue-50' : 'bg-purple-50'}`}>
      {/* Header */}
      <div className={`${isFirst ? 'bg-blue-50 border-blue-200/50' : 'bg-purple-50 border-purple-200/50'} border-b`}>
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 ${gradientClass} rounded-2xl flex items-center justify-center shadow-lg ${shadowClass}`}>
              <Gem className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-800 tracking-tight">Sri Orusol Jewellers</h1>
                <CategoryBadge showLabel={false} />
              </div>
              <p className="text-[11px] text-slate-500 font-medium"></p>
            </div>
          </div>
          <button 
            onClick={handleRefresh}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 hover:bg-slate-200 active:scale-95 transition-all border border-slate-200"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-5 h-5 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Hero Stats Card */}
      <div className="px-4 py-4">
        <div className={`bg-white rounded-2xl p-5 shadow-lg ${isFirst ? 'shadow-blue-500/10' : 'shadow-purple-500/10'} border border-slate-100`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-sm font-medium">{t('dashboard.grandTotal')}</span>
            <span className={`text-xs ${isFirst ? 'text-blue-600 bg-blue-50' : 'text-purple-600 bg-purple-50'} px-3 py-1 rounded-full font-semibold`}>
              {t('dashboard.todayEntries')}: {dashboardStats.todayEntries}
            </span>
          </div>
          
          <p className={`text-4xl font-bold ${isFirst ? 'text-blue-600' : 'text-purple-600'} mb-5 tabular-nums`}>
            {formatCurrency(dashboardStats.grandTotal)}
          </p>
          
          <div className="flex gap-3">
            <div className="flex-1 bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 ${isFirst ? 'bg-blue-100' : 'bg-purple-100'} rounded-lg flex items-center justify-center`}>
                  <Wallet className={`w-4 h-4 ${isFirst ? 'text-blue-600' : 'text-purple-600'}`} />
                </div>
                <span className="text-slate-500 text-xs font-medium">{t('dashboard.totalPrincipal')}</span>
              </div>
              <p className="font-bold text-xl text-slate-800 tabular-nums">{formatCurrency(dashboardStats.totalPrincipal)}</p>
            </div>
            <div className="flex-1 bg-emerald-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-slate-500 text-xs font-medium">{t('dashboard.totalInterest')}</span>
              </div>
              <p className="font-bold text-xl text-emerald-600 tabular-nums">+{formatCurrency(dashboardStats.totalInterest)}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Stats Row */}
      <div className="px-4 flex gap-3 mb-4">
        <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div className={`w-10 h-10 ${isFirst ? 'bg-blue-100' : 'bg-purple-100'} rounded-xl flex items-center justify-center`}>
              <TrendingUp className={`w-5 h-5 ${isFirst ? 'text-blue-600' : 'text-purple-600'}`} />
            </div>
            <span className="text-2xl font-bold text-slate-800 tabular-nums">{dashboardStats.activePledges}</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">{t('dashboard.activePledges')}</p>
        </div>

        <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div className={`w-10 h-10 ${isFirst ? 'bg-blue-100' : 'bg-purple-100'} rounded-xl flex items-center justify-center`}>
              <Calendar className={`w-5 h-5 ${isFirst ? 'text-blue-600' : 'text-purple-600'}`} />
            </div>
            <span className="text-2xl font-bold text-slate-800 tabular-nums">{dashboardStats.todayEntries}</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">{t('dashboard.todayEntries')}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-5">
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/new')}
            className={`flex-1 h-14 rounded-2xl font-semibold text-sm ${isFirst ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/30'} text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg`}
          >
            <PlusCircle className="w-5 h-5" />
            {t('nav.newPledge')}
          </button>
          <button 
            onClick={() => navigate('/pledge')}
            className={`flex-1 h-14 rounded-2xl font-semibold text-sm bg-white ${isFirst ? 'text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300' : 'text-purple-600 border-purple-200 hover:bg-purple-50 hover:border-purple-300'} border-2 flex items-center justify-center gap-2 transition-all active:scale-[0.98]`}
          >
            <Search className="w-5 h-5" />
            View All
          </button>
        </div>
        
        {/* Secondary Actions */}
        <div className="flex gap-3 mt-3">
          <button 
            onClick={() => navigate('/financers')}
            className={`flex-1 h-12 rounded-xl font-medium text-sm ${isFirst ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100'} border flex items-center justify-center gap-2 transition-all active:scale-[0.98]`}
          >
            <Landmark className="w-4 h-4" />
            {t('nav.financers')}
          </button>
          <button 
            onClick={() => navigate('/settings')}
            className="flex-1 h-12 rounded-xl font-medium text-sm bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Settings className="w-4 h-4" />
            {t('nav.settings')}
          </button>
        </div>
      </div>

      {/* Recent Pledges */}
      <div className="px-4 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800">{t('dashboard.recentPledges')}</h2>
          {activePledges.length > 0 && (
            <button 
              onClick={() => navigate('/pledge')}
              className={`text-sm ${isFirst ? 'text-blue-600 hover:text-blue-700' : 'text-purple-600 hover:text-purple-700'} font-semibold flex items-center gap-1 transition-colors`}
            >
              {t('common.viewAll')}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse border border-slate-100">
                <div className="h-12 bg-slate-200" />
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-200" />
                    <div className="flex-1">
                      <div className="h-5 w-32 mb-2 rounded bg-slate-200" />
                      <div className="h-3 w-24 rounded bg-slate-200" />
                    </div>
                  </div>
                  <div className="h-16 rounded-xl bg-slate-50" />
                </div>
              </div>
            ))}
          </div>
        ) : activePledges.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className={`w-20 h-20 ${isFirst ? 'bg-blue-50' : 'bg-purple-50'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
              <Wallet className={`w-10 h-10 ${isFirst ? 'text-blue-400' : 'text-purple-400'}`} />
            </div>
            <p className="text-slate-800 font-semibold mb-1 text-lg">{t('search.noResults')}</p>
            <p className="text-slate-400 text-sm mb-6">{t('dashboard.noPledgesYet')}</p>
            <button 
              onClick={() => navigate('/new')}
              className={`px-8 py-3.5 ${isFirst ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/30'} text-white text-sm font-semibold rounded-xl transition-all shadow-lg`}
            >
              <PlusCircle className="w-5 h-5 inline mr-2" />
              {t('pledge.createNew')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {activePledges.slice(0, 5).map((pledge) => (
              <PledgeCard key={pledge.id} pledge={pledge} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}




















