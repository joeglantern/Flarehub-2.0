-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('entrepreneur', 'mentor', 'admin', 'super_admin');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('Male', 'Female', 'Other', 'Unknown');

-- CreateEnum
CREATE TYPE "BusinessStage" AS ENUM ('Idea', 'Prototype', 'MVP', 'Revenue');

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('Active', 'Inactive');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('Pending', 'UnderReview', 'Approved', 'Rejected');

-- CreateEnum
CREATE TYPE "EvidenceStatus" AS ENUM ('pending', 'verified', 'rejected');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('Pending', 'Reviewed', 'NeedsRevision', 'Approved');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('milestone', 'survey', 'smart_goals', 'market_research', 'customer_feedback');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('milestone', 'survey', 'smart_goals', 'market_research', 'customer_feedback');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('Draft', 'Submitted', 'UnderReview', 'Approved', 'NeedsRevision');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('Scheduled', 'Completed', 'Cancelled');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('Virtual', 'InPerson');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('application_approved', 'application_rejected', 'application_under_review', 'mentor_assigned', 'mentor_unassigned', 'meeting_scheduled', 'meeting_cancelled', 'evidence_verified', 'evidence_rejected', 'smart_goal_commented', 'market_research_commented', 'milestone_plan_commented', 'submission_reviewed', 'new_program', 'new_message');

