import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from './components/ui/Toast'
import { ProtectedRoute } from './components/ProtectedRoute'

// Auth
import Onboarding from './pages/Onboarding'
import Register   from './pages/Register'
import Login      from './pages/Login'
import OTP        from './pages/OTP'

// App
import Home from './pages/Home'

// Nouveau Dossier
import Parcours      from './pages/nouveau-dossier/Parcours'
import OCR           from './pages/nouveau-dossier/OCR'
import Panels        from './pages/nouveau-dossier/Panels'
import Campagne      from './pages/nouveau-dossier/Campagne'
import Assurance     from './pages/nouveau-dossier/Assurance'
import Confirmation  from './pages/nouveau-dossier/Confirmation'

// Core
import Paiement      from './pages/Paiement'
import Recu          from './pages/Recu'
import Suivi         from './pages/Suivi'
import Resultats     from './pages/Resultats'
import ResultatDetail from './pages/ResultatDetail'
import Profil        from './pages/Profil'

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {/* Public */}
        <Route path="/"           element={<Navigate to="/onboarding" replace />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/register"   element={<Register />} />
        <Route path="/login"      element={<Login />} />
        <Route path="/otp"        element={<OTP />} />

        {/* Protected */}
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />

        {/* Nouveau dossier */}
        <Route path="/nouveau-dossier/parcours"     element={<ProtectedRoute><Parcours /></ProtectedRoute>} />
        <Route path="/nouveau-dossier/ocr"          element={<ProtectedRoute><OCR /></ProtectedRoute>} />
        <Route path="/nouveau-dossier/panels"       element={<ProtectedRoute><Panels /></ProtectedRoute>} />
        <Route path="/nouveau-dossier/campagne"     element={<ProtectedRoute><Campagne /></ProtectedRoute>} />
        <Route path="/nouveau-dossier/assurance"    element={<ProtectedRoute><Assurance /></ProtectedRoute>} />
        <Route path="/nouveau-dossier/confirmation" element={<ProtectedRoute><Confirmation /></ProtectedRoute>} />

        {/* Core flows */}
        <Route path="/paiement"         element={<ProtectedRoute><Paiement /></ProtectedRoute>} />
        <Route path="/recu"             element={<ProtectedRoute><Recu /></ProtectedRoute>} />
        <Route path="/suivi/:id"        element={<ProtectedRoute><Suivi /></ProtectedRoute>} />
        <Route path="/resultats"        element={<ProtectedRoute><Resultats /></ProtectedRoute>} />
        <Route path="/resultats/:id"    element={<ProtectedRoute><ResultatDetail /></ProtectedRoute>} />
        <Route path="/profil"           element={<ProtectedRoute><Profil /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
