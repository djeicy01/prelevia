import prisma from '../lib/prisma'

// ─── Helper interne — remplacer les variables dans un template ─
function remplirTemplate(contenu: string, variables: Record<string, string>): string {
  return Object.entries(variables).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), v),
    contenu
  )
}

// ─── Envoi SMS via Twilio ─────────────────────────────────────
async function envoyerSMS(telephone: string, message: string): Promise<void> {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn('[SMS] Twilio non configuré —', telephone, '→', message)
    return
  }
  const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  await twilio.messages.create({ body: message, from: TWILIO_PHONE_NUMBER, to: telephone })
}

// ─── SMS résultats critiques ──────────────────────────────────
// Déclenché automatiquement quand un ResultatExamen estCritique:true est enregistré
export async function envoyerSMSResultatsCritiques(
  telephone: string,
  refDossier: string
): Promise<void> {
  try {
    const template = await prisma.templateSMS.findUnique({
      where: { code: 'RESULTATS_CRITIQUES' },
    })
    if (!template || !template.actif) {
      console.warn('[SMS] Template RESULTATS_CRITIQUES absent ou inactif')
      return
    }
    const message = remplirTemplate(template.contenu, { ref: refDossier })
    await envoyerSMS(telephone, message)
    console.log(`[SMS] Résultats critiques envoyé → ${telephone} (${refDossier})`)
  } catch (err) {
    console.error('[SMS] Erreur envoi résultats critiques :', err)
  }
}

// ─── SMS générique par code template ─────────────────────────
export async function envoyerSMSTemplate(
  telephone: string,
  codeTemplate: string,
  variables: Record<string, string>
): Promise<void> {
  try {
    const template = await prisma.templateSMS.findUnique({ where: { code: codeTemplate } })
    if (!template || !template.actif) {
      console.warn(`[SMS] Template ${codeTemplate} absent ou inactif`)
      return
    }
    await envoyerSMS(telephone, remplirTemplate(template.contenu, variables))
  } catch (err) {
    console.error(`[SMS] Erreur template ${codeTemplate} :`, err)
  }
}
