import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { usePledgeStore } from '../store/pledgeStore'
import PledgeCard from '../components/PledgeCard'
import { Search, X, History, Download } from 'lucide-react'
import { getClosedPledgesWithAmounts } from '../lib/database'
import { downloadAllPledgesPDF } from '../lib/pdfGenerator'
import toast from 'react-hot-toast'

export default function HistoryPledges() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [exporting, setExporting] = useState(false)
  const { pledges, isLoading, fetchPledges } = usePledgeStore()

  useEffect(() => {
    fetchPledges()
  }, [fetchPledges])

  // Filter only closed/past pledges
  const closedPledges = pledges.filter(p => p.status === 'CLOSED' || p.status === 'REPLEDGED')

  // Semantic search within closed pledges - searches across multiple fields
  const filteredPledges = closedPledges.filter(pledge => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    const searchTerms = query.split(/\s+/).filter(term => term.length > 0)
    
    // Create searchable text from all pledge fields
    const searchableText = [
      pledge.customer_name,
      pledge.pledge_no,
      pledge.place,
      pledge.phone_number,
      pledge.jewels_details,
      pledge.loan_amount?.toString(),
      pledge.gross_weight?.toString(),
      pledge.net_weight?.toString(),
      pledge.no_of_items?.toString(),
      pledge.interest_rate?.toString(),
      pledge.date,
      pledge.canceled_date
    ].filter(Boolean).join(' ').toLowerCase()
    
    // Match if all search terms are found in the searchable text
    return searchTerms.every(term => searchableText.includes(term))
  })

  // Export to PDF
  const exportToPDF = async () => {
    setExporting(true)
    try {
      const pledgesToExport = await getClosedPledgesWithAmounts()
      if (pledgesToExport.length === 0) {
        toast.error('No pledges to export')
        return
      }
      await downloadAllPledgesPDF(pledgesToExport, 'Closed Pledges')
      toast.success('PDF downloaded successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export PDF')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-blue-50 pb-20">
      {/* Header */}
      <div className="bg-blue-50 border-b border-blue-200/50">
        <div className="px-4 py-4">
          {/* Title Row with PDF Button */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/25">
                <History className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">Returned Pledges</h1>
                <p className="text-[11px] text-slate-500">{closedPledges.length} returned pledges</p>
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
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, address, phone, jewels, amount..."
              className="w-full h-11 pl-12 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 border-3 border-slate-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-500 text-sm">Loading...</p>
          </div>
        ) : filteredPledges.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <History className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-slate-700 font-semibold mb-1">
              {searchQuery ? 'No matching pledges' : 'No closed pledges'}
            </p>
            <p className="text-slate-400 text-sm">
              {searchQuery ? 'Try a different search term' : 'No pledges have been closed yet'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-4 font-medium">
              {filteredPledges.length} {filteredPledges.length === 1 ? 'pledge' : 'pledges'}
              {searchQuery && ' found'}
            </p>
            <div className="space-y-4">
              {filteredPledges.map((pledge) => (
                <PledgeCard key={pledge.id} pledge={pledge} showStatus />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}




















