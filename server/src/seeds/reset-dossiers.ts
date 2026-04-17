/**
 * reset-dossiers — supprime uniquement les données de test liées aux dossiers.
 *
 * Ordre de suppression (respecte les contraintes FK) :
 *   1. DossierExamen  (dépend de Dossier + ExamenCatalogue)
 *   2. Paiement       (dépend de Dossier)
 *   3. Mission        (dépend de Agent — Dossier.missionId mis à null en cascade)
 *   4. Dossier        (dépend de Patient)
 *   5. Patient
 *
 * NON supprimés : Agent, ExamenCatalogue, Panel, PanelExamen,
 *                 Assurance, Parametre, User, Zone, TemplateSMS, Organisation
 *
 * Commande : npm run reset:dossiers (depuis server/)
 */

import prisma from '../lib/prisma'

async function main() {
  console.log('🗑  Début de la suppression des données de test…\n')

  const dossierExamens = await prisma.examen.deleteMany()
  console.log(`  ✔ DossierExamen supprimés : ${dossierExamens.count}`)

  const paiements = await prisma.paiement.deleteMany()
  console.log(`  ✔ Paiements supprimés     : ${paiements.count}`)

  // Détacher les dossiers de leurs missions avant de supprimer les missions
  await prisma.dossier.updateMany({ data: { missionId: null } })

  const missions = await prisma.mission.deleteMany()
  console.log(`  ✔ Missions supprimées     : ${missions.count}`)

  const dossiers = await prisma.dossier.deleteMany()
  console.log(`  ✔ Dossiers supprimés      : ${dossiers.count}`)

  const patients = await prisma.patient.deleteMany()
  console.log(`  ✔ Patients supprimés      : ${patients.count}`)

  console.log('\n✅ Reset terminé. Catalogue, agents, assurances et paramètres conservés.')
}

main()
  .catch(err => {
    console.error('❌ Erreur lors du reset :', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
