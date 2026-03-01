import { useTranslation } from 'react-i18next'
import { Database, Info, Gem, Shield, Clock, ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Settings() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-blue-50 pb-20">
      {/* Header */}
      <div className="bg-blue-50 border-b border-blue-200/50">
        <div className="px-4 py-4 flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50 hover:bg-slate-200 transition-colors border border-slate-200"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Gem className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Sri Orusol Jeweller</h1>
              <p className="text-[11px] text-slate-500">Settings & Preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Shop Details */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Gem className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Sri Orusol Jeweller</h3>
              <p className="text-sm text-slate-500">Rental Jewels Management</p>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-2 text-blue-700 mb-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-bold">Premium Account</span>
            </div>
            <p className="text-xs text-blue-600">Full access to all features</p>
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
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Info className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-slate-800">{t('settings.about')}</h3>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between items-center py-3 px-4 bg-slate-50 rounded-xl">
              <span className="text-sm text-slate-600 font-medium">Version</span>
              <span className="text-sm font-bold text-blue-600">1.0.0</span>
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



