-- CreateEnum
CREATE TYPE "AdminTargetType" AS ENUM ('user', 'application', 'program', 'evidence', 'submission', 'template', 'system');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" "Gender" NOT NULL DEFAULT 'Unknown',
    "phone" TEXT,
    "county" TEXT,
    "profilePic" TEXT,
    "businessName" TEXT,
    "businessStage" "BusinessStage",
    "businessDescription" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'entrepreneur',
    "isMentor" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "profileComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "applicationDeadline" TIMESTAMP(3),
    "status" "ProgramStatus" NOT NULL DEFAULT 'Active',
    "maxParticipants" INTEGER,
    "grantAmount" DECIMAL(12,2),
    "eligibilityRequirements" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" INTEGER NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'Pending',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "smart_goals" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "goalStatement" TEXT NOT NULL,
    "specific" TEXT NOT NULL,
    "measurable" TEXT NOT NULL,
    "achievable" TEXT NOT NULL,
    "relevant" TEXT NOT NULL,
    "timebound" TEXT NOT NULL,
    "adminComment" TEXT,
    "commentedAt" TIMESTAMP(3),
    "commentedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "smart_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestone_plans" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "grantAmount" TEXT,
    "implementationPeriod" TEXT,
    "stage" TEXT,
    "milestones" JSONB NOT NULL,
    "adminComment" TEXT,
    "commentedAt" TIMESTAMP(3),
    "commentedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milestone_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_research" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "surveyDate" TIMESTAMP(3),
    "sampleSize" TEXT,
    "surveyDuration" TEXT,
    "surveyObjective" TEXT,
    "ageDistribution" TEXT,
    "genderBreakdown" TEXT,
    "location" TEXT,
    "otherCharacteristics" TEXT,
    "topChallenges" JSONB,
    "awareness" TEXT,
    "interest" TEXT,
    "avgWillingness" TEXT,
    "priceRange" TEXT,
    "currentSolutions" TEXT,
    "openComments" TEXT,
    "opportunity1" TEXT,
    "opportunity2" TEXT,
    "riskBarrier" TEXT,
    "nextSteps" JSONB,
    "adminComment" TEXT,
    "commentedAt" TIMESTAMP(3),
    "commentedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_research_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'Pending',
    "documentCategory" "DocumentCategory" NOT NULL DEFAULT 'milestone',
    "description" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'medium',
    "tags" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "expiresAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" INTEGER,
    "milestoneNumber" INTEGER,
    "fileName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "status" "EvidenceStatus" NOT NULL DEFAULT 'pending',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_templates" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "templateType" "TemplateType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_submissions" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "submissionName" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'Draft',
    "notes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_plans" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "planData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_mentees" (
    "id" SERIAL NOT NULL,
    "mentorId" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentor_mentees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_meetings" (
    "id" SERIAL NOT NULL,
    "mentorId" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "meetingTime" TIMESTAMP(3) NOT NULL,
    "status" "MeetingStatus" NOT NULL DEFAULT 'Scheduled',
    "meetingType" "MeetingType" NOT NULL DEFAULT 'Virtual',
    "link" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentor_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_notes" (
    "id" SERIAL NOT NULL,
    "mentorId" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentor_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_logs" (
    "id" SERIAL NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" "AdminTargetType",
    "targetId" TEXT,
    "description" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_settings" (
    "id" SERIAL NOT NULL,
    "settingKey" TEXT NOT NULL,
    "settingValue" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "applications_userId_idx" ON "applications"("userId");

-- CreateIndex
CREATE INDEX "applications_programId_idx" ON "applications"("programId");

-- CreateIndex
CREATE INDEX "applications_status_idx" ON "applications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "applications_userId_programId_key" ON "applications"("userId", "programId");

-- CreateIndex
CREATE UNIQUE INDEX "smart_goals_userId_key" ON "smart_goals"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "milestone_plans_userId_key" ON "milestone_plans"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "market_research_userId_key" ON "market_research"("userId");

-- CreateIndex
CREATE INDEX "documents_userId_idx" ON "documents"("userId");

-- CreateIndex
CREATE INDEX "documents_status_idx" ON "documents"("status");

-- CreateIndex
CREATE INDEX "documents_documentCategory_idx" ON "documents"("documentCategory");

-- CreateIndex
CREATE INDEX "evidence_userId_idx" ON "evidence"("userId");

-- CreateIndex
CREATE INDEX "evidence_programId_idx" ON "evidence"("programId");

-- CreateIndex
CREATE INDEX "evidence_status_idx" ON "evidence"("status");

-- CreateIndex
CREATE INDEX "evidence_milestoneNumber_idx" ON "evidence"("milestoneNumber");

-- CreateIndex
CREATE INDEX "admin_templates_templateType_idx" ON "admin_templates"("templateType");

-- CreateIndex
CREATE INDEX "admin_templates_isActive_idx" ON "admin_templates"("isActive");

-- CreateIndex
CREATE INDEX "user_submissions_userId_idx" ON "user_submissions"("userId");

-- CreateIndex
CREATE INDEX "user_submissions_templateId_idx" ON "user_submissions"("templateId");

-- CreateIndex
CREATE INDEX "user_submissions_status_idx" ON "user_submissions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "business_plans_userId_key" ON "business_plans"("userId");

-- CreateIndex
CREATE INDEX "mentor_mentees_mentorId_idx" ON "mentor_mentees"("mentorId");

-- CreateIndex
CREATE INDEX "mentor_mentees_menteeId_idx" ON "mentor_mentees"("menteeId");

-- CreateIndex
CREATE UNIQUE INDEX "mentor_mentees_mentorId_menteeId_key" ON "mentor_mentees"("mentorId", "menteeId");

-- CreateIndex
CREATE INDEX "mentor_meetings_mentorId_idx" ON "mentor_meetings"("mentorId");

-- CreateIndex
CREATE INDEX "mentor_meetings_menteeId_idx" ON "mentor_meetings"("menteeId");

-- CreateIndex
CREATE INDEX "mentor_meetings_meetingTime_idx" ON "mentor_meetings"("meetingTime");

-- CreateIndex
CREATE INDEX "mentor_notes_mentorId_idx" ON "mentor_notes"("mentorId");

-- CreateIndex
CREATE INDEX "mentor_notes_menteeId_idx" ON "mentor_notes"("menteeId");

-- CreateIndex
CREATE INDEX "messages_senderId_idx" ON "messages"("senderId");

-- CreateIndex
CREATE INDEX "messages_receiverId_idx" ON "messages"("receiverId");

-- CreateIndex
CREATE INDEX "messages_createdAt_idx" ON "messages"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "admin_logs_adminId_idx" ON "admin_logs"("adminId");

-- CreateIndex
CREATE INDEX "admin_logs_createdAt_idx" ON "admin_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "admin_settings_settingKey_key" ON "admin_settings"("settingKey");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "smart_goals" ADD CONSTRAINT "smart_goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_plans" ADD CONSTRAINT "milestone_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_research" ADD CONSTRAINT "market_research_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_templates" ADD CONSTRAINT "admin_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_submissions" ADD CONSTRAINT "user_submissions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "admin_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_submissions" ADD CONSTRAINT "user_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_plans" ADD CONSTRAINT "business_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_mentees" ADD CONSTRAINT "mentor_mentees_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_mentees" ADD CONSTRAINT "mentor_mentees_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_meetings" ADD CONSTRAINT "mentor_meetings_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_meetings" ADD CONSTRAINT "mentor_meetings_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_notes" ADD CONSTRAINT "mentor_notes_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

