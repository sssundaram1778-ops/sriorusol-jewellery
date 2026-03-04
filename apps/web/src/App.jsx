import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import NewPledge from './pages/NewPledge'
import EditPledge from './pages/EditPledge'
import Pledge from './pages/Pledge'
import PledgeDetails from './pages/PledgeDetails'
import Settings from './pages/Settings'
import Financers from './pages/Financers'
import ConnectionStatus from './components/ConnectionStatus'
import EncryptionLogin from './components/EncryptionLogin'
import PINLogin, { isPINAuthenticated } from './components/PINLogin'
import { keepAlive } from './lib/database'
import { isEncryptionInitialized, hasEncryptionSetup } from './lib/encryption'

// Keep-alive interval (every 4 minutes to prevent database pause)
const KEEP_ALIVE_INTERVAL = 4 * 60 * 1000

function App() {
  const [authStep, setAuthStep] = useState('checking') // 'checking', 'pin', 'encryption', 'authenticated'
  
  // Check authentication state on load
  useEffect(() => {
    const checkAuth = () => {
      // Step 1: Check PIN authentication
      if (!isPINAuthenticated()) {
        setAuthStep('pin')
        return
      }
      
      // Step 2: Check encryption (master password)
      if (!isEncryptionInitialized()) {
        setAuthStep('encryption')
        return
      }
      
      // Both authenticated
      setAuthStep('authenticated')
    }
    checkAuth()
  }, [])

  // Set up keep-alive ping to prevent database from pausing
  useEffect(() => {
    if (authStep !== 'authenticated') return

    // Initial ping
    keepAlive()
    
    // Set up interval
    const intervalId = setInterval(() => {
      keepAlive()
    }, KEEP_ALIVE_INTERVAL)

    return () => clearInterval(intervalId)
  }, [authStep])

  // Show loading while checking auth
  if (authStep === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Step 1: PIN Login (4-digit PIN verification)
  if (authStep === 'pin') {
    return <PINLogin onAuthenticated={() => setAuthStep('encryption')} />
  }

  // Step 2: Encryption Login (Master password)
  if (authStep === 'encryption') {
    return <EncryptionLogin onAuthenticated={() => setAuthStep('authenticated')} />
  }

  return (
    <BrowserRouter>
      <ConnectionStatus />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="new" element={<NewPledge />} />
          <Route path="edit/:id" element={<EditPledge />} />
          <Route path="pledge" element={<Pledge />} />
          <Route path="pledge/:id" element={<PledgeDetails />} />
          <Route path="settings" element={<Settings />} />
          <Route path="financers" element={<Financers />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App