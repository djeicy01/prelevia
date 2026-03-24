-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'COORDINATEUR');

-- CreateEnum
CREATE TYPE "AgentStatut" AS ENUM ('ACTIF', 'INACTIF', 'SUSPENDU', 'EN_FORMATION');

-- CreateEnum
CREATE TYPE "DossierStatut" AS ENUM ('EN_ATTENTE', 'PRET_PRELEVEMENT', 'PRELEVEMENT_FAIT', 'PAYE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "OcrSource" AS ENUM ('AUTO', 'PATIENT', 'AGENT', 'MANUAL');

-- CreateEnum
CREATE TYPE "AssuranceStatut" AS ENUM ('DOCS_COLLECTES', 'SOUMIS_LABO', 'EN_VALIDATION', 'VALIDE_TOTAL', 'VALIDE_PARTIEL', 'REFUSE');

-- CreateEnum
CREATE TYPE "MissionStatut" AS ENUM ('PLANIFIEE', 'EN_ROUTE', 'ARRIVEE', 'PRELEVEMENT_FAIT', 'TERMINEE');

-- CreateEnum
CREATE TYPE "ModePaiement" AS ENUM ('CASH', 'ORANGE_MONEY', 'MTN_MONEY', 'WAVE', 'VIREMENT');

-- CreateEnum
CREATE TYPE "PaiementStatut" AS ENUM ('EN_ATTENTE', 'CONFIRME', 'ECHEC');

-- CreateEnum
CREATE TYPE "TypeRevenu" AS ENUM ('FIXE_MENSUEL', 'PRIME_PRELEVEMENT', 'COMMISSION_ENCAISSEMENT', 'PRIME_QUALITE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assurance" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tauxCouverture" INTEGER NOT NULL,
    "delaiValidation" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactTel" TEXT,

    CONSTRAINT "Assurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "commune" TEXT NOT NULL,
    "adresse" TEXT,
    "assuranceId" TEXT,
    "numCarte" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dossier" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "statut" "DossierStatut" NOT NULL DEFAULT 'EN_ATTENTE',
    "statutAssurance" "AssuranceStatut",
    "ocrSource" "OcrSource" NOT NULL DEFAULT 'MANUAL',
    "bulletinUrl" TEXT,
    "carteAssuranceUrl" TEXT,
    "cniUrl" TEXT,
    "noteAdmin" TEXT,
    "missionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dossier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamenCatalogue" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "tarifMin" INTEGER NOT NULL,
    "tarifMax" INTEGER NOT NULL,
    "typesTube" TEXT,

    CONSTRAINT "ExamenCatalogue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Examen" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "catalogueId" TEXT NOT NULL,
    "tarif" INTEGER NOT NULL,
    "couvert" BOOLEAN,
    "quotePart" INTEGER,

    CONSTRAINT "Examen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "statut" "MissionStatut" NOT NULL DEFAULT 'PLANIFIEE',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT,
    "commune" TEXT NOT NULL,
    "statut" "AgentStatut" NOT NULL DEFAULT 'ACTIF',
    "tauxCommission" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paiement" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "montant" INTEGER NOT NULL,
    "mode" "ModePaiement" NOT NULL,
    "statut" "PaiementStatut" NOT NULL DEFAULT 'EN_ATTENTE',
    "reference" TEXT,
    "encaisseA" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAgent" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "materiau" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "seuilAlerte" INTEGER NOT NULL DEFAULT 10,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Revenu" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "missionId" TEXT,
    "montant" INTEGER NOT NULL,
    "type" "TypeRevenu" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Revenu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Assurance_nom_key" ON "Assurance"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_ref_key" ON "Patient"("ref");

-- CreateIndex
CREATE INDEX "Patient_telephone_idx" ON "Patient"("telephone");

-- CreateIndex
CREATE INDEX "Patient_commune_idx" ON "Patient"("commune");

-- CreateIndex
CREATE UNIQUE INDEX "Dossier_ref_key" ON "Dossier"("ref");

-- CreateIndex
CREATE INDEX "Dossier_patientId_idx" ON "Dossier"("patientId");

-- CreateIndex
CREATE INDEX "Dossier_statut_idx" ON "Dossier"("statut");

-- CreateIndex
CREATE INDEX "Dossier_statutAssurance_idx" ON "Dossier"("statutAssurance");

-- CreateIndex
CREATE UNIQUE INDEX "ExamenCatalogue_code_key" ON "ExamenCatalogue"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ExamenCatalogue_nom_key" ON "ExamenCatalogue"("nom");

-- CreateIndex
CREATE INDEX "Examen_dossierId_idx" ON "Examen"("dossierId");

-- CreateIndex
CREATE UNIQUE INDEX "Mission_ref_key" ON "Mission"("ref");

-- CreateIndex
CREATE INDEX "Mission_agentId_idx" ON "Mission"("agentId");

-- CreateIndex
CREATE INDEX "Mission_date_idx" ON "Mission"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_telephone_key" ON "Agent"("telephone");

-- CreateIndex
CREATE INDEX "Paiement_dossierId_idx" ON "Paiement"("dossierId");

-- CreateIndex
CREATE INDEX "Paiement_encaisseA_idx" ON "Paiement"("encaisseA");

-- CreateIndex
CREATE UNIQUE INDEX "StockAgent_agentId_materiau_key" ON "StockAgent"("agentId", "materiau");

-- CreateIndex
CREATE INDEX "Revenu_agentId_idx" ON "Revenu"("agentId");

-- CreateIndex
CREATE INDEX "Revenu_date_idx" ON "Revenu"("date");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_assuranceId_fkey" FOREIGN KEY ("assuranceId") REFERENCES "Assurance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dossier" ADD CONSTRAINT "Dossier_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dossier" ADD CONSTRAINT "Dossier_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Examen" ADD CONSTRAINT "Examen_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Examen" ADD CONSTRAINT "Examen_catalogueId_fkey" FOREIGN KEY ("catalogueId") REFERENCES "ExamenCatalogue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAgent" ADD CONSTRAINT "StockAgent_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revenu" ADD CONSTRAINT "Revenu_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revenu" ADD CONSTRAINT "Revenu_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
