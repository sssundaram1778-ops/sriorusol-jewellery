import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { getFinancerList, getOwnerRepledgesByFinancer } from '../lib/database'
import { downloadFinancerPDF } from '../lib/pdfGenerator'
import { Landmark, Search, ChevronRight, Calendar, Wallet, FileText, Download, X, ChevronLeft } from 'lucide-react'
import { format } from 'date-fns'

export default function Financers() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [financers, setFinancers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFinancer, setSelectedFinancer] = useState(null)
  const [financerPledges, setFinancerPledges] = useState([])
  const [loadingPledges, setLoadingPledges] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadFinancers()
  }, [])

  const loadFinancers = async () => {
    setIsLoading(true)
    try {
      const list = await getFinancerList()
      setFinancers(list)
    } catch (error) {
      console.error('Error loading financers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFinancerClick = async (financer) => {
    setSelectedFinancer(financer)
    setLoadingPledges(true)
    try {
      const pledges = await getOwnerRepledgesByFinancer(financer.name)
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

  // Export selected financer data to PDF
  const exportSelectedFinancerToPDF = () => {
    if (!selectedFinancer || financerPledges.length === 0) {
      toast.error(t('export.selectFinancerFirst'))
      return
    }

    setExporting(true)
    try {
      downloadFinancerPDF(selectedFinancer.name, selectedFinancer.place, financerPledges)
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

  // Calculate total amount for selected financer
  const totalAmount = financerPledges.reduce((sum, p) => sum + (p.amount || 0), 0)
  const activeCount = financerPledges.filter(p => p.status === 'ACTIVE').length

  // If a financer is selected, show details view (mobile-friendly)
  if (selectedFinancer) {
    return (
      <div className="min-h-screen bg-blue-50 pb-20">
        {/* Header with Back */}
        <div className="bg-blue-50 border-b border-blue-200/50">
          <div className="px-4 py-3 flex items-center gap-3">
            <button 
              onClick={() => setSelectedFinancer(null)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-slate-600" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-slate-800 truncate">{selectedFinancer.name}</h1>
              {selectedFinancer.place && (
                <p className="text-xs text-slate-500">{selectedFinancer.place}</p>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Summary Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-blue-200 text-sm">{t('financers.totalAmount')}</p>
                <p className="text-3xl font-bold">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="text-right">
                <p className="text-blue-200 text-sm">{t('financers.activePledges')}</p>
                <p className="text-2xl font-bold">{activeCount} / {financerPledges.length}</p>
              </div>
            </div>
            
            <button
              onClick={exportSelectedFinancerToPDF}
              disabled={exporting}
              className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all"
            >
              {exporting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              {t('export.downloadPDF')}
            </button>
          </div>

          {/* Pledges List */}
          {loadingPledges ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-slate-500 text-sm">Loading pledges...</p>
            </div>
          ) : financerPledges.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-600 font-medium">{t('financers.noPledges')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 font-medium">{financerPledges.length} Pledges</p>
              {financerPledges.map((pledge, index) => (
                <div
                  key={index}
                  onClick={() => navigate(`/pledge/${pledge.pledge_id}`)}
                  className={`bg-white rounded-xl p-4 cursor-pointer border transition-all active:scale-[0.98] ${
                    pledge.status === 'ACTIVE' 
                      ? 'border-blue-200 hover:border-blue-300' 
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                        {pledge.pledge_no || 'N/A'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        pledge.status === 'ACTIVE' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-slate-50 text-slate-600'
                      }`}>
                        {pledge.status === 'ACTIVE' ? t('pledge.active') : t('pledge.closed')}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">{t('pledge.customerName')}</p>
                      <p className="font-semibold text-slate-800">{pledge.customer_name || '-'}</p>
                      {pledge.phone_number && (
                        <p className="text-xs text-slate-500">{pledge.phone_number}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 mb-0.5">Amount</p>
                      <p className="font-bold text-slate-800">{formatCurrency(pledge.amount)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
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
    <div className="min-h-screen bg-blue-50 pb-20">
      {/* Header */}
      <div className="bg-blue-50 border-b border-blue-200/50">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/25">
              <Landmark className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">{t('nav.financers')}</h1>
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
              className="w-full h-11 pl-12 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
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
            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center">
              <Landmark className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-800">{financers.length}</p>
              <p className="text-sm text-slate-500">{t('financers.totalFinancers')}</p>
            </div>
          </div>
        </div>

        {/* Financers List */}
        <div>
          <p className="text-sm text-slate-500 mb-3 font-medium">{t('financers.list')}</p>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
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
                  className="w-full bg-white rounded-xl p-4 flex items-center justify-between border border-slate-100 hover:border-blue-200 transition-all active:scale-[0.98] text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-sm">
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




















