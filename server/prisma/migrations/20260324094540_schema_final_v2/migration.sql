-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('ENTREPRISE', 'INSTITUTION_PUBLIQUE', 'ECOLE', 'MUTUELLE', 'ONG', 'AUTRE');

-- CreateEnum
CREATE TYPE "CampagneStatut" AS ENUM ('PLANIFIEE', 'EN_COURS', 'SUSPENDUE', 'TERMINEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "Interpretation" AS ENUM ('NORMAL', 'ELEVE', 'BAS', 'CRITIQUE', 'POSITIF', 'NEGATIF', 'EN_ATTENTE');

-- CreateEnum
CREATE TYPE "ParamType" AS ENUM ('TEXTE', 'NOMBRE', 'BOOLEEN', 'JSON');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DossierStatut" ADD VALUE 'RESULTATS_EN_COURS';
ALTER TYPE "DossierStatut" ADD VALUE 'RESULTATS_DISPONIBLES';

-- AlterTable
ALTER TABLE "Dossier" ADD COLUMN     "campagneId" TEXT,
ADD COLUMN     "laboratoireId" TEXT;

-- AlterTable
ALTER TABLE "ExamenCatalogue" ADD COLUMN     "actif" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Parametre" ADD COLUMN     "modifiable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "type" "ParamType" NOT NULL DEFAULT 'TEXTE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "actif" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "TemplateSMS" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "sujet" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateSMS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ville" TEXT NOT NULL DEFAULT 'Abidjan',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "fraisDeplacement" INTEGER NOT NULL DEFAULT 1500,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Laboratoire" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "adresse" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "valeurB" INTEGER NOT NULL DEFAULT 200,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Laboratoire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TarifSpecial" (
    "id" TEXT NOT NULL,
    "catalogueId" TEXT NOT NULL,
    "contexte" TEXT NOT NULL,
    "tarif" INTEGER NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TarifSpecial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Panel" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "categorie" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Panel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PanelExamen" (
    "id" TEXT NOT NULL,
    "panelId" TEXT NOT NULL,
    "catalogueId" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PanelExamen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultatExamen" (
    "id" TEXT NOT NULL,
    "examenId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "valeur" TEXT NOT NULL,
    "unite" TEXT,
    "normaleMin" TEXT,
    "normaleMax" TEXT,
    "interpretation" "Interpretation" NOT NULL DEFAULT 'EN_ATTENTE',
    "commentaire" TEXT,
    "saisiPar" TEXT NOT NULL,
    "saisiLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResultatExamen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentResultat" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSizeKb" INTEGER,
    "laboratoireId" TEXT,
    "uploadePar" TEXT NOT NULL,
    "uploadeA" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiePatient" BOOLEAN NOT NULL DEFAULT false,
    "notifieA" TIMESTAMP(3),
    "accessiblePatient" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentResultat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "OrgType" NOT NULL,
    "telephone" TEXT,
    "email" TEXT,
    "adresse" TEXT,
    "commune" TEXT,
    "contactNom" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campagne" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "laboratoireId" TEXT,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "nbPersonnesCible" INTEGER NOT NULL,
    "nbPersonnesFait" INTEGER NOT NULL DEFAULT 0,
    "tarifNegocieB" INTEGER,
    "remisePct" INTEGER NOT NULL DEFAULT 0,
    "statut" "CampagneStatut" NOT NULL DEFAULT 'PLANIFIEE',
    "noteAdmin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campagne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampagnePanel" (
    "id" TEXT NOT NULL,
    "campagneId" TEXT NOT NULL,
    "panelId" TEXT NOT NULL,

    CONSTRAINT "CampagnePanel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampagneAgent" (
    "id" TEXT NOT NULL,
    "campagneId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PRELEVEUR',

    CONSTRAINT "CampagneAgent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TemplateSMS_code_key" ON "TemplateSMS"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Zone_nom_key" ON "Zone"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Laboratoire_nom_key" ON "Laboratoire"("nom");

-- CreateIndex
CREATE INDEX "TarifSpecial_catalogueId_idx" ON "TarifSpecial"("catalogueId");

-- CreateIndex
CREATE INDEX "TarifSpecial_contexte_idx" ON "TarifSpecial"("contexte");

-- CreateIndex
CREATE UNIQUE INDEX "Panel_code_key" ON "Panel"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Panel_nom_key" ON "Panel"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "PanelExamen_panelId_catalogueId_key" ON "PanelExamen"("panelId", "catalogueId");

-- CreateIndex
CREATE UNIQUE INDEX "ResultatExamen_examenId_key" ON "ResultatExamen"("examenId");

-- CreateIndex
CREATE INDEX "ResultatExamen_patientId_idx" ON "ResultatExamen"("patientId");

-- CreateIndex
CREATE INDEX "DocumentResultat_dossierId_idx" ON "DocumentResultat"("dossierId");

-- CreateIndex
CREATE UNIQUE INDEX "Organisation_nom_key" ON "Organisation"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Campagne_ref_key" ON "Campagne"("ref");

-- CreateIndex
CREATE INDEX "Campagne_organisationId_idx" ON "Campagne"("organisationId");

-- CreateIndex
CREATE INDEX "Campagne_statut_idx" ON "Campagne"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "CampagnePanel_campagneId_panelId_key" ON "CampagnePanel"("campagneId", "panelId");

-- CreateIndex
CREATE UNIQUE INDEX "CampagneAgent_campagneId_agentId_key" ON "CampagneAgent"("campagneId", "agentId");

-- CreateIndex
CREATE INDEX "Dossier_campagneId_idx" ON "Dossier"("campagneId");

-- AddForeignKey
ALTER TABLE "TarifSpecial" ADD CONSTRAINT "TarifSpecial_catalogueId_fkey" FOREIGN KEY ("catalogueId") REFERENCES "ExamenCatalogue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PanelExamen" ADD CONSTRAINT "PanelExamen_panelId_fkey" FOREIGN KEY ("panelId") REFERENCES "Panel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PanelExamen" ADD CONSTRAINT "PanelExamen_catalogueId_fkey" FOREIGN KEY ("catalogueId") REFERENCES "ExamenCatalogue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dossier" ADD CONSTRAINT "Dossier_laboratoireId_fkey" FOREIGN KEY ("laboratoireId") REFERENCES "Laboratoire"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dossier" ADD CONSTRAINT "Dossier_campagneId_fkey" FOREIGN KEY ("campagneId") REFERENCES "Campagne"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultatExamen" ADD CONSTRAINT "ResultatExamen_examenId_fkey" FOREIGN KEY ("examenId") REFERENCES "Examen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultatExamen" ADD CONSTRAINT "ResultatExamen_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentResultat" ADD CONSTRAINT "DocumentResultat_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentResultat" ADD CONSTRAINT "DocumentResultat_laboratoireId_fkey" FOREIGN KEY ("laboratoireId") REFERENCES "Laboratoire"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campagne" ADD CONSTRAINT "Campagne_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campagne" ADD CONSTRAINT "Campagne_laboratoireId_fkey" FOREIGN KEY ("laboratoireId") REFERENCES "Laboratoire"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampagnePanel" ADD CONSTRAINT "CampagnePanel_campagneId_fkey" FOREIGN KEY ("campagneId") REFERENCES "Campagne"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampagnePanel" ADD CONSTRAINT "CampagnePanel_panelId_fkey" FOREIGN KEY ("panelId") REFERENCES "Panel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampagneAgent" ADD CONSTRAINT "CampagneAgent_campagneId_fkey" FOREIGN KEY ("campagneId") REFERENCES "Campagne"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampagneAgent" ADD CONSTRAINT "CampagneAgent_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
