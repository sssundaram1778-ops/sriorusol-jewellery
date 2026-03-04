import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { usePledgeStore } from '../store/pledgeStore'
import { usePledgeStoreSecond } from '../store/pledgeStoreSecond'
import { useCategoryStore } from '../store/categoryStore'
import PledgeCard from '../components/PledgeCard'
import DateInput from '../components/DateInput'
import CategoryBadge from '../components/CategoryBadge'
import { Search as SearchIcon, X, FileText, CheckCircle, XCircle, List, Download, Calendar, Filter, TrendingUp, Wallet, IndianRupee } from 'lucide-react'
import { downloadAllPledgesPDF } from '../lib/pdfGenerator'
import * as dbFirst from '../lib/database'
import * as dbSecond from '../lib/neonDatabaseSecond'
import toast from 'react-hot-toast'

export default function Pledge() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('ALL') // ALL, ACTIVE, CLOSED
  const [exporting, setExporting] = useState(false)
  
  // Date range filter state
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [showDateFilter, setShowDateFilter] = useState(false)
  
  const { activeCategory } = useCategoryStore()
  const isFirst = activeCategory === 'FIRST'
  
  // Use appropriate store based on category
  const storeFirst = usePledgeStore()
  const storeSecond = usePledgeStoreSecond()
  const store = activeCategory === 'FIRST' ? storeFirst : storeSecond
  const db = activeCategory === 'FIRST' ? dbFirst : dbSecond
  
  const { 
    pledges, 
    activePledges, 
    closedPledges, 
    isLoading, 
    fetchAllPledges, 
    fetchActivePledges, 
    fetchClosedPledges 
  } = store

  // Fetch data on mount and tab change
  useEffect(() => {
    if (activeTab === 'ALL') {
      fetchAllPledges()
    } else if (activeTab === 'ACTIVE') {
      fetchActivePledges()
    } else if (activeTab === 'CLOSED') {
      fetchClosedPledges()
    }
  }, [activeTab, fetchAllPledges, fetchActivePledges, fetchClosedPledges, activeCategory])

  // Get current list based on tab
  const getCurrentList = () => {
    if (activeTab === 'ALL') return pledges || []
    if (activeTab === 'ACTIVE') return activePledges || []
    if (activeTab === 'CLOSED') return closedPledges || []
    return []
  }

  // Filter list based on search query and date range
  const getFilteredList = () => {
    let list = getCurrentList()
    
    // Apply date range filter
    if (fromDate || toDate) {
      list = list.filter(pledge => {
        // For CLOSED tab, filter by canceled_date; for ACTIVE and ALL, filter by date (creation date)
        const dateToCheck = activeTab === 'CLOSED' ? pledge.canceled_date : pledge.date
        if (!dateToCheck) return false
        
        const pledgeDate = new Date(dateToCheck)
        pledgeDate.setHours(0, 0, 0, 0)
        
        if (fromDate) {
          const from = new Date(fromDate)
          from.setHours(0, 0, 0, 0)
          if (pledgeDate < from) return false
        }
        
        if (toDate) {
          const to = new Date(toDate)
          to.setHours(23, 59, 59, 999)
          if (pledgeDate > to) return false
        }
        
        return true
      })
    }
    
    // Apply search query filter
    if (!query.trim()) return list
    
    const searchTerms = query.toLowerCase().trim().split(/\s+/).filter(term => term.length > 0)
    
    return list.filter(pledge => {
      // Create searchable text from all pledge fields (snake_case)
      const searchableText = [
        pledge.customer_name,
        pledge.pledge_no?.toString(),
        pledge.place,
        pledge.phone_number,
        pledge.jewels_details,
        pledge.loan_amount?.toString(),
        pledge.gross_weight?.toString(),
        pledge.net_weight?.toString(),
        pledge.no_of_items?.toString(),
        pledge.interest_rate?.toString(),
        pledge.status,
        pledge.date
      ].filter(Boolean).join(' ').toLowerCase()
      
      // Match if all search terms are found in the searchable text
      return searchTerms.every(term => searchableText.includes(term))
    })
  }

  const filteredList = getFilteredList()
  
  // Calculate summary stats for date-filtered results
  const summaryStats = useMemo(() => {
    if (!fromDate && !toDate) return null
    
    const totalPledges = filteredList.length
    
    // Separate active and closed pledges
    const activePledgesList = filteredList.filter(p => p.status === 'ACTIVE')
    const closedPledgesList = filteredList.filter(p => p.status === 'CLOSED' || p.status === 'REPLEDGED')
    
    // Active stats (only principal)
    const activePrincipal = activePledgesList.reduce((sum, p) => sum + (parseFloat(p.totalPrincipal) || 0), 0)
    
    // Closed stats (principal, interest, grand total)
    const closedPrincipal = closedPledgesList.reduce((sum, p) => sum + (parseFloat(p.totalPrincipal) || 0), 0)
    const closedInterest = closedPledgesList.reduce((sum, p) => sum + (parseFloat(p.totalInterest) || 0), 0)
    const closedGrandTotal = closedPrincipal + closedInterest
    
    // Overall totals (for ACTIVE/CLOSED tabs)
    const totalPrincipal = filteredList.reduce((sum, p) => sum + (parseFloat(p.totalPrincipal) || 0), 0)
    const totalInterest = filteredList.reduce((sum, p) => sum + (parseFloat(p.totalInterest) || 0), 0)
    const grandTotal = totalPrincipal + totalInterest
    
    return {
      totalPledges,
      activeCount: activePledgesList.length,
      closedCount: closedPledgesList.length,
      activePrincipal,
      closedPrincipal,
      closedInterest,
      closedGrandTotal,
      totalPrincipal,
      totalInterest,
      grandTotal
    }
  }, [filteredList, fromDate, toDate])
  
  // Format currency
  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num)
  }
  
  // Clear date filters
  const clearDateFilter = () => {
    setFromDate('')
    setToDate('')
  }
  
  // Check if date filter is active
  const isDateFilterActive = fromDate || toDate

  // Format date for display
  const formatDateForTitle = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  // Export current tab pledges to PDF
  const exportToPDF = async () => {
    setExporting(true)
    try {
      let pledgesToExport = []
      let reportTitle = ''
      
      // Determine base title
      if (activeTab === 'ALL') {
        reportTitle = 'All Pledges'
      } else if (activeTab === 'ACTIVE') {
        reportTitle = 'Active Pledges'
      } else if (activeTab === 'CLOSED') {
        reportTitle = 'Closed Pledges'
      }
      
      // If date filter is active, use filtered list; otherwise fetch from database
      if (isDateFilterActive) {
        // Use the already filtered list from UI
        pledgesToExport = filteredList
        
        // Add date range to title
        const fromStr = fromDate ? formatDateForTitle(fromDate) : ''
        const toStr = toDate ? formatDateForTitle(toDate) : ''
        if (fromStr && toStr) {
          reportTitle += ` (${fromStr} - ${toStr})`
        } else if (fromStr) {
          reportTitle += ` (From ${fromStr})`
        } else if (toStr) {
          reportTitle += ` (Till ${toStr})`
        }
      } else {
        // No filter - fetch fresh data from database
        if (activeTab === 'ALL') {
          pledgesToExport = await db.getAllPledgesWithAmounts()
        } else if (activeTab === 'ACTIVE') {
          pledgesToExport = await db.getActivePledgesWithAmounts()
        } else if (activeTab === 'CLOSED') {
          pledgesToExport = await db.getClosedPledgesWithAmounts()
        }
      }
      
      if (pledgesToExport.length === 0) {
        toast.error('No pledges to export')
        return
      }
      
      downloadAllPledgesPDF(pledgesToExport, reportTitle)
      toast.success('PDF downloaded successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export PDF')
    } finally {
      setExporting(false)
    }
  }

  const tabs = [
    { key: 'ACTIVE', label: t('pledge.active'), icon: CheckCircle, color: 'emerald', count: activePledges?.length || 0 },
    { key: 'CLOSED', label: t('pledge.closed'), icon: XCircle, color: 'red', count: closedPledges?.length || 0 },
    { key: 'ALL', label: t('nav.allData'), icon: List, color: 'blue', count: pledges?.length || 0 }
  ]

  return (
    <div className={`min-h-screen ${isFirst ? 'bg-blue-50' : 'bg-purple-50'} pb-20`}>
      {/* Header */}
      <div className={`${isFirst ? 'bg-blue-50 border-blue-200/50' : 'bg-purple-50 border-purple-200/50'} border-b`}>
        <div className="px-4 py-4">
          {/* Title Row with PDF Button */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${isFirst ? 'bg-gradient-to-br from-blue-600 to-blue-500 shadow-blue-500/25' : 'bg-gradient-to-br from-purple-600 to-purple-500 shadow-purple-500/25'} rounded-xl flex items-center justify-center shadow-md`}>
                <List className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-slate-800">All Pledges</h1>
                  <CategoryBadge showLabel={false} />
                </div>
                <p className="text-[11px] text-slate-500">{filteredList.length} pledges found</p>
              </div>
            </div>
            {/* Export PDF Button */}
            <button
              onClick={exportToPDF}
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
          
          {/* Search Input */}
          <div className="relative mb-4">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, pledge no, place, phone..."
              className={`w-full h-11 pl-12 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white ${isFirst ? 'focus:border-blue-500 focus:ring-blue-500/20' : 'focus:border-purple-500 focus:ring-purple-500/20'} focus:ring-2 outline-none transition-all text-sm`}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-colors"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            )}
          </div>

          {/* Tabs Row */}
          <div className="flex gap-2">
            {tabs.map(({ key, label, icon: Icon, color, count }) => (
              <button
                key={key}
                onClick={() => {
                  setActiveTab(key)
                  // Clear date filter when switching tabs
                  clearDateFilter()
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  activeTab === key
                    ? key === 'ACTIVE' 
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25' 
                      : key === 'CLOSED' 
                        ? 'bg-red-500 text-white shadow-md shadow-red-500/25'
                        : isFirst 
                          ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                          : 'bg-purple-500 text-white shadow-md shadow-purple-500/25'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold tabular-nums ${
                  activeTab === key ? 'bg-white/20' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
          
          {/* Date Filter Toggle - Show for all tabs */}
          <button
            onClick={() => setShowDateFilter(!showDateFilter)}
            className={`mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              showDateFilter || isDateFilterActive
                ? isFirst 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-purple-100 text-purple-700 border border-purple-200'
                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Date Range Filter</span>
            {isDateFilterActive && (
              <span className={`ml-1 px-2 py-0.5 ${isFirst ? 'bg-blue-500' : 'bg-purple-500'} text-white text-xs rounded-full`}>Active</span>
            )}
          </button>
          
          {/* Date Filter Section */}
          {showDateFilter && (
            <div className="mt-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">
                  {activeTab === 'CLOSED' ? 'Filter by Closed Date' : 'Filter by Pledge Date'}
                </span>
              </div>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">From Date</label>
                  <DateInput
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className={`w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:bg-white ${isFirst ? 'focus:border-blue-500 focus:ring-blue-500/20' : 'focus:border-purple-500 focus:ring-purple-500/20'} focus:ring-2 outline-none transition-all`}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">To Date</label>
                  <DateInput
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className={`w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:bg-white ${isFirst ? 'focus:border-blue-500 focus:ring-blue-500/20' : 'focus:border-purple-500 focus:ring-purple-500/20'} focus:ring-2 outline-none transition-all`}
                  />
                </div>
                {isDateFilterActive && (
                  <button
                    onClick={clearDateFilter}
                    className="h-10 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Summary Stats Card - Show when date filter is active */}
      {summaryStats && (
        <div className="px-4 mb-4">
          {/* ALL Tab Summary */}
          {activeTab === 'ALL' && (
            <div className={`p-4 rounded-xl border shadow-sm ${isFirst ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className={`w-4 h-4 ${isFirst ? 'text-blue-600' : 'text-purple-600'}`} />
                <span className={`text-sm font-semibold ${isFirst ? 'text-blue-700' : 'text-purple-700'}`}>
                  Summary for Selected Period
                </span>
              </div>
              
              {/* Counts Row */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-white rounded-lg p-3 border border-slate-100">
                  <div className="flex items-center gap-1 mb-1">
                    <FileText className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] text-slate-500">Total</span>
                  </div>
                  <p className="text-lg font-bold text-slate-800 tabular-nums">{summaryStats.totalPledges}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-emerald-100">
                  <div className="flex items-center gap-1 mb-1">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    <span className="text-[10px] text-emerald-600">Active</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-600 tabular-nums">{summaryStats.activeCount}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-red-100">
                  <div className="flex items-center gap-1 mb-1">
                    <XCircle className="w-3 h-3 text-red-500" />
                    <span className="text-[10px] text-red-600">Closed</span>
                  </div>
                  <p className="text-lg font-bold text-red-600 tabular-nums">{summaryStats.closedCount}</p>
                </div>
              </div>
              
              {/* Active Pledges Section */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-700">ACTIVE PLEDGES</span>
                </div>
                <div className="bg-white rounded-lg p-3 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-slate-500">Principal</span>
                  </div>
                  <p className="text-xl font-bold text-emerald-600 tabular-nums">{formatCurrency(summaryStats.activePrincipal)}</p>
                </div>
              </div>
              
              {/* Closed Pledges Section */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-3 h-3 text-red-500" />
                  <span className="text-xs font-semibold text-red-700">CLOSED PLEDGES</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="bg-white rounded-lg p-3 border border-red-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="w-4 h-4 text-blue-500" />
                      <span className="text-xs text-slate-500">Principal</span>
                    </div>
                    <p className="text-lg font-bold text-blue-600 tabular-nums">{formatCurrency(summaryStats.closedPrincipal)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-red-100">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs text-slate-500">Interest</span>
                    </div>
                    <p className="text-lg font-bold text-emerald-600 tabular-nums">{formatCurrency(summaryStats.closedInterest)}</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-red-100">
                  <div className="flex items-center gap-2 mb-1">
                    <IndianRupee className="w-4 h-4 text-purple-500" />
                    <span className="text-xs text-slate-500">Grand Total (Principal + Interest)</span>
                  </div>
                  <p className="text-xl font-bold text-purple-600 tabular-nums">{formatCurrency(summaryStats.closedGrandTotal)}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* ACTIVE Tab Summary */}
          {activeTab === 'ACTIVE' && (
            <div className="p-4 rounded-xl border shadow-sm bg-emerald-50 border-emerald-200">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-700">
                  Summary for Selected Period
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-500">Pledges Added</span>
                  </div>
                  <p className="text-xl font-bold text-slate-800 tabular-nums">{summaryStats.totalPledges}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-slate-500">Total Principal</span>
                  </div>
                  <p className="text-xl font-bold text-blue-600 tabular-nums">{formatCurrency(summaryStats.totalPrincipal)}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* CLOSED Tab Summary */}
          {activeTab === 'CLOSED' && (
            <div className="p-4 rounded-xl border shadow-sm bg-red-50 border-red-200">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-red-600" />
                <span className="text-sm font-semibold text-red-700">
                  Summary for Selected Period
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-500">Pledges Closed</span>
                  </div>
                  <p className="text-xl font-bold text-slate-800 tabular-nums">{summaryStats.totalPledges}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-slate-500">Total Principal</span>
                  </div>
                  <p className="text-xl font-bold text-blue-600 tabular-nums">{formatCurrency(summaryStats.totalPrincipal)}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-slate-500">Total Interest</span>
                  </div>
                  <p className="text-xl font-bold text-emerald-600 tabular-nums">{formatCurrency(summaryStats.totalInterest)}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <IndianRupee className="w-4 h-4 text-purple-500" />
                    <span className="text-xs text-slate-500">Grand Total</span>
                  </div>
                  <p className="text-xl font-bold text-purple-600 tabular-nums">{formatCurrency(summaryStats.grandTotal)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-500 text-sm font-medium">Loading pledges...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <FileText className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-slate-700 font-semibold mb-1 text-lg">
              {query ? 'No results found' : 'No pledges'}
            </p>
            <p className="text-slate-400 text-sm">
              {query ? 'Try a different search term' : `No ${activeTab.toLowerCase()} pledges available`}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-500 font-medium">
                <span className="text-slate-800 font-bold tabular-nums">{filteredList.length}</span> {filteredList.length === 1 ? 'pledge' : 'pledges'} 
                {query && ' found'}
              </p>
            </div>
            <div className="space-y-3">
              {filteredList.map((pledge) => (
                <PledgeCard key={pledge.id} pledge={pledge} showStatus />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}




















