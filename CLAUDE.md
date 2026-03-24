# PRELEVIA — CLAUDE.md · Contexte Complet du Projet

> **Document de référence pour Claude Code**  
> Service de Prélèvement Biologique à Domicile — Yopougon, Abidjan, Côte d'Ivoire  
> Version synthèse — Mars 2026 — Confidentiel

---

## 1. VUE D'ENSEMBLE DU PROJET

Prelevia est une plateforme numérique complète pour un service de **prélèvement biologique à domicile** opérant à Abidjan (Phase 1 : Yopougon). Le modèle envoie des agents qualifiés directement chez le patient, éliminant les déplacements en laboratoire.

### Les 3 interfaces connectées

| Interface | Type | Public | Rôle |
|-----------|------|--------|------|
| **Back-office Web** | React SPA | Admins/coordinateurs | Gestion patients, OCR, assurances, paiements, agents, stock, rapports |
| **Application Patient** | Mobile (React) | Patients | Upload bulletin, OCR, suivi temps réel, résultats |
| **Application Agent** | Mobile (React) | Agents terrain | Tournée, examens pré-visibles, encaissement, stock |

### Phases de développement business

| Phase | Description | Durée |
|-------|-------------|-------|
| Phase 1 — Couverture | Opère sous agrément Labo Maison Blanche. Yopougon exclusif. | Mois 1–6 |
| Phase 2 — Détachement | Agréments propres. Extension géographique. | Mois 7–12 |
| Phase 3 — Autonomie | Entité 100% indépendante, partenariats propres. | M12+ |

---

## 2. ÉTAT D'AVANCEMENT — CE QUI EST RÉALISÉ

### ✅ PROTOTYPE FRONTEND COMPLET (prelevia-complet.jsx)

Un **prototype React monofichier v5** (133 897 octets) est entièrement fonctionnel. Il simule les 3 interfaces dans une seule SPA avec navigation par onglets.

#### Back-office Web — Pages implémentées

| Page | Statut | Contenu implémenté |
|------|--------|-------------------|
| `dashboard` | ✅ Complet | KPIs temps réel (patients, OCR %, assurances en cours, revenus agents), quick actions Kanban, tableau patients récents, graphique sources OCR |
| `patients` | ✅ Complet | Liste filtrée, badges OCR source (🤖/✋/🏍️), modal création avec upload bulletin + OCR simulé + sélection manuelle examens + upload carte assurance + CNI |
| `assurances` | ✅ Complet | Workflow 5 étapes (docs_collectes → soumis_labo → en_validation → validé_total/partiel), modal détail avec docs, examens couverts/non-couverts, saisie validation examen par examen, calcul auto part patient |
| `paiements` | ✅ Complet | Historique encaissements, résumé par mode (cash/mobile), statuts payé/en attente, calcul automatique |
| `agents` | ✅ Complet | Liste agents, KPIs, carte Leaflet centrée Yopougon (5.354°N, 4.005°O), missions actives |
| `stock` | ✅ Complet | Inventaire tubes/consommables par agent, barres de niveau (vert/orange/rouge), alertes seuil bas, bouton réapprovisionnement |
| `rapports` | ✅ Complet | CA par période, répartition sources OCR, examens populaires, répartition communes |

#### Application Patient — Onglets implémentés

| Onglet | Statut | Contenu |
|--------|--------|---------|
| **Mon RDV** | ✅ Complet | Upload bulletin (photo/PDF) → animation OCR → extraction examens → confirmation/correction → upload carte assurance + CNI → soumission anticipée assureur |
| **Suivi** | ✅ Complet | Carte animée position agent + ETA décomptant, timeline 7 étapes (RDV → Docs → OCR → Assurance → Agent en route → Prélèvement → Paiement → Résultats) |
| **Résultats** | ✅ Complet | Valeurs par examen avec unités + intervalles de référence, code couleur vert/orange, PDF téléchargeable |

#### Application Agent — Onglets implémentés

| Onglet | Statut | Contenu |
|--------|--------|---------|
| **Tournée** | ✅ Complet | Liste missions + badge source OCR, examens visibles AVANT visite, statut assurance (en attente / validée totale / validée partielle + montant), bouton "Prélèvement fait · Encaisser" |
| **Modal Paiement** | ✅ Complet | Détail couverts vs non-couverts, total à encaisser en grand, 4 modes (Cash, Orange Money, MTN, Wave), confirmation → revenus mis à jour |
| **Revenus** | ✅ Complet | Montant gagné temps réel, barre progression objectif journalier, historique détaillé (patient, examens, montant, heure, mode) |
| **Matériel** | ✅ Complet | Stock temps réel, alertes critiques, demande réapprovisionnement |

### ✅ FONCTIONNALITÉS TRANSVERSES IMPLÉMENTÉES

