import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import * as dbFirst from '../lib/database'
import * as dbSecond from '../lib/neonDatabaseSecond'
import { useCategoryStore } from '../store/categoryStore'
import { downloadFinancerPDF } from '../lib/pdfGenerator'
import { Landmark, Search, ChevronRight, Calendar, Wallet, FileText, Download, X, ChevronLeft, Gem } from 'lucide-react'
import { format } from 'date-fns'
import CategoryBadge from '../components/CategoryBadge'

export default function Financers() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { activeCategory } = useCategoryStore()
  const db = activeCategory === 'FIRST' ? dbFirst : dbSecond
  
  const [financers, setFinancers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFinancer, setSelectedFinancer] = useState(null)
  const [financerPledges, setFinancerPledges] = useState([])
  const [loadingPledges, setLoadingPledges] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [pledgeTab, setPledgeTab] = useState('ACTIVE') // 'ACTIVE', 'CLOSED', 'ALL'
  const [listTab, setListTab] = useState('ACTIVE') // Tab for financer list: 'ACTIVE', 'CLOSED', 'ALL'

  useEffect(() => {
    loadFinancers()
  }, [activeCategory])

  const loadFinancers = async () => {
    setIsLoading(true)
    try {
      const list = await db.getFinancerList()
      setFinancers(list)
    } catch (error) {
      console.error('Error loading financers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFinancerClick = async (financer) => {
    setSelectedFinancer(financer)
    setPledgeTab('ACTIVE') // Reset to active tab when selecting financer
    setLoadingPledges(true)
    try {
      const pledges = await db.getOwnerRepledgesByFinancer(financer.name)
      setFinancerPledges(pledges)
    } catch (error) {
      console.error('Error loading pledges:', error)
      setFinancerPledges([])
    } finally {
      setLoadingPledges(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return format(new Date(date), 'dd/MM/yyyy')
  }

  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num)
  }

  // Export selected financer data to PDF based on current tab
  const exportSelectedFinancerToPDF = () => {
    if (!selectedFinancer || filteredPledges.length === 0) {
      toast.error(t('export.selectFinancerFirst'))
      return
    }

    setExporting(true)
    try {
      // Add tab info to financer name for PDF title
      const tabSuffix = pledgeTab === 'ACTIVE' 
        ? ' (Active)' 
        : pledgeTab === 'CLOSED' 
          ? ' (Closed)' 
          : ' (All)'
      downloadFinancerPDF(selectedFinancer.name + tabSuffix, selectedFinancer.place, filteredPledges)
      toast.success(t('export.success'))
    } catch (error) {
      console.error('Export error:', error)
      toast.error(t('export.error'))
    } finally {
      setExporting(false)
    }
  }

  const filteredFinancers = financers.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.place && f.place.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Filter financers based on list tab
  const listFilteredFinancers = filteredFinancers.filter(f => {
    if (listTab === 'ACTIVE') return (f.active_count || 0) > 0
    if (listTab === 'CLOSED') return (f.closed_count || 0) > 0 || ((f.pledge_count || 0) > 0 && (f.active_count || 0) === 0)
    return true // ALL
  })

  // Calculate list tab counts
  const activeFinancersCount = filteredFinancers.filter(f => (f.active_count || 0) > 0).length
  const closedFinancersCount = filteredFinancers.filter(f => (f.closed_count || 0) > 0 || ((f.pledge_count || 0) > 0 && (f.active_count || 0) === 0)).length
  const allFinancersCount = filteredFinancers.length

  // Calculate total amounts for list tabs
  const activeFinancersTotalAmount = filteredFinancers
    .filter(f => (f.active_count || 0) > 0)
    .reduce((sum, f) => sum + (parseFloat(f.active_amount) || parseFloat(f.total_amount) || 0), 0)
  const closedFinancersTotalAmount = filteredFinancers
    .filter(f => (f.closed_count || 0) > 0 || ((f.pledge_count || 0) > 0 && (f.active_count || 0) === 0))
    .reduce((sum, f) => sum + (parseFloat(f.closed_amount) || 0), 0)
  const allFinancersTotalAmount = filteredFinancers.reduce((sum, f) => sum + (parseFloat(f.total_amount) || 0), 0)

  // Get current list tab amount
  const currentListTabAmount = listTab === 'ACTIVE' 
    ? activeFinancersTotalAmount 
    : listTab === 'CLOSED' 
      ? closedFinancersTotalAmount 
      : allFinancersTotalAmount

  // Calculate counts
  const activePledges = financerPledges.filter(p => p.status === 'ACTIVE')
  const closedPledges = financerPledges.filter(p => p.status === 'CLOSED')
  const activeCount = activePledges.length
  const closedCount = closedPledges.length
  
  // Calculate total amounts
  const totalActiveAmount = activePledges.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const totalClosedAmount = closedPledges.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const totalAllAmount = financerPledges.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

  // Get current tab's total amount
  const currentTabAmount = pledgeTab === 'ACTIVE' 
    ? totalActiveAmount 
    : pledgeTab === 'CLOSED' 
      ? totalClosedAmount 
      : totalAllAmount

  const currentTabLabel = pledgeTab === 'ACTIVE' 
    ? t('pledge.active') 
    : pledgeTab === 'CLOSED' 
      ? t('pledge.closed') 
      : t('nav.allData')

  // Filter pledges based on selected tab
  const filteredPledges = pledgeTab === 'ALL' 
    ? financerPledges 
    : pledgeTab === 'ACTIVE' 
      ? activePledges 
      : closedPledges

  const isFirst = activeCategory === 'FIRST'
  
  // If a financer is selected, show details view (mobile-friendly)
  if (selectedFinancer) {
    return (
      <div className={`min-h-screen ${isFirst ? 'bg-blue-50' : 'bg-purple-50'} pb-20`}>
        {/* Header with Back and PDF Button */}
        <div className={`${isFirst ? 'bg-blue-50 border-blue-200/50' : 'bg-purple-50 border-purple-200/50'} border-b`}>
          <div className="px-4 py-3 flex items-center gap-3">
            <button 
              onClick={() => setSelectedFinancer(null)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-slate-600" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-800 truncate">{selectedFinancer.name}</h1>
                <CategoryBadge showLabel={false} />
              </div>
              {selectedFinancer.place && (
                <p className="text-xs text-slate-500">{selectedFinancer.place}</p>
              )}
            </div>
            {/* PDF Button in Header */}
            <button
              onClick={exportSelectedFinancerToPDF}
              disabled={exporting}
              className="h-10 px-4 bg-slate-50 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center gap-2 font-medium text-sm transition-all active:scale-95 disabled:opacity-50 border border-slate-200"
            >
              {exporting ? (
                <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>PDF</span>
            </button>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setPledgeTab('ACTIVE')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
                pledgeTab === 'ACTIVE'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t('pledge.active')} ({activeCount})
            </button>
            <button
              onClick={() => setPledgeTab('CLOSED')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
                pledgeTab === 'CLOSED'
                  ? 'bg-red-500 text-white shadow-md shadow-red-500/30'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t('pledge.closed')} ({closedCount})
            </button>
            <button
              onClick={() => setPledgeTab('ALL')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
                pledgeTab === 'ALL'
                  ? isFirst 
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                    : 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t('nav.allData')} ({financerPledges.length})
            </button>
          </div>

          {/* Summary Card - Dynamic based on tab */}
          <div className={`rounded-2xl p-5 text-white shadow-lg ${
            pledgeTab === 'ACTIVE' 
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' 
              : pledgeTab === 'CLOSED' 
                ? 'bg-gradient-to-br from-red-500 to-red-600'
                : isFirst 
                  ? 'bg-gradient-to-br from-blue-600 to-blue-700'
                  : 'bg-gradient-to-br from-purple-600 to-purple-700'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white/70 text-sm">{t('financers.totalAmount')} ({currentTabLabel})</p>
                <p className="text-3xl font-bold">{formatCurrency(currentTabAmount)}</p>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-sm">{t('financers.pledges')}</p>
                <p className="text-2xl font-bold">{filteredPledges.length}</p>
              </div>
            </div>
          </div>

          {/* Pledges List */}
          {loadingPledges ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className={`w-8 h-8 border-3 ${isFirst ? 'border-blue-600' : 'border-purple-600'} border-t-transparent rounded-full animate-spin mb-3`} />
              <p className="text-slate-500 text-sm">Loading pledges...</p>
            </div>
          ) : filteredPledges.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-600 font-medium">{t('financers.noPledges')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 font-medium">{filteredPledges.length} Pledges</p>
              {filteredPledges.map((pledge, index) => (
                <div
                  key={index}
                  onClick={() => navigate(`/pledge/${pledge.pledge_id}`)}
                  className={`bg-white rounded-2xl overflow-hidden cursor-pointer border border-slate-200 ${isFirst ? 'hover:border-blue-400 hover:shadow-blue-500/10' : 'hover:border-purple-400 hover:shadow-purple-500/10'} hover:shadow-xl transition-all duration-300 active:scale-[0.98]`}
                >
                  {/* Header */}
                  <div className={`${isFirst ? 'bg-gradient-to-r from-blue-600 via-blue-600 to-blue-500' : 'bg-gradient-to-r from-purple-600 via-purple-600 to-purple-500'} px-4 py-3`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white tracking-wide">
                          {pledge.pledge_no || 'N/A'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          pledge.status === 'ACTIVE' 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-red-500 text-white'
                        }`}>
                          {pledge.status === 'ACTIVE' ? t('pledge.active') : t('pledge.closed')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-blue-100">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">{formatDate(pledge.debt_date)}</span>
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
                          {pledge.customer_name || '-'}
                        </p>
                        {pledge.phone_number && (
                          <p className="text-xs text-slate-500">{pledge.phone_number}</p>
                        )}
                      </div>
                    </div>

                    {/* Jewels Details */}
                    {pledge.jewels_details && (
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <Gem className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <p className="text-sm text-slate-600 truncate">{pledge.jewels_details}</p>
                      </div>
                    )}

                    {/* Stats Row */}
                    <div className={`flex items-center justify-between ${isFirst ? 'bg-blue-50' : 'bg-purple-50'} rounded-xl px-4 py-3 mb-4`}>
                      <div className="text-center">
                        <p className={`text-[10px] ${isFirst ? 'text-blue-500' : 'text-purple-500'} uppercase font-semibold`}>Items</p>
                        <p className="text-sm font-bold text-slate-700">{pledge.no_of_items || 1}</p>
                      </div>
                      <div className={`h-8 w-px ${isFirst ? 'bg-blue-200' : 'bg-purple-200'}`}></div>
                      <div className="text-center">
                        <p className={`text-[10px] ${isFirst ? 'text-blue-500' : 'text-purple-500'} uppercase font-semibold`}>Weight</p>
                        <p className="text-sm font-bold text-slate-700">{pledge.net_weight || 0}g</p>
                      </div>
                      <div className={`h-8 w-px ${isFirst ? 'bg-blue-200' : 'bg-purple-200'}`}></div>
                      <div className="text-center">
                        <p className={`text-[10px] ${isFirst ? 'text-blue-500' : 'text-purple-500'} uppercase font-semibold`}>Amount</p>
                        <p className={`text-sm font-bold ${isFirst ? 'text-blue-600' : 'text-purple-600'}`}>{formatCurrency(pledge.amount)}</p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Debt: {formatDate(pledge.debt_date)}</span>
                        </div>
                        {pledge.release_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Released: {formatDate(pledge.release_date)}</span>
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Main Financers List View
  return (
    <div className={`min-h-screen ${isFirst ? 'bg-blue-50' : 'bg-purple-50'} pb-20`}>
      {/* Header */}
      <div className={`${isFirst ? 'bg-blue-50 border-blue-200/50' : 'bg-purple-50 border-purple-200/50'} border-b`}>
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-9 h-9 ${isFirst ? 'bg-gradient-to-br from-blue-600 to-blue-500 shadow-blue-500/25' : 'bg-gradient-to-br from-purple-600 to-purple-500 shadow-purple-500/25'} rounded-xl flex items-center justify-center shadow-md`}>
              <Landmark className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-800">{t('nav.financers')}</h1>
                <CategoryBadge showLabel={false} />
              </div>
              <p className="text-[11px] text-slate-500">Owner re-pledge management</p>
            </div>
          </div>
        
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('financers.searchPlaceholder')}
              className={`w-full h-11 pl-12 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white ${isFirst ? 'focus:border-blue-500 focus:ring-blue-500/20' : 'focus:border-purple-500 focus:ring-purple-500/20'} focus:ring-2 outline-none transition-all text-sm`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Stats Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 ${isFirst ? 'bg-blue-50' : 'bg-purple-50'} rounded-xl flex items-center justify-center`}>
              <Landmark className={`w-7 h-7 ${isFirst ? 'text-blue-600' : 'text-purple-600'}`} />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-800">{formatCurrency(allFinancersTotalAmount)}</p>
              <p className="text-sm text-slate-500">{filteredFinancers.length} {t('financers.totalFinancers')}</p>
            </div>
          </div>
        </div>

        {/* Financers List */}
        <div>
          <p className="text-sm text-slate-500 mb-3 font-medium">{t('financers.list')}</p>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className={`w-8 h-8 border-3 ${isFirst ? 'border-blue-600' : 'border-purple-600'} border-t-transparent rounded-full animate-spin mb-3`} />
              <p className="text-slate-500 text-sm">Loading...</p>
            </div>
          ) : filteredFinancers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Landmark className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-600 font-medium">
                {searchQuery ? t('financers.noResults') : t('financers.noFinancers')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFinancers.map((financer, index) => (
                <button
                  key={index}
                  onClick={() => handleFinancerClick(financer)}
                  className={`w-full bg-white rounded-xl p-4 flex items-center justify-between border border-slate-100 ${isFirst ? 'hover:border-blue-200' : 'hover:border-purple-200'} transition-all active:scale-[0.98] text-left`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${isFirst ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-purple-500 to-purple-600'} rounded-xl flex items-center justify-center text-white font-bold shadow-sm`}>
                      {financer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{financer.name}</p>
                      {financer.place && (
                        <p className="text-sm text-slate-500">{financer.place}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-slate-800">{formatCurrency(financer.total_amount || 0)}</p>
                      <p className="text-xs text-slate-500">{financer.active_count || 0}/{financer.pledge_count || 0} active</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}




















