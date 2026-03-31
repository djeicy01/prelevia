import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout         from './components/layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login      from './pages/Login'
import Dashboard  from './pages/Dashboard'
import Patients   from './pages/Patients'
import Assurances from './pages/Assurances'
import Paiements  from './pages/Paiements'
import Agents     from './pages/Agents'
import Missions   from './pages/Missions'
import Stock      from './pages/Stock'
import Rapports     from './pages/Rapports'
import Parametres   from './pages/Parametres'
import PatientDetail from './pages/PatientDetail'
import MissionDetail from './pages/MissionDetail'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index             element={<Dashboard />} />
            <Route path="patients"        element={<Patients />} />
            <Route path="patients/:id"    element={<PatientDetail />} />
            <Route path="assurances" element={<Assurances />} />
            <Route path="paiements"  element={<Paiements />} />
            <Route path="agents"     element={<Agents />} />
            <Route path="missions"   element={<Missions />} />
            <Route path="missions/:id" element={<MissionDetail />} />
            <Route path="stock"      element={<Stock />} />
            <Route path="rapports"   element={<Rapports />} />
            <Route path="parametres" element={<Parametres />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
