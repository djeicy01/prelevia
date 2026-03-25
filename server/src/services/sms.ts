/**
 * Service SMS — Twilio
 *
 * Utilise les templates stockés en base (modèle TemplateSMS).
 * Variables remplacées dans le contenu : {{cle}} → valeur
 *
 * Si les variables d'environnement Twilio ne sont pas définies,
 * le service log un avertissement et ne bloque pas l'application.
 */

import twilio from 'twilio'
import prisma  from '../lib/prisma'

// ─── Client Twilio (initialisé une seule fois) ────────────────────────────

let client: ReturnType<typeof twilio> | null = null

function getClient(): ReturnType<typeof twilio> | null {
  if (client) return client

  const sid   = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN

  if (!sid || !token) {
    console.warn('[SMS] Variables TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN manquantes — SMS désactivé')
    return null
  }

  client = twilio(sid, token)
  return client
}

// ─── Envoi SMS brut ───────────────────────────────────────────────────────

export async function envoyerSMS(
  telephone: string,
  message:   string
): Promise<boolean> {
  const c   = getClient()
  const from = process.env.TWILIO_PHONE_NUMBER

  if (!c || !from) {
    console.warn(`[SMS] Non envoyé à ${telephone} : Twilio non configuré`)
    return false
  }

  try {
    await c.messages.create({ body: message, from, to: telephone })
    console.info(`[SMS] Envoyé à ${telephone}`)
    return true
  } catch (err) {
    console.error(`[SMS] Erreur envoi à ${telephone} :`, err)
    return false
  }
}

// ─── Envoi via template BDD ───────────────────────────────────────────────
//
// Recherche le template par son code (ex: 'RECU_PAIEMENT'),
// remplace les variables {{cle}} dans le contenu,
// puis envoie le SMS.

export async function envoyerSMSTemplate(
  code:      string,
  telephone: string,
  variables: Record<string, string> = {}
): Promise<boolean> {
  try {
    const template = await prisma.templateSMS.findUnique({
      where: { code },
    })

    if (!template) {
      console.warn(`[SMS] Template "${code}" introuvable`)
      return false
    }

    if (!template.actif) {
      console.warn(`[SMS] Template "${code}" désactivé — SMS non envoyé`)
      return false
    }

    // Remplacement des variables {{cle}} → valeur
    let contenu = template.contenu
    for (const [cle, valeur] of Object.entries(variables)) {
      contenu = contenu.replaceAll(`{{${cle}}}`, valeur)
    }

    return envoyerSMS(telephone, contenu)
  } catch (err) {
    console.error(`[SMS] Erreur template "${code}" :`, err)
    return false
  }
}
