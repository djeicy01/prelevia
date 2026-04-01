import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Démarrage du seed...')

  // ─── 1. COMPTE ADMIN ────────────────────────────────────
  const passwordHash = await bcrypt.hash('Admin2026!', 12)
  await prisma.user.upsert({
    where:  { email: 'admin@prelevia.ci' },
    update: {},
    create: {
      email:    'admin@prelevia.ci',
      password: passwordHash,
      nom:      'Admin',
      prenom:   'Prelevia',
      role:     'SUPER_ADMIN',
      actif:    true,
    }
  })
  console.log('✅ Compte admin créé  →  admin@prelevia.ci / Admin2026!')

  // ─── 2. AGENTS ──────────────────────────────────────────────
  // Nettoyage : supprime les doublons Saffo dont le téléphone n'est pas le bon
  await prisma.agent.deleteMany({
    where: { nom: 'Saffo', prenom: 'Jean Claude', telephone: { not: '+225 0708090001' } }
  })

  await prisma.agent.upsert({
    where:  { telephone: '+225 07 00 00 00' },
    update: { nom: 'Kouassi', prenom: 'Bernard' },
    create: {
      nom:            'Kouassi',
      prenom:         'Bernard',
      telephone:      '+225 07 00 00 00',
      commune:        'Yopougon',
      statut:         'ACTIF',
      tauxCommission: 0.15,
    }
  })
  await prisma.agent.upsert({
    where:  { telephone: '+225 0102030405' },
    update: {},
    create: {
      nom:            'Diallo',
      prenom:         'Fatou',
      telephone:      '+225 0102030405',
      commune:        'Yopougon',
      statut:         'ACTIF',
      tauxCommission: 0.15,
    }
  })
  await prisma.agent.upsert({
    where:  { telephone: '+225 0506070809' },
    update: {},
    create: {
      nom:            'Traoré',
      prenom:         'Moussa',
      telephone:      '+225 0506070809',
      commune:        'Yopougon',
      statut:         'ACTIF',
      tauxCommission: 0.15,
    }
  })
  console.log('✅ 3 agents créés')

  // ─── 3. ASSUREURS ───────────────────────────────────────
  const assureurs = [
    { nom:'MUGEFCI',    type:'mutuelle',          tauxCouverture:80, delaiValidation:'24-48h', contactEmail:'contact@mugefci.ci' },
    { nom:'CNPS',       type:'securite_sociale',  tauxCouverture:45, delaiValidation:'48-72h', contactEmail:'contact@cnps.ci' },
    { nom:'NSIA Santé', type:'privee',             tauxCouverture:80, delaiValidation:'24-72h', contactEmail:'contact@nsia.ci' },
    { nom:'Sanlam CI',  type:'privee',             tauxCouverture:70, delaiValidation:'24h',    contactEmail:'contact@sanlam.ci' },
    { nom:'Allianz CI', type:'privee',             tauxCouverture:75, delaiValidation:'48h',    contactEmail:'contact@allianz.ci' },
  ]
  for (const a of assureurs) {
    await prisma.assurance.upsert({ where:{ nom:a.nom }, update:{}, create:a })
  }
  console.log('✅ 5 assureurs créés')

  // ─── 4. LABORATOIRES ────────────────────────────────────
  await prisma.laboratoire.upsert({
    where:  { nom: 'Laboratoire Maison Blanche' },
    update: {},
    create: {
      nom:       'Laboratoire Maison Blanche',
      adresse:   'Yopougon, Abidjan',
      telephone: '+225 XX XX XX XX',
      valeurB:   200,
      actif:     true,
      principal: true,
    }
  })
  console.log('✅ Laboratoire Maison Blanche créé  (valeur B = 200 XOF)')

  // ─── 5. PARAMÈTRES SYSTÈME ──────────────────────────────
  const parametres = [
    { cle:'VALEUR_B',                 valeur:'200',           type:'NOMBRE'  as const, description:'Valeur du B en XOF — Labo Maison Blanche' },
    { cle:'FRAIS_DEPLACEMENT_DEFAULT',valeur:'1500',          type:'NOMBRE'  as const, description:'Frais de déplacement par défaut (XOF)' },
    { cle:'DELAI_RESULTATS_HEURES',   valeur:'24',            type:'NOMBRE'  as const, description:'Délai standard résultats en heures' },
    { cle:'NOM_SERVICE',              valeur:'Prelevia',      type:'TEXTE'   as const, description:'Nom affiché dans les SMS' },
    { cle:'TEL_SUPPORT',              valeur:'+225 07 00 00 00', type:'TEXTE' as const, description:'Numéro de support patients' },
    { cle:'COMMISSION_AGENT_DEFAULT', valeur:'0.15',          type:'NOMBRE'  as const, description:'Commission agent par défaut (15%)' },
    { cle:'OCR_ACTIF',                valeur:'true',          type:'BOOLEEN' as const, description:'Activer/désactiver OCR automatique' },
  ]
  for (const p of parametres) {
    await prisma.parametre.upsert({ where:{ cle:p.cle }, update:{}, create:p })
  }
  console.log('✅ Paramètres système créés')

  // ─── 6. TEMPLATES SMS ───────────────────────────────────
  const templates = [
    { code:'RDV_CONFIRME',         sujet:'Confirmation RDV',          contenu:'Bonjour {prenom}, votre RDV Prelevia est confirmé le {date} à {heure}. Réf : {ref}. Infos : {tel_support}' },
    { code:'RECU_PAIEMENT',        sujet:'Reçu paiement',             contenu:'Prelevia ✅ Prélèvement confirmé. Reçu {ref}. Montant : {montant} XOF. Mode : {mode}. Merci {prenom} !' },
    { code:'RESULTATS_DISPONIBLES',sujet:'Résultats disponibles',     contenu:'Bonjour {prenom}, vos résultats (Réf: {ref}) sont disponibles. Téléchargez-les sur lapp Prelevia. Infos : {tel_support}' },
    { code:'AGENT_EN_ROUTE',       sujet:'Agent en route',            contenu:'Bonjour {prenom}, votre agent Prelevia est en route. Arrivée estimée : {eta} min. Mission : {ref_mission}' },
    { code:'RAPPEL_RDV',           sujet:'Rappel RDV demain',         contenu:'Rappel Prelevia : prélèvement demain {date} à {heure}. À jeun si nécessaire. Réf : {ref}' },
    { code:'CAMPAGNE_CONVOCATION', sujet:'Convocation campagne',      contenu:'Bonjour {prenom}, vous êtes convoqué(e) pour {nom_campagne} le {date} à {heure} — {lieu}. Apportez votre CNI.' },
  ]
  for (const t of templates) {
    await prisma.templateSMS.upsert({ where:{ code:t.code }, update:{}, create:{ ...t, actif:true } })
  }
  console.log('✅ 6 templates SMS créés')

  // ─── 7. ZONES GÉOGRAPHIQUES ─────────────────────────────
  const zones = [
    { nom:'Yopougon',    fraisDeplacement:1000, actif:true  },
    { nom:'Cocody',      fraisDeplacement:2000, actif:true  },
    { nom:'Abobo',       fraisDeplacement:2000, actif:true  },
    { nom:'Attécoubé',   fraisDeplacement:1500, actif:true  },
    { nom:'Plateau',     fraisDeplacement:2500, actif:true  },
    { nom:'Marcory',     fraisDeplacement:2500, actif:false },
    { nom:'Treichville', fraisDeplacement:2500, actif:false },
    { nom:'Adjamé',      fraisDeplacement:2000, actif:false },
  ]
  for (const z of zones) {
    await prisma.zone.upsert({ where:{ nom:z.nom }, update:{}, create:{ ...z, ville:'Abidjan' } })
  }
  console.log('✅ 8 zones géographiques créées')

  // ─── 8. CATALOGUE DES EXAMENS ───────────────────────────
  const valeurB = 200
  const examens = [
    { code:'GLY',  nom:'Glycémie',                          categorie:'Biochimie',         B:10  },
    { code:'URE',  nom:'Urémie',                            categorie:'Biochimie',         B:10  },
    { code:'CRE',  nom:'Créatininémie',                     categorie:'Biochimie',         B:10  },
    { code:'ACU',  nom:'Acide Urique',                      categorie:'Biochimie',         B:10  },
    { code:'CRP',  nom:'Protéine C Réactive (CRP)',         categorie:'Biochimie',         B:10  },
    { code:'CHT',  nom:'Cholestérol Total',                 categorie:'Biochimie',         B:10  },
    { code:'HDL',  nom:'Cholestérol HDL',                   categorie:'Biochimie',         B:10  },
    { code:'LDL',  nom:'Cholestérol LDL',                   categorie:'Biochimie',         B:35  },
    { code:'TRG',  nom:'Triglycérides',                     categorie:'Biochimie',         B:10  },
    { code:'LIP',  nom:'Bilan Lipidique (CT+HDL+LDL+TG)',  categorie:'Biochimie',         B:65  },
    { code:'GGT',  nom:'Gamma GT',                          categorie:'Biochimie',         B:25  },
    { code:'ASA',  nom:'Transaminases SGOT (ASAT)',         categorie:'Biochimie',         B:25  },
    { code:'ALA',  nom:'Transaminases SGPT (ALAT)',         categorie:'Biochimie',         B:25  },
    { code:'BIT',  nom:'Bilirubine Totale',                 categorie:'Biochimie',         B:25  },
    { code:'BIC',  nom:'Bilirubine Conjuguée',              categorie:'Biochimie',         B:25  },
    { code:'PAL',  nom:'Phosphatases Alcalines',            categorie:'Biochimie',         B:25  },
    { code:'ALB',  nom:'Albuminémie',                       categorie:'Biochimie',         B:15  },
    { code:'PTT',  nom:'Protéines Totales',                 categorie:'Biochimie',         B:15  },
    { code:'CAL',  nom:'Calcium Plasmatique',               categorie:'Biochimie',         B:20  },
    { code:'PHO',  nom:'Phosphore',                         categorie:'Biochimie',         B:15  },
    { code:'SOD',  nom:'Sodium (Na+)',                      categorie:'Biochimie',         B:15  },
    { code:'POT',  nom:'Potassium (K+)',                    categorie:'Biochimie',         B:15  },
    { code:'ION',  nom:'Ionogramme Sanguin (Na K Cl)',      categorie:'Biochimie',         B:40  },
    { code:'LDH',  nom:'Lactate Déshydrogénase (LDH)',      categorie:'Biochimie',         B:35  },
    { code:'LPS',  nom:'Lipase',                            categorie:'Biochimie',         B:20  },
    { code:'AMY',  nom:'Amylasémie',                        categorie:'Biochimie',         B:40  },
    { code:'FRU',  nom:'Fructosamine',                      categorie:'Biochimie',         B:60  },
    { code:'MAG',  nom:'Magnésium Plasmatique',             categorie:'Biochimie',         B:20  },
    { code:'FER',  nom:'Fer Sérique',                       categorie:'Biochimie',         B:30  },
    { code:'FRT',  nom:'Ferritinémie',                      categorie:'Biochimie',         B:100 },
    { code:'MIC',  nom:'Microalbuminurie',                  categorie:'Biochimie',         B:45  },
    { code:'EPP',  nom:'Électrophorèse des Protéines',      categorie:'Biochimie',         B:60  },
    { code:'NFS',  nom:'Numération Formule Sanguine (NFS)', categorie:'Hématologie',       B:30  },
    { code:'HGB',  nom:'Taux d\'Hémoglobine',              categorie:'Hématologie',       B:10  },
    { code:'PLQ',  nom:'Taux de Plaquettes',                categorie:'Hématologie',       B:15  },
    { code:'RET',  nom:'Taux de Réticulocytes',             categorie:'Hématologie',       B:10  },
    { code:'GRP',  nom:'Groupe Sanguin + Rhésus',           categorie:'Hématologie',       B:30  },
    { code:'VB12', nom:'Vitamine B12',                      categorie:'Hématologie',       B:100 },
    { code:'VB9',  nom:'Vitamine B9 (Folates)',             categorie:'Hématologie',       B:100 },
    { code:'EHB',  nom:'Électrophorèse de l\'Hémoglobine', categorie:'Hématologie',       B:60  },
    { code:'TP',   nom:'Taux de Prothrombine (TP) + INR',  categorie:'Hémostase',         B:20  },
    { code:'TCA',  nom:'Temps de Céphaline Activée (TCA)', categorie:'Hémostase',         B:20  },
    { code:'FIB',  nom:'Fibrinogène',                       categorie:'Hémostase',         B:20  },
    { code:'DDI',  nom:'D-Dimères',                         categorie:'Hémostase',         B:100 },
    { code:'AT3',  nom:'Antithrombine III',                 categorie:'Hémostase',         B:40  },
    { code:'TSH',  nom:'TSH 3ème Génération',              categorie:'Hormonologie',      B:90  },
    { code:'T3L',  nom:'T3 Libre',                          categorie:'Hormonologie',      B:90  },
    { code:'T4L',  nom:'T4 Libre',                          categorie:'Hormonologie',      B:90  },
    { code:'HBA',  nom:'Hémoglobine Glyquée (HbA1c)',      categorie:'Hormonologie',      B:70  },
    { code:'INS',  nom:'Insuline Plasmatique',              categorie:'Hormonologie',      B:100 },
    { code:'FSH',  nom:'FSH Plasmatique',                   categorie:'Hormonologie',      B:90  },
    { code:'LH',   nom:'LH Plasmatique',                    categorie:'Hormonologie',      B:90  },
    { code:'PRL',  nom:'Prolactine Plasmatique',            categorie:'Hormonologie',      B:100 },
    { code:'EST',  nom:'Estradiol Plasmatique',             categorie:'Hormonologie',      B:100 },
    { code:'PRG',  nom:'Progestérone Plasmatique',          categorie:'Hormonologie',      B:100 },
    { code:'TST',  nom:'Testostérone Plasmatique',          categorie:'Hormonologie',      B:100 },
    { code:'COR',  nom:'Cortisol Plasmatique',              categorie:'Hormonologie',      B:100 },
    { code:'PTH',  nom:'Parathormone (PTH)',                categorie:'Hormonologie',      B:92  },
    { code:'VTD',  nom:'Vitamine D (25-OH)',                categorie:'Hormonologie',      B:125 },
    { code:'HCG',  nom:'Beta HCG Plasmatique',             categorie:'Hormonologie',      B:100 },
    { code:'PPC',  nom:'Peptide C Plasmatique',             categorie:'Hormonologie',      B:125 },
    { code:'GH',   nom:'Hormone de Croissance (GH)',        categorie:'Hormonologie',      B:150 },
    { code:'PSA',  nom:'PSA Total 3ème Génération',        categorie:'Marqueurs Tumoraux',B:100 },
    { code:'PSAL', nom:'PSA Libre + Calcul Risque',         categorie:'Marqueurs Tumoraux',B:100 },
    { code:'ACE',  nom:'ACE',                               categorie:'Marqueurs Tumoraux',B:100 },
    { code:'AFP',  nom:'AFP (Alpha-Foetoprotéine)',         categorie:'Marqueurs Tumoraux',B:70  },
    { code:'CA125',nom:'CA 125',                            categorie:'Marqueurs Tumoraux',B:100 },
    { code:'CA153',nom:'CA 15.3',                           categorie:'Marqueurs Tumoraux',B:100 },
    { code:'CA199',nom:'CA 19.9',                           categorie:'Marqueurs Tumoraux',B:100 },
    { code:'ECB',  nom:'ECBU',                              categorie:'Bactériologie',     B:45  },
    { code:'PV',   nom:'Prélèvement Vaginal (PV)',          categorie:'Bactériologie',     B:65  },
    { code:'SPM',  nom:'Spermogramme + Spermocytogramme',   categorie:'Bactériologie',     B:60  },
    { code:'CPR',  nom:'Coproculture',                      categorie:'Bactériologie',     B:65  },
    { code:'HMC',  nom:'Hémoculture',                       categorie:'Bactériologie',     B:65  },
    { code:'ABG',  nom:'Antibiogramme',                     categorie:'Bactériologie',     B:65  },
    { code:'KOP',  nom:'Examen Parasitologique des Selles', categorie:'Parasitologie',    B:35  },
    { code:'GE',   nom:'Goutte Épaisse / Paludisme',        categorie:'Parasitologie',    B:25  },
    { code:'TDR',  nom:'Test Rapide Paludisme (TDR)',       categorie:'Parasitologie',    B:25  },
    { code:'HIV',  nom:'HIV 1/2 Dépistage',                categorie:'Immunologie',       B:70  },
    { code:'AGBS', nom:'Antigène HBs (Hépatite B)',         categorie:'Immunologie',       B:70  },
    { code:'ACBC', nom:'Ac Anti-HBc Totaux',                categorie:'Immunologie',       B:70  },
    { code:'ACHC', nom:'Ac Anti-VHC (Hépatite C)',          categorie:'Immunologie',       B:70  },
    { code:'SYP',  nom:'Sérologie Syphilis (VDRL+TPHA)',   categorie:'Immunologie',       B:40  },
    { code:'TOX',  nom:'Toxoplasmose IgG + IgM',            categorie:'Immunologie',       B:50  },
    { code:'RUB',  nom:'Rubéole IgG + IgM',                categorie:'Immunologie',       B:50  },
    { code:'ASL',  nom:'ASLO (Antistreptolysine O)',        categorie:'Immunologie',       B:35  },
    { code:'HEL',  nom:'Helicobacter Pylori IgG',           categorie:'Immunologie',       B:40  },
    { code:'CD4',  nom:'CD4 / CD8',                         categorie:'Immunologie',       B:45  },
    { code:'WID',  nom:'Widal et Félix (Salmonellose)',     categorie:'Immunologie',       B:40  },
    { code:'CMV',  nom:'Cytomégalovirus IgG + IgM',         categorie:'Immunologie',       B:80  },
  ]

  const typesTubeMap: Record<string,string> = {
    'GLY':'Fluorure','URE':'Sec','CRE':'Sec','ACU':'Sec','CRP':'Sec',
    'CHT':'Sec','HDL':'Sec','LDL':'Sec','TRG':'Sec','LIP':'Sec',
    'GGT':'Sec','ASA':'Sec','ALA':'Sec','BIT':'Sec','BIC':'Sec',
    'PAL':'Sec','ALB':'Sec','PTT':'Sec','CAL':'Sec','PHO':'Sec',
    'SOD':'Sec','POT':'Sec','ION':'Sec','LDH':'Sec','LPS':'Sec',
    'AMY':'Sec','FRU':'Sec','MAG':'Sec','FER':'Sec','FRT':'Sec',
    'MIC':'Urine 24h','EPP':'Sec',
    'NFS':'EDTA','HGB':'EDTA','PLQ':'EDTA','RET':'EDTA','GRP':'EDTA',
    'VB12':'Sec','VB9':'EDTA','EHB':'EDTA',
    'TP':'Citrate','TCA':'Citrate','FIB':'Citrate','DDI':'Citrate','AT3':'Citrate',
    'TSH':'Sec','T3L':'Sec','T4L':'Sec','HBA':'EDTA','INS':'Sec',
    'FSH':'Sec','LH':'Sec','PRL':'Sec','EST':'Sec','PRG':'Sec',
    'TST':'Sec','COR':'Sec','PTH':'Sec','VTD':'Sec','HCG':'Sec','PPC':'Sec','GH':'Sec',
    'PSA':'Sec','PSAL':'Sec','ACE':'Sec','AFP':'Sec','CA125':'Sec','CA153':'Sec','CA199':'Sec',
    'ECB':'Stérile','PV':'Stérile','SPM':'Stérile','CPR':'Stérile','HMC':'EDTA','ABG':'Stérile',
    'KOP':'Stérile','GE':'EDTA','TDR':'EDTA',
    'HIV':'Sec','AGBS':'Sec','ACBC':'Sec','ACHC':'Sec','SYP':'Sec',
    'TOX':'Sec','RUB':'Sec','ASL':'Sec','HEL':'Sec','CD4':'EDTA','WID':'Sec','CMV':'Sec',
  }

  for (const e of examens) {
    const tarifMax = e.B * valeurB
    const tarifMin = Math.round(tarifMax * 0.9)
    await prisma.examenCatalogue.upsert({
      where:  { code: e.code },
      update: { valeurB:e.B, tarifMin, tarifMax },
      create: {
        code:        e.code,
        nom:         e.nom,
        categorie:   e.categorie,
        valeurB:     e.B,
        tarifMin,
        tarifMax,
        typesTube:   typesTubeMap[e.code] || 'Sec',
        actif:       true,
      },
    })
  }
  console.log(`✅ ${examens.length} examens créés — valeur B = ${valeurB} XOF`)

  // ─── 9. PANELS D'ANALYSES ───────────────────────────────
  const panels = [
    { code:'BIL-DIA',     nom:'Bilan Diabète Complet',       categorie:'Bilan courant',    examens:['GLY','HBA','MIC','CRE'] },
    { code:'BIL-RENAL',   nom:'Bilan Rénal',                 categorie:'Bilan courant',    examens:['URE','CRE','ACU','ION'] },
    { code:'BIL-HEP',     nom:'Bilan Hépatique Complet',     categorie:'Bilan courant',    examens:['ASA','ALA','GGT','BIT','PAL','PTT'] },
    { code:'BIL-LIP',     nom:'Bilan Lipidique',             categorie:'Bilan courant',    examens:['CHT','HDL','LDL','TRG'] },
    { code:'BIL-THY',     nom:'Bilan Thyroïdien',            categorie:'Bilan courant',    examens:['TSH','T3L','T4L'] },
    { code:'BIL-CARDIO',  nom:'Bilan Cardiovasculaire',      categorie:'Bilan spécialisé', examens:['NFS','CHT','HDL','LDL','TRG','GLY','CRP','ION'] },
    { code:'BIL-PRE',     nom:'Bilan Prénuptial',            categorie:'Bilan spécialisé', examens:['NFS','GRP','HIV','SYP','AGBS','HBA'] },
    { code:'BIL-PRE-GRO', nom:'Bilan Prénatal',              categorie:'Bilan spécialisé', examens:['NFS','GRP','TOX','RUB','HIV','AGBS','GLY'] },
    { code:'BIL-STD',     nom:'Bilan Standard Annuel',       categorie:'Bilan courant',    examens:['NFS','GLY','CHT','HDL','LDL','TRG','URE','CRE','ASA','ALA'] },
    { code:'BIL-HORM-F',  nom:'Bilan Hormonal Féminin',      categorie:'Bilan spécialisé', examens:['FSH','LH','EST','PRG','PRL','TSH'] },
    { code:'BIL-PSA',     nom:'Bilan Prostate',              categorie:'Bilan spécialisé', examens:['PSA','PSAL'] },
    { code:'BIL-INF',     nom:'Bilan Infectieux',            categorie:'Bilan courant',    examens:['NFS','CRP','ASL','WID'] },
    { code:'BIL-CAMP',    nom:'Bilan Campagne Standard',     categorie:'Campagne',         examens:['NFS','GLY','HIV','SYP','AGBS','GRP'] },
  ]

  for (const panel of panels) {
    const p = await prisma.panel.upsert({
      where:  { code: panel.code },
      update: { nom:panel.nom },
      create: { code:panel.code, nom:panel.nom, categorie:panel.categorie, actif:true },
    })
    for (let i = 0; i < panel.examens.length; i++) {
      const cat = await prisma.examenCatalogue.findUnique({ where:{ code:panel.examens[i] } })
      if (cat) {
        await prisma.panelExamen.upsert({
          where:  { panelId_catalogueId:{ panelId:p.id, catalogueId:cat.id } },
          update: { ordre:i },
          create: { panelId:p.id, catalogueId:cat.id, ordre:i },
        })
      }
    }
  }
  console.log('✅ 13 panels créés')

  // ─── 10. ORGANISATIONS ──────────────────────────────────
  const organisations = [
    { nom:'Police Nationale de Côte d\'Ivoire', type:'INSTITUTION_PUBLIQUE' as const, commune:'Plateau',  contactNom:'Dr. Responsable Médical' },
    { nom:'MTN Côte d\'Ivoire',                 type:'ENTREPRISE'           as const, commune:'Plateau',  contactNom:'Responsable RH' },
    { nom:'Orange Côte d\'Ivoire',              type:'ENTREPRISE'           as const, commune:'Cocody',   contactNom:'Responsable RH' },
  ]
  for (const o of organisations) {
    await prisma.organisation.upsert({ where:{ nom:o.nom }, update:{}, create:o })
  }
  console.log('✅ 3 organisations créées')

  // ─── 11. STOCK AGENT ────────────────────────────────────
  const agent = await prisma.agent.findFirst()
  if (agent) {
    const materiaux = [
      { materiau:'tubes_EDTA',     quantite:30, seuilAlerte:10 },
      { materiau:'tubes_sec',      quantite:30, seuilAlerte:10 },
      { materiau:'tubes_fluorure', quantite:20, seuilAlerte:8  },
      { materiau:'tubes_citrate',  quantite:15, seuilAlerte:5  },
      { materiau:'aiguilles_21G',  quantite:30, seuilAlerte:10 },
      { materiau:'compresses',     quantite:50, seuilAlerte:15 },
      { materiau:'desinfectant',   quantite:5,  seuilAlerte:2  },
      { materiau:'gants_latex',    quantite:40, seuilAlerte:10 },
    ]
    for (const item of materiaux) {
      await prisma.stockAgent.upsert({
        where:  { agentId_materiau:{ agentId:agent.id, materiau:item.materiau } },
        update: {},
        create: { agentId:agent.id, ...item },
      })
    }
    console.log('✅ Stock initial créé')
  }

  // ─── 12. PATIENTS & DOSSIERS DE DÉMONSTRATION ──────────
  const mugefci  = await prisma.assurance.findUnique({ where: { nom: 'MUGEFCI'   } })
  const cnps     = await prisma.assurance.findUnique({ where: { nom: 'CNPS'      } })
  const sanlam   = await prisma.assurance.findUnique({ where: { nom: 'Sanlam CI' } })

  // Helper : récupère l'id d'un examen catalogue par code
  async function catId(code: string) {
    const e = await prisma.examenCatalogue.findUnique({ where: { code } })
    return e?.id ?? null
  }

  const patientsDemo = [
    {
      ref: 'PAT-2026-00001', nom: 'Kouassi', prenom: 'Ama',
      telephone: '0707070707', commune: 'Yopougon',
      assuranceId: mugefci?.id,
      dossierRef: 'DOS-2026-00001', statut: 'EN_ATTENTE'       as const,
      statutAssurance: 'VALIDE_TOTAL'  as const,
      ocrSource: 'AUTO'    as const,
      examCodes: ['NFS', 'GLY', 'CRE'],
    },
    {
      ref: 'PAT-2026-00002', nom: 'Diallo', prenom: 'Moussa',
      telephone: '0505050505', commune: 'Yopougon',
      assuranceId: undefined,
      dossierRef: 'DOS-2026-00002', statut: 'PRET_PRELEVEMENT' as const,
      statutAssurance: null,
      ocrSource: 'PATIENT' as const,
      examCodes: ['TSH', 'T4L'],
    },
    {
      ref: 'PAT-2026-00003', nom: 'Traoré', prenom: 'Fatou',
      telephone: '0101010101', commune: 'Yopougon',
      assuranceId: cnps?.id,
      dossierRef: 'DOS-2026-00003', statut: 'PRELEVEMENT_FAIT' as const,
      statutAssurance: 'EN_VALIDATION' as const,
      ocrSource: 'AUTO'    as const,
      examCodes: ['NFS', 'HIV', 'AGBS'],
    },
    {
      ref: 'PAT-2026-00004', nom: 'Koné', prenom: 'Ibrahim',
      telephone: '0909090909', commune: 'Yopougon',
      assuranceId: undefined,
      dossierRef: 'DOS-2026-00004', statut: 'EN_ATTENTE'       as const,
      statutAssurance: null,
      ocrSource: 'AGENT'   as const,
      examCodes: ['GLY', 'HBA'],
    },
    {
      ref: 'PAT-2026-00005', nom: 'Bamba', prenom: 'Adjoua',
      telephone: '0303030303', commune: 'Yopougon',
      assuranceId: sanlam?.id,
      dossierRef: 'DOS-2026-00005', statut: 'PAYE'             as const,
      statutAssurance: 'VALIDE_PARTIEL' as const,
      ocrSource: 'AUTO'    as const,
      examCodes: ['FSH', 'EST', 'PRG'],
    },
  ]

  for (const p of patientsDemo) {
    // Upsert patient
    const patient = await prisma.patient.upsert({
      where:  { ref: p.ref },
      update: {},
      create: {
        ref:         p.ref,
        nom:         p.nom,
        prenom:      p.prenom,
        telephone:   p.telephone,
        commune:     p.commune,
        ...(p.assuranceId ? { assuranceId: p.assuranceId } : {}),
      },
    })

    // Upsert dossier
    const dossier = await prisma.dossier.upsert({
      where:  { ref: p.dossierRef },
      update: {},
      create: {
        ref:             p.dossierRef,
        patientId:       patient.id,
        statut:          p.statut,
        statutAssurance: p.statutAssurance,
        ocrSource:       p.ocrSource,
      },
    })

    // Ajouter les examens seulement si le dossier n'en a pas encore
    const existingCount = await prisma.examen.count({ where: { dossierId: dossier.id } })
    if (existingCount === 0) {
      for (const code of p.examCodes) {
        const cId = await catId(code)
        if (!cId) continue
        const catalogue = await prisma.examenCatalogue.findUnique({ where: { id: cId } })
        if (!catalogue) continue
        await prisma.examen.create({
          data: {
            dossierId:   dossier.id,
            catalogueId: cId,
            tarif:       catalogue.tarifMax,
            couvert:     p.assuranceId ? true : false,
          },
        })
      }
    }
  }
  console.log('✅ 5 patients et 5 dossiers de démonstration créés')

  // ─── 13. MISSIONS DE TEST ───────────────────────────────
  const agentBernard = await prisma.agent.findUnique({ where: { telephone: '+225 07 00 00 00' } })
  const agentFatou   = await prisma.agent.findUnique({ where: { telephone: '+225 0102030405' } })

  // 4ème agent pour les missions si absent
  const agentSaffo = await prisma.agent.upsert({
    where:  { telephone: '+225 0708090001' },
    update: {},
    create: {
      nom:            'Saffo',
      prenom:         'Jean Claude',
      telephone:      '+225 0708090001',
      commune:        'Yopougon',
      statut:         'ACTIF',
      tauxCommission: 0.15,
    }
  })

  const dossMoussa  = await prisma.dossier.findUnique({ where: { ref: 'DOS-2026-00002' } })
  const dossFatou   = await prisma.dossier.findUnique({ where: { ref: 'DOS-2026-00003' } })
  const dossAdjoua  = await prisma.dossier.findUnique({ where: { ref: 'DOS-2026-00005' } })

  const today     = new Date()
  const yesterday = new Date(Date.now() - 86_400_000)

  const missions = [
    {
      ref:     'MIS-2026-00001',
      agentId: agentBernard!.id,
      dossier: dossMoussa,
      statut:  'PLANIFIEE' as const,
      date:    today,
    },
    {
      ref:     'MIS-2026-00002',
      agentId: agentFatou!.id,
      dossier: dossFatou,
      statut:  'EN_ROUTE' as const,
      date:    today,
    },
    {
      ref:     'MIS-2026-00003',
      agentId: agentSaffo.id,
      dossier: dossAdjoua,
      statut:  'TERMINEE' as const,
      date:    yesterday,
    },
  ]

  for (const m of missions) {
    const mission = await prisma.mission.upsert({
      where:  { ref: m.ref },
      update: { statut: m.statut },
      create: {
        ref:     m.ref,
        agentId: m.agentId,
        date:    m.date,
        statut:  m.statut,
      },
    })
    // Lier le dossier à la mission si pas encore lié
    if (m.dossier && !m.dossier.missionId) {
      await prisma.dossier.update({
        where: { id: m.dossier.id },
        data:  { missionId: mission.id },
      })
    }
  }
  console.log('✅ 3 missions de test créées')

  console.log('')
  console.log('🎉 Seed terminé avec succès !')
  console.log('   → 1 compte admin  (admin@prelevia.ci / Admin2026!)')
  console.log('   → 4 agents (Kouassi Bernard, Diallo Fatou, Traoré Moussa, Saffo Jean Claude)')
  console.log('   → 5 assureurs')
  console.log('   → 1 laboratoire')
  console.log('   → 7 paramètres système')
  console.log('   → 6 templates SMS')
  console.log('   → 8 zones géographiques')
  console.log('   → 87 examens catalogués')
  console.log('   → 13 panels d\'analyses')
  console.log('   → 3 organisations')
  console.log('   → 8 articles de stock')
  console.log('   → 5 patients + 5 dossiers de démonstration')
  console.log('   → 3 missions de test')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })

