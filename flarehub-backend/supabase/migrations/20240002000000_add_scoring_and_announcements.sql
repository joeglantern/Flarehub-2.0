-- New tables: application_scores + announcements

CREATE TYPE "AnnouncementTarget" AS ENUM ('all', 'entrepreneur', 'mentor');

CREATE TABLE "application_scores" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "adminId" TEXT NOT NULL,
    "innovation" INTEGER NOT NULL,
    "feasibility" INTEGER NOT NULL,
    "impact" INTEGER NOT NULL,
    "teamStrength" INTEGER NOT NULL,
    "marketPotential" INTEGER NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "application_scores_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "announcements" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "targetRole" "AnnouncementTarget" NOT NULL DEFAULT 'all',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "application_scores_applicationId_key" ON "application_scores"("applicationId");
CREATE INDEX "announcements_isActive_idx" ON "announcements"("isActive");
CREATE INDEX "announcements_targetRole_idx" ON "announcements"("targetRole");

ALTER TABLE "application_scores" ADD CONSTRAINT "application_scores_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "application_scores" ADD CONSTRAINT "application_scores_adminId_fkey"
  FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "announcements" ADD CONSTRAINT "announcements_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
