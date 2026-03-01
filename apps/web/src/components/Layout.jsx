import { Toaster } from 'react-hot-toast'
import { Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'
import InstallPrompt from './InstallPrompt'
import OfflineIndicator from './OfflineIndicator'
import UpdatePrompt from './UpdatePrompt'

export default function Layout() {
  const [isMobile, setIsMobile] = useState(true)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="min-h-screen min-h-dvh bg-slate-50 flex">
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#FFFFFF',
            color: '#1E3A5F',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
          },
          success: {
            iconTheme: {
              primary: '#2563EB',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#DC2626',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
      
      {/* PWA Components */}
      <OfflineIndicator />
      <UpdatePrompt />
      <InstallPrompt />
      
      {/* Desktop Sidebar - width 72 (18rem) */}
      {!isMobile && <Sidebar />}
      
      {/* Main Content */}
      <main className={`flex-1 ${!isMobile ? 'lg:ml-72' : 'pb-20'}`}>
        <div className={`${!isMobile ? 'max-w-5xl mx-auto p-6 lg:p-8' : ''} animate-slide-up`}>
          <Outlet />
        </div>
      </main>
      
      {/* Mobile Bottom Navigation */}
      {isMobile && <BottomNav />}
    </div>
  )
}
