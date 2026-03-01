import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { usePledgeStore } from '../store/pledgeStore'
import { downloadPledgePDF } from '../lib/pdfGenerator'
import Header from '../components/Header'
import AddAmountModal from '../components/AddAmountModal'
import ReturnModal from '../components/ReturnModal'
import AdditionalAmountReturnModal from '../components/AdditionalAmountReturnModal'
import OwnerRepledgeModal from '../components/OwnerRepledgeModal'
import CloseOwnerRepledgeModal from '../components/CloseOwnerRepledgeModal'
import { 
  Download, XCircle, MapPin, User, Scale, Calendar, 
  Wallet, FileText, Plus, UserPlus, Percent, History,
  Edit2, ChevronDown, ChevronUp, Gem, Clock, RefreshCw, Link, ArrowRight, Landmark
} from 'lucide-react'

export default function PledgeDetails() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [showAddAmountModal, setShowAddAmountModal] = useState(false)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [showAdditionalReturnModal, setShowAdditionalReturnModal] = useState(false)
  const [showOwnerRepledgeModal, setShowOwnerRepledgeModal] = useState(false)
  const [showCloseOwnerRepledgeModal, setShowCloseOwnerRepledgeModal] = useState(false)
  const [selectedOwnerRepledge, setSelectedOwnerRepledge] = useState(null)
  const [showAmountHistory, setShowAmountHistory] = useState(true)
  const [showOwnerRepledgeHistory, setShowOwnerRepledgeHistory] = useState(true)
  const [canceledDate, setCanceledDate] = useState(new Date().toISOString().split('T')[0])
  const [returnPledgeNo, setReturnPledgeNo] = useState('')
  const [returnAmount, setReturnAmount] = useState('')
  const [isReturning, setIsReturning] = useState(false)

  const { 
    currentPledge, 
    isLoading, 
    fetchPledgeById, 
    closePledge, 
    addAmount,
    createPledge,
    createRepledge,
    createAdditionalAmountRepledge,
    createOwnerRepledge,
    closeOwnerRepledge,
    clearCurrentPledge 
  } = usePledgeStore()

  useEffect(() => {
    if (id) fetchPledgeById(id)
    return () => clearCurrentPledge()
  }, [id, fetchPledgeById, clearCurrentPledge])

  const handleDownloadPDF = () => {
    if (currentPledge) {
      downloadPledgePDF(currentPledge, i18n.language)
      toast.success(t('messages.pdfDownloaded'))
    }
  }

  const handleClosePledge = async () => {
    if (!returnPledgeNo.trim() || !returnAmount) {
      toast.error('Please enter pledge number and amount')
      return
    }
    
    setIsReturning(true)
    try {
      // 1. Close the current pledge
      await closePledge(id, canceledDate, returnPledgeNo)
      
      // 2. Create new pledge with same customer details but new pledge number
      const newPledgeData = {
        pledgeNo: returnPledgeNo,
        date: canceledDate,
        customerName: currentPledge.customer_name,
        place: currentPledge.place || '',
        phoneNumber: currentPledge.phone_number || '',
        loanAmount: parseFloat(returnAmount),
        jewelsDetails: currentPledge.jewels_details || '',
        noOfItems: currentPledge.no_of_items || 1,
        grossWeight: currentPledge.gross_weight || 0,
        netWeight: currentPledge.net_weight || 0,
        interestRate: currentPledge.interest_rate || 2,
        jewelType: currentPledge.jewel_type || 'GOLD'
      }
      
      const newPledge = await createPledge(newPledgeData)
      
      toast.success('Pledge returned and new pledge created!')
      setShowCloseModal(false)
      setReturnPledgeNo('')
      setReturnAmount('')
      
      // Navigate to the new pledge
      navigate(`/pledge/${newPledge.id}`)
    } catch (error) {
      toast.error(error.message || 'Failed to return pledge')
    } finally {
      setIsReturning(false)
    }
  }

  const handleAddAmount = async (amountData) => {
    try {
      await addAmount(id, amountData)
      toast.success(t('messages.amountAdded'))
    } catch (error) {
      toast.error(error.message || t('common.error'))
      throw error
    }
  }

  const handleReturn = async (returnData) => {
    try {
      await createRepledge(id, returnData)
      toast.success(t('messages.repledgeCreated'))
      navigate('/past')
    } catch (error) {
      toast.error(error.message || t('common.error'))
      throw error
    }
  }

  const handleAdditionalAmountReturn = async (returnData) => {
    try {
      const result = await createAdditionalAmountRepledge(id, returnData)
      toast.success(t('messages.additionalRepledgeCreated'))
      // Navigate to the new pledge
      navigate(`/pledge/${result.newPledge.id}`)
    } catch (error) {
      toast.error(error.message || t('common.error'))
      throw error
    }
  }

  const handleOwnerRepledge = async (repledgeData) => {
    try {
      await createOwnerRepledge(id, repledgeData)
      toast.success(t('messages.ownerRepledgeCreated'))
    } catch (error) {
      toast.error(error.message || t('common.error'))
      throw error
    }
  }

  const handleCloseOwnerRepledge = async (releaseDate) => {
    try {
      await closeOwnerRepledge(id, selectedOwnerRepledge.id, releaseDate)
      toast.success(t('messages.ownerRepledgeClosed'))
      setSelectedOwnerRepledge(null)
    } catch (error) {
      toast.error(error.message || t('common.error'))
      throw error
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
      maximumFractionDigits: 2
    }).format(num)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      case 'CLOSED': return 'bg-blue-50 text-blue-700 border border-blue-200'
      case 'REPLEDGED': return 'bg-orange-50 text-orange-700 border border-orange-200'
      default: return 'bg-gray-100 text-gray-600 border border-gray-200'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'ACTIVE': return t('pledge.active')
      case 'CLOSED': return t('pledge.returned')
      case 'REPLEDGED': return t('pledge.repledged')
      default: return status
    }
  }

  const getJewelTypeColor = (jewelType) => {
    switch (jewelType) {
      case 'GOLD': return 'bg-amber-50 text-amber-700 border border-amber-200'
      case 'SILVER': return 'bg-slate-50 text-slate-600 border border-slate-200'
      case 'MIXED': return 'bg-blue-50 text-blue-600 border border-blue-200'
      default: return 'bg-amber-50 text-amber-700 border border-amber-200'
    }
  }

  const getJewelTypeLabel = (jewelType) => {
    switch (jewelType) {
      case 'GOLD': return t('pledge.gold')
      case 'SILVER': return t('pledge.silver')
      case 'MIXED': return t('pledge.mixed')
      default: return t('pledge.gold')
    }
  }

  if (isLoading || !currentPledge) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-50 pb-20">
      {/* Custom Header */}
      <div className="bg-blue-50 border-b border-blue-200/50">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-200 flex items-center justify-center border border-slate-200 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/25">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-slate-800">{currentPledge.pledge_no}</h1>
              <p className="text-[11px] text-slate-500">{formatDate(currentPledge.date)}</p>
            </div>
            {/* PDF Button in header */}
            <button 
              onClick={handleDownloadPDF} 
              className="h-10 px-4 bg-slate-50 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center gap-2 font-medium text-sm transition-all active:scale-95 border border-slate-200"
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </button>
            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              currentPledge.status === 'ACTIVE' ? 'bg-emerald-500 text-white' : 
              currentPledge.status === 'CLOSED' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'
            }`}>
              {getStatusLabel(currentPledge.status)}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* Customer Details Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            {t('pledge.customerDetails')}
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">{t('pledge.customerName')}</p>
              <p className="font-bold text-slate-800">{currentPledge.customer_name}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">{t('pledge.phoneNumber')}</p>
              <p className="font-medium text-slate-700">{currentPledge.phone_number || '-'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">{t('pledge.place')}</p>
              <p className="font-medium text-slate-700">{currentPledge.place || '-'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">{t('pledge.date')}</p>
              <p className="font-medium text-slate-700">{formatDate(currentPledge.date)}</p>
            </div>
          </div>
        </div>

        {/* Jewels Details Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Gem className="w-4 h-4 text-blue-600" />
              </div>
              {t('pledge.jewelsDetails')}
            </h3>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getJewelTypeColor(currentPledge.jewel_type)}`}>
              {getJewelTypeLabel(currentPledge.jewel_type)}
            </span>
          </div>
          
          {currentPledge.jewels_details && (
            <p className="text-slate-600 text-sm mb-4 bg-slate-50 rounded-xl p-3">{currentPledge.jewels_details}</p>
          )}
          
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">{t('pledge.noOfItems')}</p>
              <p className="font-bold text-slate-800 text-lg">{currentPledge.no_of_items || 1}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">{t('pledge.grossWeight')}</p>
              <p className="font-bold text-slate-800 text-lg">{currentPledge.gross_weight || 0}g</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-blue-400 uppercase font-semibold mb-1">{t('pledge.netWeight')}</p>
              <p className="font-bold text-blue-600 text-lg">{currentPledge.net_weight || 0}g</p>
            </div>
          </div>
        </div>

        {/* Amount History Card */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <button 
            onClick={() => setShowAmountHistory(!showAmountHistory)}
            className="w-full p-4 flex justify-between items-center bg-slate-50"
          >
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <History className="w-4 h-4 text-emerald-600" />
              </div>
              {t('pledge.amountHistory')}
            </h3>
            {showAmountHistory ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          
          {showAmountHistory && currentPledge.amounts && (
            <div className="p-4 space-y-3">
              {currentPledge.breakdown?.map((amt, index) => (
                <div key={amt.id || index} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                      amt.amount_type === 'INITIAL' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'
                    }`}>
                      {amt.amount_type === 'INITIAL' ? t('pledge.initial') : t('pledge.additional')}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{formatDate(amt.date)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white rounded-lg p-2">
                      <span className="text-slate-400 text-xs">{t('pledge.principal')}</span>
                      <p className="font-bold text-slate-800">{formatCurrency(amt.amount)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <span className="text-slate-400 text-xs">{t('pledge.rate')}</span>
                      <p className="font-bold text-blue-600">{amt.interest_rate}%</p>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <span className="text-slate-400 text-xs">{t('pledge.months')}</span>
                      <p className="font-bold text-slate-800">{amt.months} <span className="text-slate-400 font-normal text-xs">({amt.days}d)</span></p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-2">
                      <span className="text-emerald-400 text-xs">{t('pledge.interest')}</span>
                      <p className="font-bold text-emerald-600">+{formatCurrency(amt.interest)}</p>
                    </div>
                  </div>
                  {amt.notes && (
                    <p className="text-xs text-slate-500 mt-3 italic bg-white rounded-lg p-2">{amt.notes}</p>
                  )}
                </div>
              ))}
              

            </div>
          )}
        </div>

        {/* Total Summary Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/30">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            {t('pledge.summary')}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-white/10 rounded-xl p-3">
              <span className="text-blue-100">{t('pledge.totalPrincipal')}</span>
              <span className="font-bold text-white text-lg">{formatCurrency(currentPledge.totalPrincipal)}</span>
            </div>
            <div className="flex justify-between items-center bg-white/10 rounded-xl p-3">
              <span className="text-blue-100">{t('pledge.totalInterest')}</span>
              <span className="font-bold text-emerald-300 text-lg">+{formatCurrency(currentPledge.totalInterest)}</span>
            </div>
            <div className="flex justify-between items-center bg-white/20 rounded-xl p-4 mt-2">
              <span className="text-white font-semibold">{t('pledge.grandTotal')}</span>
              <span className="text-2xl font-bold text-white">{formatCurrency(currentPledge.grandTotal)}</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/20 space-y-1">
            <p className="text-xs text-blue-200 flex items-center gap-1">
              <Percent className="w-3 h-3" />
              {t('pledge.interestCalculatedAt')} {currentPledge.interest_rate || 2}% {t('pledge.perMonth')}
            </p>
            {currentPledge.status === 'CLOSED' && currentPledge.canceled_date && (
              <p className="text-xs text-blue-200 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {t('pledge.calculatedUpTo')}: {formatDate(currentPledge.canceled_date)}
              </p>
            )}
            {currentPledge.status === 'ACTIVE' && (
              <p className="text-xs text-blue-200 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {t('pledge.calculatedUpTo')}: {formatDate(new Date())}
              </p>
            )}
          </div>
        </div>

        {/* Owner Re-Pledge Section */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <button 
            onClick={() => setShowOwnerRepledgeHistory(!showOwnerRepledgeHistory)}
            className="w-full p-4 flex justify-between items-center bg-blue-50"
          >
            <h3 className="font-bold text-blue-800 text-sm flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Landmark className="w-4 h-4 text-blue-600" />
              </div>
              {t('ownerRepledge.sectionTitle')}
            </h3>
            <div className="flex items-center gap-2">
              {currentPledge.status === 'ACTIVE' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowOwnerRepledgeModal(true)
                  }}
                  className="px-4 py-2 text-xs bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-1.5 font-bold shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t('ownerRepledge.add')}
                </button>
              )}
              {showOwnerRepledgeHistory ? <ChevronUp className="w-5 h-5 text-blue-400" /> : <ChevronDown className="w-5 h-5 text-blue-400" />}
            </div>
          </button>
          
          {showOwnerRepledgeHistory && (
            <div className="p-4 space-y-3">
              {currentPledge.ownerRepledges && currentPledge.ownerRepledges.length > 0 ? (
                currentPledge.ownerRepledges.map((or, index) => {
                  return (
                    <div key={or.id || index} className={`rounded-xl p-4 border ${or.status === 'ACTIVE' ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="font-bold text-slate-800">{or.financer_name}</span>
                          {or.financer_place && <span className="text-xs text-slate-500 ml-2">({or.financer_place})</span>}
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${or.status === 'ACTIVE' ? 'bg-blue-500 text-white' : 'bg-slate-400 text-white'}`}>
                          {or.status === 'ACTIVE' ? t('pledge.active') : t('pledge.closed')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-white rounded-lg p-2">
                          <span className="text-slate-400 text-xs">{t('ownerRepledge.amount')}</span>
                          <p className="font-bold text-slate-800">{formatCurrency(or.amount)}</p>
                        </div>
                        <div className="bg-white rounded-lg p-2">
                          <span className="text-slate-400 text-xs">{t('ownerRepledge.debtDate')}</span>
                          <p className="font-bold text-slate-800">{formatDate(or.debt_date)}</p>
                        </div>
                        {or.interest_amount > 0 && (
                          <div className="bg-orange-50 rounded-lg p-2">
                            <span className="text-orange-400 text-xs">{t('ownerRepledge.interestAmount')}</span>
                            <p className="font-bold text-orange-600">{formatCurrency(or.interest_amount)}</p>
                          </div>
                        )}
                        {or.release_date && (
                          <div className="bg-white rounded-lg p-2">
                            <span className="text-slate-400 text-xs">{t('ownerRepledge.releaseDate')}</span>
                            <p className="font-bold text-slate-800">{formatDate(or.release_date)}</p>
                          </div>
                        )}
                      </div>
                      {or.notes && (
                        <p className="text-xs text-slate-500 mt-3 italic bg-white rounded-lg p-2">{or.notes}</p>
                      )}
                      {or.status === 'ACTIVE' && (
                        <button
                          onClick={() => {
                            setSelectedOwnerRepledge(or)
                            setShowCloseOwnerRepledgeModal(true)
                          }}
                          className="mt-3 px-4 py-2 text-xs bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 font-bold"
                        >
                          {t('ownerRepledge.closeRepledge')}
                        </button>
                      )}
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">{t('ownerRepledge.noRepledges')}</p>
              )}
            </div>
          )}
        </div>

        {/* Parent Pledge Reference (if this is a re-pledged loan) */}
        {currentPledge.parent_pledge_no && (
          <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Link className="w-4 h-4 text-emerald-600" />
              </div>
              {t('pledge.parentPledgeReference')}
            </h3>
            <p className="text-sm text-emerald-700 bg-white rounded-xl p-3">
              {t('pledge.continuedFrom')}: <span className="font-bold">{currentPledge.parent_pledge_no}</span>
            </p>
            {currentPledge.parent_pledge_id && (
              <button
                onClick={() => navigate(`/pledge/${currentPledge.parent_pledge_id}`)}
                className="mt-3 text-xs text-emerald-600 hover:text-emerald-700 font-bold"
              >
                {t('pledge.viewParentPledge')} →
              </button>
            )}
          </div>
        )}

        {/* Return Pledge Reference (if this pledge was returned/re-pledged to new pledge) */}
        {currentPledge.return_pledge_no && (
          <div className="bg-blue-50 rounded-2xl border border-blue-200 p-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-blue-600" />
              </div>
              {t('pledge.returnPledgeReference')}
            </h3>
            <p className="text-sm text-blue-700 bg-white rounded-xl p-3">
              {t('pledge.continuedTo')}: <span className="font-bold">{currentPledge.return_pledge_no}</span>
            </p>
            {currentPledge.return_pledge_id && (
              <button
                onClick={() => navigate(`/pledge/${currentPledge.return_pledge_id}`)}
                className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-bold"
              >
                {t('pledge.viewReturnPledge')} →
              </button>
            )}
          </div>
        )}

        {/* Repledge History (if any) */}
        {currentPledge.repledges && currentPledge.repledges.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-blue-600" />
              </div>
              {t('pledge.repledgeHistory')}
            </h3>
            {currentPledge.repledges.map((repledge, index) => (
              <div key={repledge.id || index} className="bg-blue-50 rounded-xl p-4 mb-3 border border-blue-100">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-bold text-blue-700">{repledge.new_customer_name}</span>
                  <span className="text-xs text-slate-500 font-medium">{formatDate(repledge.date)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-white rounded-lg p-2">
                    <span className="text-slate-400 text-xs">{t('pledge.amount')}</span>
                    <p className="font-bold text-slate-800">{formatCurrency(repledge.amount)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <span className="text-slate-400 text-xs">{t('pledge.rate')}</span>
                    <p className="font-bold text-blue-600">{repledge.interest_rate}%</p>
                  </div>
                </div>
                {repledge.notes && (
                  <p className="text-xs text-slate-500 mt-3 italic bg-white rounded-lg p-2">{repledge.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Canceled Date (if closed) */}
        {currentPledge.status === 'CLOSED' && currentPledge.canceled_date && (
          <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3 text-slate-600">
            <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">{t('pledge.closedOn')}</p>
              <p className="font-bold text-slate-700">{formatDate(currentPledge.canceled_date)}</p>
            </div>
          </div>
        )}

        {/* Action Buttons - only for ACTIVE pledges */}
        {currentPledge.status === 'ACTIVE' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Actions</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => navigate(`/edit/${id}`)}
                className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 text-sm font-bold transition-all"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button 
                onClick={() => setShowAddAmountModal(true)}
                className="flex-1 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 text-sm font-bold transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Amount
              </button>
              <button 
                onClick={() => setShowCloseModal(true)}
                className="flex-1 h-11 rounded-xl bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2 text-sm font-bold transition-all"
              >
                <XCircle className="w-4 h-4" />
                Return
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Close Pledge Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 max-w-md w-full border border-gray-200">
            <h3 className="text-lg font-bold mb-2 text-gray-900">Return & Create New Pledge</h3>
            <p className="text-gray-600 text-sm mb-4">This will close current pledge and create a new one with the same customer details.</p>
            
            {/* Current Pledge Info */}
            <div className="bg-blue-50 rounded-lg p-3 mb-4 text-sm">
              <p className="font-medium text-blue-800">Current: {currentPledge?.pledge_no}</p>
              <p className="text-blue-600">Customer: {currentPledge?.customer_name}</p>
            </div>
            
            {/* New Pledge Number */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">New Pledge No *</label>
              <input
                type="text"
                value={returnPledgeNo}
                onChange={(e) => setReturnPledgeNo(e.target.value)}
                placeholder="Enter new pledge number"
                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
              />
            </div>

            {/* New Loan Amount */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">New Loan Amount (₹) *</label>
              <input
                type="number"
                value={returnAmount}
                onChange={(e) => setReturnAmount(e.target.value)}
                placeholder="Enter loan amount"
                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
              />
            </div>

            {/* Return Date */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Date *</label>
              <input
                type="date"
                value={canceledDate}
                onChange={(e) => setCanceledDate(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setShowCloseModal(false)
                  setReturnPledgeNo('')
                  setReturnAmount('')
                }}
                disabled={isReturning}
                className="flex-1 h-10 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium text-sm transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleClosePledge}
                disabled={!returnPledgeNo.trim() || !returnAmount || isReturning}
                className="flex-1 h-10 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isReturning ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : null}
                Return & Create New
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Amount Modal */}
      <AddAmountModal
        isOpen={showAddAmountModal}
        onClose={() => setShowAddAmountModal(false)}
        onSubmit={handleAddAmount}
        defaultInterestRate={currentPledge.interest_rate || 2}
      />

      {/* Return Modal */}
      <ReturnModal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        onSubmit={handleReturn}
        pledge={currentPledge}
        defaultInterestRate={currentPledge.interest_rate || 2}
      />

      {/* Additional Amount Return Modal */}
      <AdditionalAmountReturnModal
        isOpen={showAdditionalReturnModal}
        onClose={() => setShowAdditionalReturnModal(false)}
        onSubmit={handleAdditionalAmountReturn}
        pledge={currentPledge}
        defaultInterestRate={currentPledge.interest_rate || 2}
      />

      {/* Owner Re-Pledge Modal */}
      <OwnerRepledgeModal
        isOpen={showOwnerRepledgeModal}
        onClose={() => setShowOwnerRepledgeModal(false)}
        onSubmit={handleOwnerRepledge}
        pledge={currentPledge}
      />

      {/* Close Owner Re-Pledge Modal */}
      <CloseOwnerRepledgeModal
        isOpen={showCloseOwnerRepledgeModal}
        onClose={() => {
          setShowCloseOwnerRepledgeModal(false)
          setSelectedOwnerRepledge(null)
        }}
        onSubmit={handleCloseOwnerRepledge}
        ownerRepledge={selectedOwnerRepledge}
      />
    </div>
  )
}




















