import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import NewPledge from './pages/NewPledge'
import EditPledge from './pages/EditPledge'
import Pledge from './pages/Pledge'
import PledgeDetails from './pages/PledgeDetails'
import Settings from './pages/Settings'
import Financers from './pages/Financers'

function App() {
  return (
    <BrowserRouter>
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


