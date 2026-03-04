import { useTranslation } from 'react-i18next'
import { Database, Info, Gem, Shield, Clock, ChevronLeft, Layers } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCategoryStore } from '../store/categoryStore'
import CategoryBadge from '../components/CategoryBadge'

export default function Settings() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { activeCategory, setCategory } = useCategoryStore()
  const isFirst = activeCategory === 'FIRST'

  return (
    <div className={`min-h-screen ${isFirst ? 'bg-blue-50' : 'bg-purple-50'} pb-20`}>
      {/* Header */}
      <div className={`${isFirst ? 'bg-blue-50 border-blue-200/50' : 'bg-purple-50 border-purple-200/50'} border-b`}>
        <div className="px-4 py-4 flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50 hover:bg-slate-200 transition-colors border border-slate-200"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 ${isFirst ? 'bg-gradient-to-br from-blue-600 to-blue-500 shadow-blue-500/30' : 'bg-gradient-to-br from-purple-600 to-purple-500 shadow-purple-500/30'} rounded-2xl flex items-center justify-center shadow-lg`}>
              <Gem className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-800">Sri Orusol Jeweller</h1>
                <CategoryBadge showLabel={false} />
              </div>
              <p className="text-[11px] text-slate-500">Settings & Preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Pledge Category Selector */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 ${isFirst ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-purple-500 to-purple-600'} rounded-xl flex items-center justify-center shadow-md`}>
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Pledge Category</h3>
              <p className="text-xs text-slate-500">Select which category to work with</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {/* First Category */}
            <button
              onClick={() => setCategory('FIRST')}
              className={`p-4 rounded-xl border-2 transition-all ${
                activeCategory === 'FIRST'
                  ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/20'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  activeCategory === 'FIRST' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  <span className="text-xl font-bold">1</span>
                </div>
                <span className={`font-bold ${
                  activeCategory === 'FIRST' ? 'text-blue-700' : 'text-slate-600'
                }`}>
                  FIRST
                </span>
                {activeCategory === 'FIRST' && (
                  <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold">
                    ACTIVE
                  </span>
                )}
              </div>
            </button>
            
            {/* Second Category */}
            <button
              onClick={() => setCategory('SECOND')}
              className={`p-4 rounded-xl border-2 transition-all ${
                activeCategory === 'SECOND'
                  ? 'border-purple-500 bg-purple-50 shadow-lg shadow-purple-500/20'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  activeCategory === 'SECOND' 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  <span className="text-xl font-bold">2</span>
                </div>
                <span className={`font-bold ${
                  activeCategory === 'SECOND' ? 'text-purple-700' : 'text-slate-600'
                }`}>
                  SECOND
                </span>
                {activeCategory === 'SECOND' && (
                  <span className="text-[10px] bg-purple-500 text-white px-2 py-0.5 rounded-full font-bold">
                    ACTIVE
                  </span>
                )}
              </div>
            </button>
          </div>
          
          <p className="text-xs text-slate-400 text-center mt-4">
            Each category has separate pledges, financers, and data
          </p>
        </div>

        {/* Shop Details */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-14 h-14 ${isFirst ? 'bg-gradient-to-br from-blue-600 to-blue-500 shadow-blue-500/30' : 'bg-gradient-to-br from-purple-600 to-purple-500 shadow-purple-500/30'} rounded-2xl flex items-center justify-center shadow-lg`}>
              <Gem className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Sri Orusol Jeweller</h3>
              <p className="text-sm text-slate-500">Rental Jewels Management</p>
            </div>
          </div>
          
          <div className={`${isFirst ? 'bg-blue-50 border-blue-100' : 'bg-purple-50 border-purple-100'} rounded-xl p-4 border`}>
            <div className={`flex items-center gap-2 ${isFirst ? 'text-blue-700' : 'text-purple-700'} mb-2`}>
              <Shield className="w-5 h-5" />
              <span className="text-sm font-bold">Premium Account</span>
            </div>
            <p className={`text-xs ${isFirst ? 'text-blue-600' : 'text-purple-600'}`}>Full access to all features</p>
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Database className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-800">{t('settings.backup')}</h3>
              <p className="text-xs text-slate-500">Cloud sync status</p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm text-emerald-600 font-bold">Active</span>
            </div>
          </div>
          
          <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Auto-sync enabled</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">Powered by Neon</span>
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 ${isFirst ? 'bg-blue-100' : 'bg-purple-100'} rounded-xl flex items-center justify-center`}>
              <Info className={`w-6 h-6 ${isFirst ? 'text-blue-600' : 'text-purple-600'}`} />
            </div>
            <h3 className="font-bold text-slate-800">{t('settings.about')}</h3>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between items-center py-3 px-4 bg-slate-50 rounded-xl">
              <span className="text-sm text-slate-600 font-medium">Version</span>
              <span className={`text-sm font-bold ${isFirst ? 'text-blue-600' : 'text-purple-600'}`}>1.0.0</span>
            </div>
            <div className="flex justify-between items-center py-3 px-4 bg-slate-50 rounded-xl">
              <span className="text-sm text-slate-600 font-medium">Build</span>
              <span className="text-sm font-bold text-slate-700">Production</span>
            </div>
            <div className="flex justify-between items-center py-3 px-4 bg-slate-50 rounded-xl">
              <span className="text-sm text-slate-600 font-medium">Platform</span>
              <span className="text-sm font-bold text-slate-700">PWA</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-sm text-slate-500 font-medium">© 2026 Sri Orusol Jeweller</p>
          <p className="text-xs text-slate-400 mt-1">All rights reserved</p>
        </div>
      </div>
    </div>
  )
}



