- **OCR simulé** : 3 sources distinctes (🤖 Auto = OCR Google Vision, ✋ Patient = saisie manuelle, 🏍️ Agent = saisie terrain)
- **Calcul financier automatique** : fonction `calcT()` — part patient = (examens couverts × 20%) + examens non couverts
- **Workflow assurance** : machine à états 5 étapes complète avec transitions et notifications toast
- **Données de démonstration** : 6 patients avec examens, assurances, statuts variés (seed INIT_PATIENTS)
- **Catalogue examens** : 37 examens courants pour sélection manuelle
- **Design system complet** : palette couleurs, composants (badge, btn, modal, table, stat-card, steps-bar, exam-chip, upload-zone, payment-methods)
- **Toast notifications** : retours utilisateur sur chaque action
- **Navigation** : sidebar web + bottom tabs mobile, transitions fluides
- **Badge "Labo Maison Blanche"** : mention couverture Phase 1 dans sidebar

### ✅ DOCUMENTATION RÉDIGÉE

- **Guide projet complet** (`prelevia_guide_v2.docx`) — Parties 1 à 12 + Annexes
- **Guide back-office** (`prelevia_guide_backoffice.docx`)
- **CLAUDE.md v1** — Contexte projet précédent

---

## 3. CE QUI RESTE À FAIRE

### Backend (non commencé)
- Schéma BDD Prisma (PostgreSQL)
- API REST Express — toutes les routes
- Service OCR réel (Google Vision API)
- Upload fichiers (AWS S3 ou Supabase)
- Service SMS (Twilio)
- Auth JWT + bcrypt
- Socket.io temps réel suivi agent
- Intégration Mobile Money (Orange, MTN, Wave)

### Frontend — Améliorations
- Connexion au backend réel (remplacer données simulées)
- Authentification (écran de login, gestion rôles)
- Vraie carte Leaflet avec tracking GPS temps réel
- Module résultats d'examens (saisie côté labo)
- Notifications push mobile

### Infrastructure
- Déploiement (Railway ou VPS OVH)
- Configuration domaine, SSL
- Seeds production (catalogue examens complet)

---

## 4. STACK TECHNIQUE

| Couche | Technologie |
|--------|-------------|
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS |
| State | Zustand |
| Backend/API | Node.js + Express |
| Base de données | PostgreSQL |
| ORM | Prisma |
| Auth | JWT + bcrypt |
| OCR | Google Vision API |
| SMS | Twilio |
| Stockage | AWS S3 ou Supabase |
| Temps réel | Socket.io |
| Carte | Leaflet.js (centré Yopougon : 5.354°N, 4.005°O) |
| Hébergement | Railway ou VPS OVH |

### Variables d'environnement requises
```env
DATABASE_URL="postgresql://user:password@localhost:5432/prelevia"
JWT_SECRET="prelevia_secret_ultra_securise_2026"
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=prelevia-documents
GOOGLE_VISION_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=+1xxx
PORT=3001
```

### Structure cible des dossiers
```
prelevia-backoffice/
├── client/
│   └── src/
│       ├── components/     # Composants réutilisables
│       ├── pages/          # Pages back-office
│       ├── store/          # Zustand stores
│       ├── hooks/
│       ├── services/       # Appels API axios
│       └── types/          # Types TypeScript
├── server/
│   └── src/
│       ├── routes/         # Routes Express par module
│       ├── controllers/    # Logique métier
│       ├── middlewares/    # Auth, validation, erreurs
│       ├── services/       # OCR, SMS, Mobile Money, S3
│       └── prisma/         # Schéma BDD + migrations
└── shared/                 # Types partagés frontend/backend
```

---

## 5. LOGIQUE MÉTIER CRITIQUE

### Calcul part patient

```typescript
// Implémenté dans le prototype (calcT) — à porter en TypeScript
export function calculerPartPatient(examens) {
  let totalFacture = 0, partAssurance = 0, partPatient = 0;
  examens.forEach(examen => {
    totalFacture += examen.tarif;
    if (examen.couvert === true) {
      partAssurance += Math.round(examen.tarif * 0.80);
      partPatient   += Math.round(examen.tarif * 0.20);
    } else {
      partPatient   += examen.tarif; // 100% charge patient
    }
  });
  return { totalFacture, partAssurance, partPatient };
}
```

**Exemple :** NFS 4 500 (couvert) + Glycémie 3 000 (couverte) + Bilan lipidique 7 500 (non couvert)
- Part patient = (4 500 + 3 000) × 20% + 7 500 = **9 000 XOF**
- Part assurance = (4 500 + 3 000) × 80% = **6 000 XOF**

### Workflow assurance — Machine à états

```
docs_collectes → soumis_labo → en_validation → valide_total
                                              ↘ valide_partiel
```

| Statut | Responsable | Action |
|--------|-------------|--------|
| `docs_collectes` | Patient (app) | Upload bulletin + carte assurance + CNI |
| `soumis_labo` | Admin | Transmis au labo partenaire |
| `en_validation` | Assureur | En attente décision |
| `valide_total` | Admin | Tous examens couverts à 80% |
| `valide_partiel` | Admin | Saisie couverture examen par examen |

