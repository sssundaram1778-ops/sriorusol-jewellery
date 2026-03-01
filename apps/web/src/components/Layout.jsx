import { Toaster } from 'react-hot-toast'
import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'
import InstallPrompt from './InstallPrompt'
import OfflineIndicator from './OfflineIndicator'
import UpdatePrompt from './UpdatePrompt'

export default function Layout() {
  const location = useLocation()
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
    <div className="min-h-screen min-h-dvh bg-gray-50 flex">
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#FFFFFF',
            color: '#1E3A5F',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
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
      
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}
      
      {/* Main Content */}
      <main className={`flex-1 ${!isMobile ? 'lg:ml-64' : 'pb-20'}`}>
        <div className={`${!isMobile ? 'max-w-6xl mx-auto p-4 sm:p-6 lg:p-8' : 'max-w-lg mx-auto px-4 py-4'} animate-slide-up`}>
          <Outlet />
        </div>
      </main>
      
      {/* Mobile Bottom Navigation */}
      {isMobile && <BottomNav />}
    </div>
  )
}


