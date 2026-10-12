-- CreateEnum
CREATE TYPE "LeadMarket" AS ENUM ('US', 'DUBAI');

-- CreateEnum
CREATE TYPE "LeadLocationStatus" AS ENUM ('VERIFIED', 'UNVERIFIED');

-- CreateEnum
CREATE TYPE "LeadContactStatus" AS ENUM ('UNVERIFIED', 'PUBLIC_LISTING', 'VERIFIED');

-- CreateEnum
CREATE TYPE "LeadPriorityBand" AS ENUM ('A', 'B', 'C', 'DISQUALIFIED');

-- CreateEnum
CREATE TYPE "OutreachDraftStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SENT');

-- CreateTable
CREATE TABLE "LeadCompany" (
    "id" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "headquartersLocation" TEXT NOT NULL,
    "operatingLocations" JSONB NOT NULL,
    "locationEvidence" TEXT NOT NULL,
    "locationSourceUrl" TEXT NOT NULL,
    "locationStatus" "LeadLocationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "shipsTo" TEXT[],
    "suppressed" BOOLEAN NOT NULL DEFAULT false,
    "suppressionReason" TEXT,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadCompanyMarket" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "market" "LeadMarket" NOT NULL,
    "eligible" BOOLEAN NOT NULL,
    "qualified" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT NOT NULL,
    "sellingMarketLocation" TEXT NOT NULL,
    "targetMarketplace" TEXT NOT NULL,
    "marketplaceEvidence" TEXT NOT NULL,
    "opportunity" TEXT NOT NULL,
    "leadScore" INTEGER NOT NULL DEFAULT 0,
    "priority" "LeadPriorityBand" NOT NULL DEFAULT 'DISQUALIFIED',
    "recommendedServiceSlug" TEXT NOT NULL,
    "recommendedServiceName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadCompanyMarket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadContact" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "profileUrl" TEXT,
    "email" TEXT,
    "verificationStatus" "LeadContactStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "relevant" BOOLEAN NOT NULL DEFAULT false,
    "optedOut" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadSource" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachDraft" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contactId" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "OutreachDraftStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadSuppression" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadSuppression_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeadCompany_dedupeKey_key" ON "LeadCompany"("dedupeKey");

-- CreateIndex
CREATE INDEX "LeadCompany_locationStatus_idx" ON "LeadCompany"("locationStatus");

-- CreateIndex
CREATE INDEX "LeadCompany_suppressed_idx" ON "LeadCompany"("suppressed");

-- CreateIndex
CREATE INDEX "LeadCompanyMarket_market_priority_idx" ON "LeadCompanyMarket"("market", "priority");

-- CreateIndex
CREATE INDEX "LeadCompanyMarket_market_qualified_idx" ON "LeadCompanyMarket"("market", "qualified");

-- CreateIndex
CREATE UNIQUE INDEX "LeadCompanyMarket_companyId_market_key" ON "LeadCompanyMarket"("companyId", "market");

-- CreateIndex
CREATE INDEX "LeadContact_companyId_idx" ON "LeadContact"("companyId");

-- CreateIndex
CREATE INDEX "LeadContact_email_idx" ON "LeadContact"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LeadSuppression_kind_value_key" ON "LeadSuppression"("kind", "value");

-- AddForeignKey
ALTER TABLE "LeadCompanyMarket" ADD CONSTRAINT "LeadCompanyMarket_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "LeadCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadContact" ADD CONSTRAINT "LeadContact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "LeadCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadSource" ADD CONSTRAINT "LeadSource_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "LeadCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachDraft" ADD CONSTRAINT "OutreachDraft_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "LeadCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachDraft" ADD CONSTRAINT "OutreachDraft_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "LeadContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
