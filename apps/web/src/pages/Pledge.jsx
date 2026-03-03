import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { usePledgeStore } from '../store/pledgeStore'
import PledgeCard from '../components/PledgeCard'
import { Search as SearchIcon, X, FileText, CheckCircle, XCircle, List, Download } from 'lucide-react'
import { downloadAllPledgesPDF } from '../lib/pdfGenerator'
import { getAllPledgesWithAmounts, getActivePledgesWithAmounts, getClosedPledgesWithAmounts } from '../lib/database'
import toast from 'react-hot-toast'

export default function Pledge() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('ALL') // ALL, ACTIVE, CLOSED
  const [exporting, setExporting] = useState(false)
  const { 
    pledges, 
    activePledges, 
    closedPledges, 
    isLoading, 
    fetchAllPledges, 
    fetchActivePledges, 
    fetchClosedPledges 
  } = usePledgeStore()

  // Fetch data on mount and tab change
  useEffect(() => {
    if (activeTab === 'ALL') {
      fetchAllPledges()
    } else if (activeTab === 'ACTIVE') {
      fetchActivePledges()
    } else if (activeTab === 'CLOSED') {
      fetchClosedPledges()
    }
  }, [activeTab, fetchAllPledges, fetchActivePledges, fetchClosedPledges])

  // Get current list based on tab
  const getCurrentList = () => {
    if (activeTab === 'ALL') return pledges || []
    if (activeTab === 'ACTIVE') return activePledges || []
    if (activeTab === 'CLOSED') return closedPledges || []
    return []
  }

  // Filter list based on search query - semantic search across all fields
  const getFilteredList = () => {
    const list = getCurrentList()
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

  // Export current tab pledges to PDF
  const exportToPDF = async () => {
    setExporting(true)
    try {
      let pledgesToExport = []
      let reportTitle = 'All Pledges'
      
      if (activeTab === 'ALL') {
        pledgesToExport = await getAllPledgesWithAmounts()
        reportTitle = 'All Pledges'
      } else if (activeTab === 'ACTIVE') {
        pledgesToExport = await getActivePledgesWithAmounts()
        reportTitle = 'Active Pledges'
      } else if (activeTab === 'CLOSED') {
        pledgesToExport = await getClosedPledgesWithAmounts()
        reportTitle = 'Closed Pledges'
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
    <div className="min-h-screen bg-blue-50 pb-20">
      {/* Header */}
      <div className="bg-blue-50 border-b border-blue-200/50">
        <div className="px-4 py-4">
          {/* Title Row with PDF Button */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/25">
                <List className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">All Pledges</h1>
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
              className="w-full h-11 pl-12 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
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
                onClick={() => setActiveTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  activeTab === key
                    ? key === 'ACTIVE' 
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25' 
                      : key === 'CLOSED' 
                        ? 'bg-red-500 text-white shadow-md shadow-red-500/25'
                        : 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
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
        </div>
      </div>

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




















