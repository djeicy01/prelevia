import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()

// ─── MIDDLEWARES ──────────────────────────────────────────
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// ─── ROUTES ───────────────────────────────────────────────
import authRoutes              from './routes/auth'
import assurancesRoutes        from './routes/assurances'
import patientsRoutes          from './routes/patients'
import dossiersRoutes          from './routes/dossiers'
import agentsRoutes            from './routes/agents'
import missionsRoutes          from './routes/missions'
import paiementsRoutes         from './routes/paiements'
import catalogueRoutes         from './routes/catalogue'
import panelsRoutes            from './routes/panels'
import parametresRoutes        from './routes/parametres'
import rapportsRoutes          from './routes/rapports'
import patientAuthRouter       from './routes/patientAuth'
import assureursInconnusRouter from './routes/assureursInconnus'
import campagnesRouter         from './routes/campagnes'

app.use('/api/auth',               authRoutes)
app.use('/api/assurances',         assurancesRoutes)
app.use('/api/patients',           patientsRoutes)
app.use('/api/dossiers',           dossiersRoutes)
app.use('/api/agents',             agentsRoutes)
app.use('/api/missions',           missionsRoutes)
app.use('/api/paiements',          paiementsRoutes)
app.use('/api/catalogue',          catalogueRoutes)
app.use('/api/panels',             panelsRoutes)
app.use('/api/parametres',         parametresRoutes)
app.use('/api/rapports',           rapportsRoutes)
app.use('/api/patient',            patientAuthRouter)
app.use('/api/assureurs-inconnus', assureursInconnusRouter)
app.use('/api/campagnes',          campagnesRouter)

// ─── ROUTE DE TEST ────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Prelevia API opérationnelle',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

// ─── DÉMARRAGE ────────────────────────────────────────────
const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`🟢 Prelevia API démarrée sur http://localhost:${PORT}`)
  console.log(`📋 Health check : http://localhost:${PORT}/api/health`)
})

export default app