### Sources OCR — 3 origines

| Code | Icône | Libellé | Description |
|------|-------|---------|-------------|
| `auto` | 🤖 | OCR Auto | Google Vision a lu le bulletin |
| `patient` | ✋ | Saisie patient | Patient a sélectionné manuellement |
| `agent` | 🏍️ | Saisie agent | Agent a complété sur le terrain |

---

## 6. SCHÉMA PRISMA — MODÈLE DE DONNÉES COMPLET

> Source de vérité : `server/prisma/schema.prisma`  
> Base de données : **PostgreSQL**  
> ORM : **Prisma**

### Enums

```prisma
enum Role {
  SUPER_ADMIN
  ADMIN
  COORDINATEUR
}

enum AgentStatut {
  ACTIF
  INACTIF
  SUSPENDU
  EN_FORMATION
}

enum DossierStatut {
  EN_ATTENTE
  PRET_PRELEVEMENT
  PRELEVEMENT_FAIT
  PAYE
  ARCHIVE
}

enum OcrSource {
  AUTO      // Google Vision — bulletin uploadé
  PATIENT   // Sélection manuelle par le patient
  AGENT     // Saisie terrain par l'agent
  MANUAL    // Saisie admin back-office
}

enum AssuranceStatut {
  DOCS_COLLECTES   // Docs uploadés dès le RDV
  SOUMIS_LABO      // Transmis au Labo Maison Blanche
  EN_VALIDATION    // En attente décision assureur
  VALIDE_TOTAL     // Tous examens couverts à 80%
  VALIDE_PARTIEL   // Couverture examen par examen
  REFUSE
}

enum MissionStatut {
  PLANIFIEE
  EN_ROUTE
  ARRIVEE
  PRELEVEMENT_FAIT
  TERMINEE
}

enum ModePaiement {
  CASH
  ORANGE_MONEY
  MTN_MONEY
  WAVE
  VIREMENT
}

enum PaiementStatut {
  EN_ATTENTE
  CONFIRME
  ECHEC
}

enum TypeRevenu {
  FIXE_MENSUEL
  PRIME_PRELEVEMENT
  COMMISSION_ENCAISSEMENT
  PRIME_QUALITE
}
```

### Modèles

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  nom       String
  prenom    String
  role      Role     @default(ADMIN)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Assurance {
  id              String    @id @default(cuid())
  nom             String    @unique
  type            String
  tauxCouverture  Int
  delaiValidation String
  contactEmail    String?
  contactTel      String?
  patients        Patient[]
}

