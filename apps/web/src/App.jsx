import { useEffect } from 'react'
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
import { keepAlive } from './lib/database'

// Keep-alive interval (every 4 minutes to prevent database pause)
const KEEP_ALIVE_INTERVAL = 4 * 60 * 1000

function App() {
  // Set up keep-alive ping to prevent database from pausing
  useEffect(() => {
    // Initial ping
    keepAlive()
    
    // Set up interval
    const intervalId = setInterval(() => {
      keepAlive()
    }, KEEP_ALIVE_INTERVAL)

    return () => clearInterval(intervalId)
  }, [])

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