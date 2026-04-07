/**
 * Seed pré-analytique — met à jour le champ `description` de chaque ExamenCatalogue
 * avec les conditions pré-analytiques médicales conformes.
 *
 * Commande : npm run seed:preanalytique (depuis server/)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DESCRIPTIONS: Record<string, string> = {
  // ─── Biochimie ────────────────────────────────────────────────────────────
  GLY: 'Jeûne strict de 8h minimum requis (ni nourriture, ni boissons sucrées). Eau plate autorisée. Prélèvement de préférence le matin.',
  URE: 'Aucune préparation particulière. Hydratation normale recommandée.',
  CRE: 'Éviter la consommation excessive de viande rouge et tout exercice physique intense dans les 24h précédant le prélèvement.',
  ACU: 'Jeûne de 4h recommandé. Éviter alcool et aliments riches en purines (abats, charcuteries, fruits de mer) 24h avant.',
  CRP: 'Aucune préparation particulière.',
  CHT: 'Jeûne de 12h recommandé. Éviter repas gras et alcool dans les 24h précédant le prélèvement.',
  HDL: 'Jeûne de 12h recommandé. Éviter repas gras et alcool dans les 24h précédant le prélèvement.',
  LDL: 'Jeûne strict de 12h. Maintenir votre régime alimentaire habituel les 3 jours précédents. Ne pas modifier votre alimentation avant le prélèvement.',
  TRG: 'Jeûne strict de 12h. Aucun alcool dans les 48h précédentes. Maintenir votre régime alimentaire habituel les 3 jours précédents.',
  LIP: 'Jeûne strict de 12h. Aucun alcool dans les 48h précédentes. Maintenir votre régime alimentaire habituel.',
  GGT: 'Éviter toute consommation d\'alcool dans les 48h précédant le prélèvement. Informer l\'agent de tout médicament hépatotoxique.',
  ASA: 'Éviter tout exercice physique intense dans les 24h précédant le prélèvement. Informer de tout traitement médicamenteux en cours.',
  ALA: 'Éviter tout exercice physique intense dans les 24h précédant le prélèvement. Informer de tout traitement médicamenteux en cours.',
  BIT: 'Jeûne de préférence. Le tube doit être protégé de la lumière immédiatement après le prélèvement (envelopper dans du papier aluminium).',
  BIC: 'Jeûne de préférence. Le tube doit être protégé de la lumière immédiatement après le prélèvement.',
  PAL: 'Jeûne de 4h recommandé. Éviter tout effort musculaire intense dans les 48h précédentes. Informer en cas de grossesse.',
  ALB: 'Aucune préparation particulière.',
  PTT: 'Aucune préparation particulière.',
  CAL: 'Jeûne de préférence. Éviter les suppléments de calcium et de vitamine D dans les 24h précédant le prélèvement.',
  PHO: 'Jeûne de 4h recommandé. Éviter suppléments phosphore et antiacides dans les 24h avant.',
  SOD: 'Aucune préparation particulière. Signaler tout traitement diurétique ou perfusion en cours.',
  POT: 'Aucune préparation particulière. Éviter de serrer le poing pendant le prélèvement pour prévenir l\'hémolyse.',
  ION: 'Aucune préparation particulière. Signaler tout traitement diurétique ou traitement chronique.',
  LDH: 'Éviter traumatismes, injections intramusculaires et exercice physique intense dans les 24h précédant le prélèvement.',
  LPS: 'Jeûne de 4h recommandé. Signaler tout traitement médicamenteux en cours, notamment corticoïdes.',
  AMY: 'Aucune préparation particulière. Signaler tout traitement médicamenteux en cours.',
  FRU: 'Aucune préparation particulière. Cet examen reflète le contrôle glycémique des 2 à 3 semaines précédentes.',
  MAG: 'Aucune préparation particulière. Éviter suppléments de magnésium dans les 24h précédentes.',
  FER: 'Jeûne de 8h. Prélèvement de préférence le matin (taux naturellement plus élevé). Arrêter les suppléments en fer 7 jours avant si possible.',
  FRT: 'Aucune préparation particulière. Signaler tout état infectieux ou inflammatoire récent.',
  MIC: 'Recueil des urines de 24h dans le flacon conservateur fourni. Commencer à partir de la 2ème miction du matin (1ère éliminée) et terminer avec la 1ère miction du lendemain matin. Éviter effort physique intense le jour du recueil. Conserver le flacon au réfrigérateur.',
  EPP: 'Aucune préparation particulière. Signaler tout traitement immunosuppresseur.',

  // ─── Hématologie ─────────────────────────────────────────────────────────
  NFS: 'Aucune préparation particulière. Prélèvement sur tube EDTA violet — bien agiter doucement pour mélanger.',
  HGB: 'Aucune préparation particulière.',
  PLQ: 'Aucune préparation particulière. Résultat peut être perturbé par certains médicaments (aspirine, héparine). Informer l\'agent.',
  RET: 'Aucune préparation particulière.',
  GRP: 'Aucune préparation particulière. Apporter votre carte de groupe sanguin si vous en avez une.',
  VB12: 'Aucune préparation particulière. Arrêt des suppléments de vitamine B12 et des injections au moins 7 jours avant si possible.',
  VB9: 'Aucune préparation particulière. Arrêt des suppléments d\'acide folique au moins 7 jours avant si possible.',
  EHB: 'Aucune préparation particulière. Signaler tout antécédent d\'anémie ou d\'hémoglobinopathie connu.',

  // ─── Hémostase ────────────────────────────────────────────────────────────
  TP: 'Aucune préparation particulière. Impérativement informer l\'agent de tout traitement anticoagulant en cours (AVK type Warfarine/Préviscan, NACO/DOAC type Xarelto/Eliquis/Pradaxa). Éviter l\'hémolyse.',
  TCA: 'Aucune préparation particulière. Informer de tout traitement anticoagulant (héparine, AVK, NACO) ou antiagrégant (aspirine, Plavix). Prélèvement délicat — ne pas secouer.',
  FIB: 'Aucune préparation particulière. Informer de tout traitement anticoagulant en cours. Signaler tout épisode infectieux récent.',
  DDI: 'Aucune préparation particulière. Le résultat peut être élevé normalement lors d\'une grossesse, d\'un âge avancé ou d\'une inflammation.',
  AT3: 'Arrêt des anticoagulants si médicalement possible (sur avis du médecin). Impérativement informer l\'agent du traitement anticoagulant en cours.',

  // ─── Hormonologie ─────────────────────────────────────────────────────────
  TSH: 'Aucune préparation particulière. Prélèvement de préférence le matin. Informer de tout traitement thyroïdien en cours (Levothyrox®, Thiamazole…).',
  T3L: 'Aucune préparation particulière. Prélèvement le matin. Informer de tout traitement thyroïdien. L\'amiodarone (Cordarone®) peut fausser les résultats.',
  T4L: 'Aucune préparation particulière. Prélèvement le matin. Informer de tout traitement thyroïdien. L\'amiodarone (Cordarone®) peut fausser les résultats.',
  HBA: 'Aucune préparation particulière. Cet examen reflète le contrôle glycémique des 3 derniers mois — pas de jeûne nécessaire.',
  INS: 'Jeûne strict de 8h. Ne pas administrer d\'injection d\'insuline avant le prélèvement. Mentionner le traitement antidiabétique en cours.',
  FSH: 'Prélèvement idéalement au 3ème jour du cycle menstruel (J3), sauf indication contraire du médecin. Mentionner la date des dernières règles et tout traitement hormonal.',
  LH: 'Prélèvement idéalement au 3ème jour du cycle menstruel (J3), sauf indication contraire du médecin. Mentionner la date des dernières règles et tout traitement hormonal.',
  PRL: 'Prélèvement le matin à jeun, après 20 à 30 minutes de repos allongé ou assis. Éviter tout stress, stimulation mammaire ou rapport sexuel avant. Le stress peut fausser le résultat.',
  EST: 'Prélèvement idéalement au 3ème jour du cycle menstruel (J3), sauf indication contraire. Mentionner la phase du cycle et tout traitement hormonal en cours.',
  PRG: 'Prélèvement idéalement en 2ème partie de cycle (entre J21 et J23 d\'un cycle de 28 jours), sauf indication contraire. Mentionner la date des dernières règles.',
  TST: 'Prélèvement impérativement le matin entre 7h00 et 10h00 (pic de sécrétion hormonal). Pas de préparation alimentaire particulière.',
  COR: 'Prélèvement impérativement le matin entre 7h00 et 9h00. Être au repos depuis au moins 30 minutes. Éviter stress et effort physique avant. Informer de tout traitement corticoïde.',
  PTH: 'Jeûne de 4h. Prélèvement le matin. Éviter suppléments de calcium et de vitamine D dans les 24h précédentes. Informer de tout traitement anti-ostéoporotique.',
  VTD: 'Aucune préparation particulière. Arrêt des suppléments de vitamine D au moins 7 jours avant si possible pour obtenir le taux basal réel.',
  HCG: 'Aucune préparation particulière. Mentionner obligatoirement la date des dernières règles et l\'éventualité d\'une grossesse.',
  PPC: 'Jeûne strict de 8h. Mentionner le traitement antidiabétique en cours (insuline, metformine…). Cet examen évalue la sécrétion résiduelle de l\'insuline.',
  GH: 'Jeûne de 8h. Prélèvement après 20 minutes de repos complet. Pas d\'exercice physique intense dans les 24h précédentes. Résultat fortement influencé par le stress.',

  // ─── Marqueurs Tumoraux ───────────────────────────────────────────────────
  PSA: 'Aucune activité sexuelle dans les 48h précédentes. Pas de toucher rectal, de massage prostatique, ni de vélo dans les 24h avant. Idéalement avant tout geste urologique. Informer de tout traitement prostatique.',
  PSAL: 'Mêmes précautions que pour le PSA total : pas d\'activité sexuelle ni de toucher rectal dans les 48h. Le rapport PSA libre/PSA total sera calculé automatiquement.',
  ACE: 'Aucune préparation particulière. Informer l\'agent si vous fumez (taux de base naturellement plus élevé chez les fumeurs).',
  AFP: 'Aucune préparation particulière. Mentionner obligatoirement si vous êtes enceinte (l\'AFP est naturellement élevée pendant la grossesse).',
  CA125: 'Prélèvement de préférence hors période menstruelle (le CA125 peut être naturellement élevé pendant les règles). Mentionner tout antécédent endométriosique.',
  CA153: 'Aucune préparation particulière.',
  CA199: 'Jeûne de 4h recommandé. Signaler tout ictère ou cholestase en cours (peut fausser le résultat).',

  // ─── Bactériologie ────────────────────────────────────────────────────────
  ECB: 'Toilette intime soigneuse avec savon avant le recueil. Éliminer le 1er jet d\'urine, recueillir le 2ème jet dans le flacon stérile fourni. Prélèvement de préférence sur la 1ère urine du matin. Apporter dans l\'heure ou conserver au réfrigérateur (max 2h). Signaler tout traitement antibiotique en cours.',
  PV: 'Hors période menstruelle de préférence. Pas de rapport sexuel ni de toilette vaginale interne dans les 24h précédentes. Pas de traitement local (ovule, crème gynécologique) dans les 72h avant. L\'agent réalise le prélèvement.',
  SPM: 'Abstinence sexuelle stricte de 3 à 5 jours (ni plus, ni moins pour un résultat optimal). Recueil par masturbation dans le flacon stérile fourni, idéalement sur place ou à apporter dans l\'heure. Pas de lubrifiant. Prélèvement complet indispensable.',
  CPR: 'Recueil de selles fraîches (émises depuis moins de 2h) dans le flacon conservateur fourni. Pas de traitement antibiotique en cours si possible. Éviter laxatifs et lavements dans les 48h avant. Conserver au frais et apporter rapidement.',
  HMC: 'L\'agent réalise le prélèvement veineux lors d\'un pic fébrile ou de frissons de préférence. Idéalement avant tout début de traitement antibiotique. Plusieurs sites de ponction peuvent être nécessaires.',
  ABG: 'Réalisé automatiquement sur le prélèvement bactériologique positif. Pas de préparation supplémentaire requise.',

  // ─── Parasitologie ────────────────────────────────────────────────────────
  KOP: 'Recueil de selles dans le flacon conservateur fourni (disponible à la commande). Éviter tout traitement antiparasitaire en cours. Pour une meilleure sensibilité, 3 prélèvements consécutifs à 3 jours d\'intervalle sont recommandés. Conserver au réfrigérateur et remettre rapidement.',
  GE: 'Prélèvement réalisé par l\'agent de préférence lors d\'un accès fébrile ou de frissons (pic parasitémique). Aucune préparation alimentaire particulière. Signaler tout traitement antipaludéen récent.',
  TDR: 'Aucune préparation particulière. Le prélèvement est réalisé par l\'agent (capillaire ou veineux). Résultat disponible en 15 à 20 minutes. Signaler tout traitement antipaludéen récent.',

  // ─── Immunologie / Sérologie ──────────────────────────────────────────────
  HIV: 'Aucune préparation particulière. Le résultat est strictement confidentiel. Un accompagnement pré et post-test est disponible. Signaler tout traitement antirétroviral (ARV) en cours.',
  AGBS: 'Aucune préparation particulière. Informer de tout antécédent de vaccination contre l\'hépatite B et de toute sérologie hépatite B antérieure.',
  ACBC: 'Aucune préparation particulière. Informer de tout antécédent d\'hépatite B et de vaccination.',
  ACHC: 'Aucune préparation particulière. Informer de tout antécédent d\'hépatite C connu.',
  SYP: 'Aucune préparation particulière. Informer de tout traitement antibiotique récent (peut fausser le résultat).',
  TOX: 'Aucune préparation particulière. Mentionner obligatoirement si vous êtes enceinte et indiquer le terme de la grossesse.',
  RUB: 'Aucune préparation particulière. Mentionner obligatoirement si vous êtes enceinte. Indiquer la date de la dernière vaccination contre la rubéole si connue.',
  ASL: 'Aucune préparation particulière. Signaler toute infection streptococcique (angine) récente dans les 3 à 6 semaines précédentes.',
  HEL: 'Arrêt des inhibiteurs de la pompe à protons (oméprazole, ésoméprazole, pantoprazole…) au moins 2 semaines avant si possible. Arrêt de toute antibiothérapie au moins 4 semaines avant. Ces précautions sont importantes pour éviter les faux négatifs.',
  CD4: 'Aucune préparation particulière. Prélèvement de préférence le matin. Informer du traitement antirétroviral (ARV) en cours et de la charge virale si connue.',
  WID: 'Aucune préparation particulière. Informer de toute vaccination typhoïde récente (peut interférer avec le résultat) et de tout traitement antibiotique en cours.',
  CMV: 'Aucune préparation particulière. Mentionner obligatoirement si vous êtes enceinte, immunodéprimé(e) ou greffé(e).',
}

async function main() {
  console.log('⏳ Mise à jour des descriptions pré-analytiques...\n')

  let updated = 0
  let notFound = 0

  for (const [code, description] of Object.entries(DESCRIPTIONS)) {
    const result = await prisma.examenCatalogue.updateMany({
      where: { code },
      data: { description },
    })

    if (result.count > 0) {
      updated++
      console.log(`  ✓ ${code}`)
    } else {
      notFound++
      console.warn(`  ✗ ${code} — non trouvé en base`)
    }
  }

  console.log(`\n✅ Terminé : ${updated} examens mis à jour, ${notFound} non trouvés.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
