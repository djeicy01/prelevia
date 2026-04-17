import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma'
import { authPatient, PatientRequest } from '../middlewares/auth'

const router = Router()

// ─── Helper — générer OTP 6 chiffres ─────────────────────────
function genererOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

// ─── Helper — envoyer SMS OTP via Twilio ─────────────────────
async function envoyerSMSOTP(telephone: string, otp: string): Promise<void> {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn('[SMS OTP] Twilio non configuré — OTP en console :', otp)
    return
  }
  const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  await twilio.messages.create({
    body: `Prelevia — Votre code de vérification : ${otp}. Valide 10 minutes. Ne le partagez pas.`,
    from: TWILIO_PHONE_NUMBER,
    to:   telephone,
  })
}

// ─── POST /api/patient/register ──────────────────────────────
// Créer un compte patient (nom, prénom, téléphone, commune)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { nom, prenom, telephone, commune } = req.body
    if (!nom || !prenom || !telephone || !commune) {
      return res.status(400).json({ error: 'nom, prenom, telephone et commune sont obligatoires' })
    }

    const nomN     = String(nom).toUpperCase().trim()
    const prenomN  = String(prenom).toUpperCase().trim()
    const communeN = String(commune).toUpperCase().trim()

    // Vérifier si le téléphone est déjà utilisé
    const existant = await prisma.patient.findFirst({ where: { telephone } })
    if (existant) {
      return res.status(409).json({ error: 'Un compte existe déjà pour ce numéro' })
    }

    // Générer la ref PAT-YYYY-NNNNN
    const count = await prisma.patient.count()
    const year  = new Date().getFullYear()
    const ref   = `PAT-${year}-${String(count + 1).padStart(5, '0')}`

    const patient = await prisma.patient.create({
      data: { ref, nom: nomN, prenom: prenomN, telephone, commune: communeN },
      select: { id: true, ref: true, nom: true, prenom: true, telephone: true, commune: true },
    })

    res.status(201).json({ message: 'Compte créé', patient })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── POST /api/patient/otp/send ──────────────────────────────
// Générer OTP 6 chiffres, stocker hashé, envoyer SMS
router.post('/otp/send', async (req: Request, res: Response) => {
  try {
    const { telephone } = req.body
    if (!telephone) return res.status(400).json({ error: 'telephone requis' })

    const patient = await prisma.patient.findFirst({ where: { telephone } })
    if (!patient) {
      return res.status(404).json({ error: 'Aucun compte trouvé pour ce numéro' })
    }

    const otp       = genererOTP()
    const otpHashe  = await bcrypt.hash(otp, 10)
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // +10 min

    await prisma.patient.update({
      where: { id: patient.id },
      data:  { tokenOTP: otpHashe, otpExpiry },
    })

    await envoyerSMSOTP(telephone, otp)

    res.json({ message: 'Code OTP envoyé par SMS' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── POST /api/patient/otp/verify ────────────────────────────
// Vérifier OTP → retourner JWT patient
router.post('/otp/verify', async (req: Request, res: Response) => {
  try {
    const { telephone, otp } = req.body
    if (!telephone || !otp) return res.status(400).json({ error: 'telephone et otp requis' })

    const patient = await prisma.patient.findFirst({ where: { telephone } })
    if (!patient || !patient.tokenOTP || !patient.otpExpiry) {
      return res.status(400).json({ error: 'Aucun OTP en attente pour ce numéro' })
    }

    if (new Date() > patient.otpExpiry) {
      return res.status(400).json({ error: 'Code OTP expiré — demandez-en un nouveau' })
    }

    const otpValide = await bcrypt.compare(String(otp), patient.tokenOTP)
    if (!otpValide) {
      return res.status(400).json({ error: 'Code OTP incorrect' })
    }

    // Effacer l'OTP et générer le JWT
    const token = jwt.sign(
      { patientId: patient.id, role: 'patient' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    )

    await prisma.patient.update({
      where: { id: patient.id },
      data:  { tokenOTP: null, otpExpiry: null, tokenAuth: token },
    })

    res.json({
      token,
      patient: {
        id:        patient.id,
        ref:       patient.ref,
        nom:       patient.nom,
        prenom:    patient.prenom,
        telephone: patient.telephone,
        commune:   patient.commune,
        email:     patient.email,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── GET /api/patient/me ─────────────────────────────────────
// Profil patient authentifié
router.get('/me', authPatient, async (req: PatientRequest, res: Response) => {
  try {
    const patientId = req.patient!.patientId
    const patient = await prisma.patient.findUnique({
      where:   { id: patientId },
      include: {
        assurance: true,
        dossiers:  {
          orderBy: { createdAt: 'desc' },
          take:    5,
          include: {
            examens: { include: { catalogue: true } },
          },
        },
      },
    })
    if (!patient) return res.status(404).json({ error: 'Patient introuvable' })

    // On ne renvoie jamais les champs sensibles
    const { motDePasse, tokenOTP, otpExpiry, tokenAuth, ...safe } = patient as any
    res.json(safe)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── PATCH /api/patient/me ───────────────────────────────────
// Mettre à jour email ou assureur
router.patch('/me', authPatient, async (req: PatientRequest, res: Response) => {
  try {
    const patientId = req.patient!.patientId
    const { email, assuranceId } = req.body

    const data: any = {}
    if (email       !== undefined) data.email       = email
    if (assuranceId !== undefined) data.assuranceId = assuranceId

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour' })
    }

    const patient = await prisma.patient.update({
      where:  { id: patientId },
      data,
      select: { id: true, ref: true, nom: true, prenom: true, telephone: true, commune: true, email: true, assuranceId: true },
    })
    res.json(patient)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
