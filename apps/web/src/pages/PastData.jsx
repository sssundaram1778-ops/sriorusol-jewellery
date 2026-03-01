import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { usePledgeStore } from '../store/pledgeStore'
import Header from '../components/Header'
import PledgeCard from '../components/PledgeCard'
import { Archive } from 'lucide-react'

export default function PastData() {
  const { t } = useTranslation()
  const { closedPledges, isLoading, fetchClosedPledges } = usePledgeStore()

  useEffect(() => {
    fetchClosedPledges()
  }, [fetchClosedPledges])

  return (
    <div className="min-h-screen">
      <Header title={t('pastData.title')} />

      <div className="px-4 py-4">
        <p className="text-sm text-slate-500 mb-4">{t('pastData.subtitle')}</p>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-lg text-[#C9A227]"></span>
          </div>
        ) : closedPledges.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-100">
            <Archive className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-slate-500">{t('search.noResults')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {closedPledges.map((pledge) => (
              <PledgeCard key={pledge.id} pledge={pledge} showStatus />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}




