model Patient {
  id          String     @id @default(cuid())
  ref         String     @unique
  nom         String
  prenom      String
  telephone   String
  commune     String
  adresse     String?
  assuranceId String?
  assurance   Assurance? @relation(fields: [assuranceId], references: [id])
  numCarte    String?
  dossiers    Dossier[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([telephone])
  @@index([commune])
}

model Dossier {
  id                String           @id @default(cuid())
  ref               String           @unique
  patientId         String
  patient           Patient          @relation(fields: [patientId], references: [id])
  statut            DossierStatut    @default(EN_ATTENTE)
  statutAssurance   AssuranceStatut?
  ocrSource         OcrSource        @default(MANUAL)
  bulletinUrl       String?          // URL S3 bulletin scanné
  carteAssuranceUrl String?          // URL S3 carte assurance
  cniUrl            String?          // URL S3 CNI
  noteAdmin         String?
  examens           Examen[]
  paiements         Paiement[]
  missionId         String?
  mission           Mission?         @relation(fields: [missionId], references: [id])
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  @@index([patientId])
  @@index([statut])
  @@index([statutAssurance])
}

model ExamenCatalogue {
  id          String   @id @default(cuid())
  code        String   @unique        // ex: "NFS", "GLY", "TSH"
  nom         String   @unique
  categorie   String
  valeurB     Int      @default(0)    // Coefficient B (ex: 10 pour Glycémie)
  tarifMin    Int                     // = round(valeurB × VALEUR_B × 0.9)
  tarifMax    Int                     // = valeurB × VALEUR_B
  typesTube   String?
  description String?
  examens     Examen[]
}

model Examen {
  id          String          @id @default(cuid())
  dossierId   String
  dossier     Dossier         @relation(fields: [dossierId], references: [id], onDelete: Cascade)
  catalogueId String
  catalogue   ExamenCatalogue @relation(fields: [catalogueId], references: [id])
  tarif       Int             // Tarif figé au moment de la création du dossier
  couvert     Boolean?        // null = en attente, true = couvert, false = non couvert
  quotePart   Int?            // Part patient calculée

  @@index([dossierId])
}

model Mission {
  id        String        @id @default(cuid())
  ref       String        @unique
  agentId   String
  agent     Agent         @relation(fields: [agentId], references: [id])
  dossiers  Dossier[]
  revenus   Revenu[]
  date      DateTime
  statut    MissionStatut @default(PLANIFIEE)
  latitude  Float?
  longitude Float?
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  @@index([agentId])
  @@index([date])
}

model Agent {
  id             String       @id @default(cuid())
  nom            String
  prenom         String
  telephone      String       @unique
  email          String?
  commune        String
  statut         AgentStatut  @default(ACTIF)
  tauxCommission Float        @default(0.15)
  missions       Mission[]
  stocks         StockAgent[]
  revenus        Revenu[]
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
}

model Paiement {
  id        String         @id @default(cuid())
  dossierId String
  dossier   Dossier        @relation(fields: [dossierId], references: [id])
  montant   Int
  mode      ModePaiement
  statut    PaiementStatut @default(EN_ATTENTE)
  reference String?
  encaisseA DateTime?
  createdAt DateTime       @default(now())

  @@index([dossierId])
  @@index([encaisseA])
}

model StockAgent {
  id          String   @id @default(cuid())
  agentId     String
  agent       Agent    @relation(fields: [agentId], references: [id])
  materiau    String
  quantite    Int
  seuilAlerte Int      @default(10)
  updatedAt   DateTime @updatedAt

  @@unique([agentId, materiau])
}

model Revenu {
  id        String     @id @default(cuid())
  agentId   String
  agent     Agent      @relation(fields: [agentId], references: [id])
  missionId String?
  mission   Mission?   @relation(fields: [missionId], references: [id])
  montant   Int
  type      TypeRevenu
  date      DateTime   @default(now())

  @@index([agentId])
  @@index([date])
}

model Parametre {
  id          String   @id @default(cuid())
  cle         String   @unique
  valeur      String
  description String?
  updatedAt   DateTime @updatedAt
}
```

### Modèles absents du schéma actuel — à ajouter

Ces modèles sont utilisés dans le seed mais pas encore dans le schéma. À intégrer lors du prochain `prisma migrate` :

| Modèle | Usage |
|--------|-------|
| `Laboratoire` | Labo partenaire (Maison Blanche), champ `valeurB`, `principal` |
| `Panel` | Groupes d'examens paramétrables — `code`, `nom`, `categorie`, `actif` |
| `PanelExamen` | Relation Panel ↔ ExamenCatalogue avec `ordre` |
| `Zone` | Zones géographiques avec `fraisDeplacement` par commune |
| `TemplateSMS` | Templates SMS paramétrables — `code`, `sujet`, `contenu`, `actif` |
| `Organisation` | Entreprises/institutions pour campagnes de prélèvement |

### Relations — Schéma simplifié

```
User                         (authentification back-office)
Patient ──────── Dossier[] ──────── Examen[] ──── ExamenCatalogue
         └────── Assurance          Paiement[]
                                    Mission? ───── Agent
                                                    ├── StockAgent[]
                                                    └── Revenu[]
Parametre                    (clé/valeur système — VALEUR_B, OCR_ACTIF…)
```


## 7. CATALOGUE EXAMENS — COTATION B

### Principe de tarification

Les tarifs sont calculés selon la **nomenclature des actes de biologie médicale** (cotation B) :

```
tarifMax (XOF) = coefficient_B × valeur_B
tarifMin (XOF) = round(tarifMax × 0.9)
```

**Valeur B actuelle : 200 XOF/point** (Laboratoire Maison Blanche — paramétrable back-office)

Le modèle stocke `valeurB` (coefficient) par examen. Les tarifs min/max sont recalculés à chaque mise à jour de la valeur B globale via le paramètre système `VALEUR_B`.

### Modèle Prisma réel (issu du seed)

```typescript
model ExamenCatalogue {
  id        String  @id @default(cuid())
  code      String  @unique          // ex: "NFS", "GLY", "TSH"
  nom       String
  categorie String
  valeurB   Float                    // Coefficient B de l'acte
  tarifMin  Int                      // = round(valeurB × VALEUR_B × 0.9)
  tarifMax  Int                      // = valeurB × VALEUR_B
  typesTube String                   // EDTA | Sec | Fluorure | Citrate | Stérile | Urine 24h | EDTA
  actif     Boolean @default(true)

  panelExamens   PanelExamen[]
  dossierExamens DossierExamen[]
}

model Panel {
  id        String  @id @default(cuid())
  code      String  @unique          // ex: "BIL-DIA", "BIL-STD"
  nom       String                   // ex: "Bilan Diabète Complet"
  categorie String?                  // "Bilan courant" | "Bilan spécialisé" | "Campagne"
  actif     Boolean @default(true)

  panelExamens PanelExamen[]
}

model PanelExamen {
  panelId     String
  catalogueId String
  ordre       Int
  panel       Panel           @relation(fields: [panelId], references: [id])
  catalogue   ExamenCatalogue @relation(fields: [catalogueId], references: [id])

  @@id([panelId, catalogueId])
}
```

### Catalogue complet — 87 examens seedés

> Le fichier `seed.ts` est la source de vérité. Ne pas recréer manuellement.  
> Commande : `npx prisma db seed`

#### Biochimie (32 examens)

| Code | Nom | Coeff B | tarifMax (XOF) | Tube |
|------|-----|--------:|---------------:|------|
| GLY | Glycémie | 10 | 2 000 | Fluorure |
| URE | Urémie | 10 | 2 000 | Sec |
| CRE | Créatininémie | 10 | 2 000 | Sec |
| ACU | Acide Urique | 10 | 2 000 | Sec |
| CRP | Protéine C Réactive | 10 | 2 000 | Sec |
| CHT | Cholestérol Total | 10 | 2 000 | Sec |
| HDL | Cholestérol HDL | 10 | 2 000 | Sec |
| LDL | Cholestérol LDL | 35 | 7 000 | Sec |
| TRG | Triglycérides | 10 | 2 000 | Sec |
| LIP | Bilan Lipidique (CT+HDL+LDL+TG) | 65 | 13 000 | Sec |
| GGT | Gamma GT | 25 | 5 000 | Sec |
| ASA | Transaminases SGOT (ASAT) | 25 | 5 000 | Sec |
| ALA | Transaminases SGPT (ALAT) | 25 | 5 000 | Sec |
| BIT | Bilirubine Totale | 25 | 5 000 | Sec |
| BIC | Bilirubine Conjuguée | 25 | 5 000 | Sec |
| PAL | Phosphatases Alcalines | 25 | 5 000 | Sec |
| ALB | Albuminémie | 15 | 3 000 | Sec |
| PTT | Protéines Totales | 15 | 3 000 | Sec |
| CAL | Calcium Plasmatique | 20 | 4 000 | Sec |
| PHO | Phosphore | 15 | 3 000 | Sec |
| SOD | Sodium (Na+) | 15 | 3 000 | Sec |
| POT | Potassium (K+) | 15 | 3 000 | Sec |
| ION | Ionogramme Sanguin (Na K Cl) | 40 | 8 000 | Sec |
| LDH | Lactate Déshydrogénase | 35 | 7 000 | Sec |
| LPS | Lipase | 20 | 4 000 | Sec |
| AMY | Amylasémie | 40 | 8 000 | Sec |
| FRU | Fructosamine | 60 | 12 000 | Sec |
| MAG | Magnésium Plasmatique | 20 | 4 000 | Sec |
| FER | Fer Sérique | 30 | 6 000 | Sec |
| FRT | Ferritinémie | 100 | 20 000 | Sec |
| MIC | Microalbuminurie | 45 | 9 000 | Urine 24h |
| EPP | Électrophorèse des Protéines | 60 | 12 000 | Sec |

#### Hématologie (8 examens)

| Code | Nom | Coeff B | tarifMax (XOF) | Tube |
|------|-----|--------:|---------------:|------|
| NFS | Numération Formule Sanguine | 30 | 6 000 | EDTA |
| HGB | Taux d'Hémoglobine | 10 | 2 000 | EDTA |
| PLQ | Taux de Plaquettes | 15 | 3 000 | EDTA |
| RET | Taux de Réticulocytes | 10 | 2 000 | EDTA |
| GRP | Groupe Sanguin + Rhésus | 30 | 6 000 | EDTA |
| VB12 | Vitamine B12 | 100 | 20 000 | Sec |
| VB9 | Vitamine B9 (Folates) | 100 | 20 000 | EDTA |
| EHB | Électrophorèse de l'Hémoglobine | 60 | 12 000 | EDTA |

#### Hémostase (5 examens)

| Code | Nom | Coeff B | tarifMax (XOF) | Tube |
|------|-----|--------:|---------------:|------|
| TP | Taux de Prothrombine (TP) + INR | 20 | 4 000 | Citrate |
| TCA | Temps de Céphaline Activée | 20 | 4 000 | Citrate |
| FIB | Fibrinogène | 20 | 4 000 | Citrate |
| DDI | D-Dimères | 100 | 20 000 | Citrate |
| AT3 | Antithrombine III | 40 | 8 000 | Citrate |

#### Hormonologie (16 examens)

| Code | Nom | Coeff B | tarifMax (XOF) | Tube |
|------|-----|--------:|---------------:|------|
| TSH | TSH 3ème Génération | 90 | 18 000 | Sec |
| T3L | T3 Libre | 90 | 18 000 | Sec |
| T4L | T4 Libre | 90 | 18 000 | Sec |
| HBA | Hémoglobine Glyquée (HbA1c) | 70 | 14 000 | EDTA |
| INS | Insuline Plasmatique | 100 | 20 000 | Sec |
| FSH | FSH Plasmatique | 90 | 18 000 | Sec |
| LH | LH Plasmatique | 90 | 18 000 | Sec |
| PRL | Prolactine Plasmatique | 100 | 20 000 | Sec |
| EST | Estradiol Plasmatique | 100 | 20 000 | Sec |
| PRG | Progestérone Plasmatique | 100 | 20 000 | Sec |
| TST | Testostérone Plasmatique | 100 | 20 000 | Sec |
| COR | Cortisol Plasmatique | 100 | 20 000 | Sec |
| PTH | Parathormone (PTH) | 92 | 18 400 | Sec |
| VTD | Vitamine D (25-OH) | 125 | 25 000 | Sec |
| HCG | Beta HCG Plasmatique | 100 | 20 000 | Sec |
| PPC | Peptide C Plasmatique | 125 | 25 000 | Sec |
| GH | Hormone de Croissance (GH) | 150 | 30 000 | Sec |

#### Marqueurs Tumoraux (7 examens)

| Code | Nom | Coeff B | tarifMax (XOF) | Tube |
|------|-----|--------:|---------------:|------|
| PSA | PSA Total 3ème Génération | 100 | 20 000 | Sec |
| PSAL | PSA Libre + Calcul Risque | 100 | 20 000 | Sec |
| ACE | ACE | 100 | 20 000 | Sec |
| AFP | AFP (Alpha-Foetoprotéine) | 70 | 14 000 | Sec |
| CA125 | CA 125 | 100 | 20 000 | Sec |
| CA153 | CA 15.3 | 100 | 20 000 | Sec |
| CA199 | CA 19.9 | 100 | 20 000 | Sec |

#### Bactériologie (6 examens)

| Code | Nom | Coeff B | tarifMax (XOF) | Tube |
|------|-----|--------:|---------------:|------|
| ECB | ECBU | 45 | 9 000 | Stérile |
| PV | Prélèvement Vaginal (PV) | 65 | 13 000 | Stérile |
| SPM | Spermogramme + Spermocytogramme | 60 | 12 000 | Stérile |
| CPR | Coproculture | 65 | 13 000 | Stérile |
| HMC | Hémoculture | 65 | 13 000 | EDTA |
| ABG | Antibiogramme | 65 | 13 000 | Stérile |

#### Parasitologie (3 examens)

| Code | Nom | Coeff B | tarifMax (XOF) | Tube |
|------|-----|--------:|---------------:|------|
| KOP | Examen Parasitologique des Selles | 35 | 7 000 | Stérile |
| GE | Goutte Épaisse / Paludisme | 25 | 5 000 | EDTA |
| TDR | Test Rapide Paludisme (TDR) | 25 | 5 000 | EDTA |

#### Immunologie / Sérologie (12 examens)

| Code | Nom | Coeff B | tarifMax (XOF) | Tube |
|------|-----|--------:|---------------:|------|
| HIV | HIV 1/2 Dépistage | 70 | 14 000 | Sec |
| AGBS | Antigène HBs (Hépatite B) | 70 | 14 000 | Sec |
| ACBC | Ac Anti-HBc Totaux | 70 | 14 000 | Sec |
| ACHC | Ac Anti-VHC (Hépatite C) | 70 | 14 000 | Sec |
| SYP | Sérologie Syphilis (VDRL+TPHA) | 40 | 8 000 | Sec |
| TOX | Toxoplasmose IgG + IgM | 50 | 10 000 | Sec |
| RUB | Rubéole IgG + IgM | 50 | 10 000 | Sec |
| ASL | ASLO (Antistreptolysine O) | 35 | 7 000 | Sec |
| HEL | Helicobacter Pylori IgG | 40 | 8 000 | Sec |
| CD4 | CD4 / CD8 | 45 | 9 000 | EDTA |
| WID | Widal et Félix (Salmonellose) | 40 | 8 000 | Sec |
| CMV | Cytomégalovirus IgG + IgM | 80 | 16 000 | Sec |

---

### Panels seedés — 13 panels initiaux (paramétrables)

Les panels sont **entièrement gérables depuis le back-office** (ajout, modification, désactivation, composition). Les 13 panels ci-dessous sont chargés au seed comme point de départ.

| Code panel | Nom | Catégorie | Examens inclus |
|------------|-----|-----------|----------------|
| BIL-DIA | Bilan Diabète Complet | Bilan courant | GLY · HBA · MIC · CRE |
| BIL-RENAL | Bilan Rénal | Bilan courant | URE · CRE · ACU · ION |
| BIL-HEP | Bilan Hépatique Complet | Bilan courant | ASA · ALA · GGT · BIT · PAL · PTT |
| BIL-LIP | Bilan Lipidique | Bilan courant | CHT · HDL · LDL · TRG |
| BIL-THY | Bilan Thyroïdien | Bilan courant | TSH · T3L · T4L |
| BIL-CARDIO | Bilan Cardiovasculaire | Bilan spécialisé | NFS · CHT · HDL · LDL · TRG · GLY · CRP · ION |
| BIL-PRE | Bilan Prénuptial | Bilan spécialisé | NFS · GRP · HIV · SYP · AGBS · HBA |
| BIL-PRE-GRO | Bilan Prénatal | Bilan spécialisé | NFS · GRP · TOX · RUB · HIV · AGBS · GLY |
| BIL-STD | Bilan Standard Annuel | Bilan courant | NFS · GLY · CHT · HDL · LDL · TRG · URE · CRE · ASA · ALA |
| BIL-HORM-F | Bilan Hormonal Féminin | Bilan spécialisé | FSH · LH · EST · PRG · PRL · TSH |
| BIL-PSA | Bilan Prostate | Bilan spécialisé | PSA · PSAL |
| BIL-INF | Bilan Infectieux | Bilan courant | NFS · CRP · ASL · WID |
| BIL-CAMP | Bilan Campagne Standard | Campagne | NFS · GLY · HIV · SYP · AGBS · GRP |




## 8. DESIGN SYSTEM

### Palette couleurs (constante C dans le prototype)

```javascript
const C = {
  primary:      "#0A6E5C",   // Vert foncé — couleur principale
  primaryLight: "#12937A",
  primaryDark:  "#064D40",   // Sidebar
  accent:       "#F4A726",   // Or/Jaune — CTA, badges actifs
  accentLight:  "#FFC94D",
  bg:           "#F5F7F6",   // Fond général
  text:         "#1A2B26",   // Texte principal
  textLight:    "#5C7A74",   // Texte secondaire
  border:       "#D4E5E1",   // Bordures
  danger:       "#E05C5C",   // Rouge erreur
  success:      "#2CB67D",   // Vert succès
  info:         "#3B82F6",   // Bleu info
  purple:       "#7C3AED",
  orange:       "#F97316",
};
```

### Typographies (Google Fonts)
- **Plus Jakarta Sans** — Corps, UI
- **Lora** — Logo, headings serif
- **DM Sans** — Titres sections
- **Syne** — Accents typographiques

### Composants clés (classes CSS existantes)
- `.btn`, `.btn-primary`, `.btn-outline`, `.btn-accent`, `.btn-danger`, `.btn-success`
- `.badge`, `.b-success`, `.b-warning`, `.b-danger`, `.b-neutral`, `.b-orange`, `.b-teal`
- `.stat-card`, `.stats-grid`
- `.modal-overlay`, `.modal`, `.modal-lg`, `.modal-header`, `.modal-body`, `.modal-footer`
- `.section`, `.section-header`, `.section-title`
- `.table`, `.table th`, `.table td`
- `.upload-zone`, `.ocr-scanning`, `.ocr-result-box`, `.exam-chip`
- `.payment-methods`, `.pm-option`
- `.steps-bar`, `.step-item`, `.step-dot`, `.step-label`
- `.form-grid`, `.form-group`, `.form-input`, `.form-select`, `.form-label`
- `.summary-box`, `.summary-row`

---

## 9. PLANNING DE DÉVELOPPEMENT (8 semaines)

| Semaine | Phase | Livrables |
|---------|-------|-----------|
| S1 | Infra | Schéma BDD Prisma, API Auth, Login back-office |
| S2 | Core API | API patients, dossiers, agents, missions |
| S3 | Services | OCR Google Vision, upload S3, SMS Twilio |
| S4 | Module Patients | Flux OCR animé complet |
| S5 | Assurances | Kanban workflow 5 étapes |
| S6 | Paiements | Calcul auto, module agents + carte |
| S7 | Stock/Rapports | Recharts, sécurité, rôles |
| S8 | Production | Tests, seed, déploiement |

---

## 10. CONTEXTE GÉOGRAPHIQUE ET COMMERCIAL

- **Zone Phase 1** : Yopougon, Abidjan, Côte d'Ivoire
- **Coordonnées carte** : 5.354°N, 4.005°O
- **Couverture juridique** : Laboratoire Maison Blanche (agrément partenaire)
- **Monnaie** : XOF (Franc CFA)
- **Langue** : Français
- **Mobile Money dominant** : Orange Money, Wave, MTN

### Équipe Phase 1

| Poste | Effectif | Rémunération (XOF/mois) |
|-------|----------|--------------------------|
| Coordinateur Opérations | 1 | 300 000 – 450 000 |
| Agents de prélèvement | 3–5 | 150 000 + prime/acte |
| Responsable Admin/Finance | 1 | 250 000 – 350 000 |
| Développeur (externe) | 1 | Forfait ou TJM |

---

## 11. FICHIERS DU PROJET

| Fichier | Localisation | Contenu |
|---------|-------------|---------|
| `prelevia-complet.jsx` | `/mnt/project/` | Prototype React v5 complet — 133 Ko — TOUTES interfaces |
| `prelevia_guide_v2.docx` | `/mnt/project/` | Guide métier complet (parties 1–12) |
| `prelevia_guide_backoffice.docx` | `/mnt/project/` | Guide spécifique back-office |
| `CLAUDE.md` (ce fichier) | Référence | Synthèse état d'avancement pour Claude Code |

---

## 12. INSTRUCTIONS POUR CLAUDE CODE

### Règles générales
1. **Le prototype `prelevia-complet.jsx` est la référence UI** — respecter strictement le design system, la palette, les noms de classes CSS
2. **Ne jamais casser les fonctionnalités existantes** — le prototype est entièrement fonctionnel
3. **La logique métier est figée** — calcul part patient, workflow assurance, sources OCR sont validés et corrects
4. **Monnaie toujours en XOF** — format `(montant).toLocaleString() + " XOF"`
5. **Langue : français** dans toute l'UI et la documentation
6. **Contexte local** : Yopougon/Abidjan, assureurs ivoiriens, mobile money africain

### Priorités de développement backend
1. Schéma Prisma (patients, examens + coefficient_b, valeur_b, panels, panel_examens, agents, missions, paiements, assurances, stock)
2. Auth Admin (JWT, login, rôles : admin / coordinateur / agent)
3. Routes patients + OCR (intégration Google Vision)
4. Routes assurances (workflow états)
5. Routes paiements (enregistrement + calcul auto)
6. Socket.io (suivi temps réel agent)
7. Routes back-office Paramètres (CRUD panels, CRUD catalogue examens, mise à jour valeur B)

### Ce qu'il ne faut PAS changer
- La palette de couleurs C (primary #0A6E5C, accent #F4A726)
- La formule de calcul part patient (80/20 sur couverts, 100% sur non-couverts)
- Les 5 états du workflow assurance
- Les 3 sources OCR (auto/patient/agent)
- La structure de navigation (sidebar web + bottom tabs mobile)

---

*Prelevia SARL — Yopougon, Abidjan, Côte d'Ivoire*  
*Synthèse réalisée le 24 mars 2026 — Document de référence Claude Code*

---

## 13. SEED — INSTRUCTIONS

### Fichier seed.ts — Récapitulatif complet

Le fichier `seed.ts` (à placer dans `server/prisma/seed.ts`) est **complet et prêt à l'emploi**. Il charge en une seule commande l'intégralité des données de démarrage.

### Commande
```bash
npx prisma db seed
# package.json doit contenir :
# "prisma": { "seed": "ts-node prisma/seed.ts" }
```

### Ce que le seed crée

| Étape | Contenu | Détail |
|-------|---------|--------|
| 1 | Compte admin | `admin@prelevia.ci` / `Admin2026!` — rôle `SUPER_ADMIN` |
| 2 | Agent initial | Placeholder à remplacer — commune Yopougon, commission 15% |
| 3 | 5 assureurs | MUGEFCI · CNPS · NSIA Santé · Sanlam CI · Allianz CI |
| 4 | 1 laboratoire | Labo Maison Blanche — `valeurB = 200 XOF` — `principal = true` |
| 5 | 7 paramètres système | Voir tableau ci-dessous |
| 6 | 6 templates SMS | RDV confirmé · Reçu paiement · Résultats · Agent en route · Rappel · Campagne |
| 7 | 8 zones géographiques | Yopougon (1 000 XOF) · Cocody (2 000) · Abobo (2 000) · Attécoubé (1 500) · Plateau (2 500) · + 3 inactives |
| 8 | 87 examens | Catalogue complet avec coefficients B et tubes (détail section 7) |
| 9 | 13 panels | Prédéfinis, paramétrables back-office (détail section 7) |
| 10 | 3 organisations | Police Nationale · MTN CI · Orange CI |
| 11 | Stock initial agent | 8 articles (tubes EDTA/Sec/Fluorure/Citrate, aiguilles, gants…) |

### Paramètres système seedés

| Clé | Valeur | Type | Usage |
|-----|--------|------|-------|
| `VALEUR_B` | `200` | NOMBRE | Valeur XOF du point B — modifiable back-office |
| `FRAIS_DEPLACEMENT_DEFAULT` | `1500` | NOMBRE | Frais déplacement défaut (XOF) |
| `DELAI_RESULTATS_HEURES` | `24` | NOMBRE | Délai standard résultats |
| `NOM_SERVICE` | `Prelevia` | TEXTE | Nom dans les SMS |
| `TEL_SUPPORT` | `+225 07 00 00 00` | TEXTE | Numéro support patients |
| `COMMISSION_AGENT_DEFAULT` | `0.15` | NOMBRE | Commission agent (15%) |
| `OCR_ACTIF` | `true` | BOOLEEN | Activer/désactiver OCR |

### ⚠️ Points d'attention

- Le seed utilise `upsert` partout — **idempotent**, peut être rejoué sans risque de doublons
- Changer `VALEUR_B` dans les paramètres système ne recalcule **pas automatiquement** les tarifs en base — prévoir une route admin `POST /admin/recalculer-tarifs`
- Le compte admin seed a un mot de passe en clair dans le code (`Admin2026!`) — **à changer immédiatement en production**
- Les 3 organisations (Police, MTN, Orange) sont des exemples pour le module Campagnes — à adapter
