import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout    from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Patients  from './pages/Patients'
import Assurances from './pages/Assurances'
import Paiements  from './pages/Paiements'
import Agents     from './pages/Agents'
import Missions   from './pages/Missions'
import Stock      from './pages/Stock'
import Rapports   from './pages/Rapports'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index           element={<Dashboard />} />
          <Route path="patients"   element={<Patients />} />
          <Route path="assurances" element={<Assurances />} />
          <Route path="paiements"  element={<Paiements />} />
          <Route path="agents"     element={<Agents />} />
          <Route path="missions"   element={<Missions />} />
          <Route path="stock"      element={<Stock />} />
          <Route path="rapports"   element={<Rapports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
