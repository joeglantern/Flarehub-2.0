# Flarehub Backend Design Specification

> **Version:** 1.1.0  
> **Status:** Authoritative — this document is the single source of truth for the Flarehub backend rewrite.  
> **Stack:** Fastify · TypeScript · Prisma · Supabase (PostgreSQL + Auth + Storage) · WebSockets

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Versions](#2-tech-stack--versions)
3. [Project Structure](#3-project-structure)
4. [Environment Variables](#4-environment-variables)
5. [Database Schema](#5-database-schema)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [API Design Conventions](#7-api-design-conventions)
8. [REST API Reference](#8-rest-api-reference)
   - [Auth](#81-auth)
   - [Users](#82-users)
   - [Programs](#83-programs)
   - [Applications](#84-applications)
   - [Submissions — Smart Goals](#85-submissions--smart-goals)
   - [Submissions — Milestone Plans](#86-submissions--milestone-plans)
   - [Submissions — Market Research](#87-submissions--market-research)
   - [Documents (File Uploads)](#88-documents-file-uploads)
   - [Evidence](#89-evidence)
   - [Admin Templates](#810-admin-templates)
   - [User Submissions (Template File Uploads)](#811-user-submissions-template-file-uploads)
   - [Business Plans](#812-business-plans)
   - [Mentor](#813-mentor)
   - [Messages](#814-messages)
   - [Notifications](#815-notifications)
   - [Admin — Users](#816-admin--users)
   - [Admin — Applications](#817-admin--applications)
   - [Admin — Programs](#818-admin--programs)
   - [Admin — Evidence Review](#819-admin--evidence-review)
   - [Admin — Submissions Review](#820-admin--submissions-review)
   - [Admin — Mentor Management](#821-admin--mentor-management)
   - [Admin — Analytics](#822-admin--analytics)
   - [Admin — Settings](#823-admin--settings)
   - [Admin — Activity Log](#824-admin--activity-log)
   - [Health](#825-health)
9. [WebSocket Design](#9-websocket-design)
10. [File Upload Architecture](#10-file-upload-architecture)
11. [Notification System](#11-notification-system)
12. [Data Migration Plan](#12-data-migration-plan)
13. [Security](#13-security)
14. [Error Handling](#14-error-handling)
15. [Logging](#15-logging)
16. [Development Setup](#16-development-setup)

---

## 1. Project Overview

Flarehub is a youth entrepreneurship program management platform focused on Kenya. It supports three user roles:

| Role | Description |
|---|---|
| `entrepreneur` | Registers, applies to programs, submits deliverables, uploads evidence |
| `mentor` | Assigned to entrepreneurs, tracks their progress, schedules meetings, logs notes |
| `admin` / `super_admin` | Manages users, programs, applications, reviews evidence and submissions |

This backend exposes a versioned REST API (`/api/v1/`) and a WebSocket endpoint (`/ws`) to serve a Vite + React frontend. All data lives in Supabase (PostgreSQL). Auth is delegated entirely to Supabase Auth. Files are stored in Supabase Storage.

---

## 2. Tech Stack & Versions

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 20 LTS | Runtime |
| TypeScript | 5.x | Type safety across the entire codebase |
| Fastify | 4.x | HTTP server, routing, plugin system |
| @fastify/websocket | 8.x | WebSocket support (wraps `ws`) |
| @fastify/cors | 8.x | Cross-origin resource sharing |
| @fastify/helmet | 11.x | Security headers |
| @fastify/rate-limit | 9.x | Rate limiting |
| @fastify/multipart | 8.x | Multipart form parsing (for metadata only — files go direct to Supabase Storage) |
| Prisma | 5.x | ORM — type-safe database access |
| @supabase/supabase-js | 2.x | Supabase client (Storage + Auth admin operations) |
| zod | 3.x | Request/response validation and schema definition |
| pino | Built into Fastify | Structured JSON logging |
| fast-csv | 5.x | CSV export for admin |
| jsonwebtoken | 9.x | JWT verification (Supabase-issued JWTs) |
| dotenv | 16.x | Environment variable loading |

---

## 3. Project Structure

```
flarehub-backend/
│
├── src/
│   │
│   ├── server.ts                    # Entry point — creates app, registers plugins, calls listen()
│   ├── app.ts                       # App factory — registers all plugins and routes (exported for testing)
│   │
│   ├── config/
│   │   └── index.ts                 # Typed config object built from process.env (validated at startup)
│   │
│   ├── plugins/
│   │   ├── prisma.ts                # Decorates fastify with `fastify.prisma` (singleton PrismaClient)
│   │   ├── supabase.ts              # Decorates fastify with `fastify.supabase` (Supabase admin client)
│   │   ├── auth.ts                  # JWT verification — adds `fastify.authenticate` preHandler
│   │   ├── websocket.ts             # WebSocket plugin registration + connection registry
│   │   ├── cors.ts                  # CORS config
│   │   ├── helmet.ts                # Security headers
│   │   └── rate-limit.ts            # Rate limiting config
│   │
│   ├── middleware/
│   │   ├── require-auth.ts          # preHandler: verifies JWT, attaches req.user
│   │   ├── require-admin.ts         # preHandler: asserts role is admin or super_admin
│   │   ├── require-mentor.ts        # preHandler: asserts isMentor = true
│   │   └── require-super-admin.ts   # preHandler: asserts role is super_admin only
│   │
│   ├── routes/
│   │   ├── index.ts                 # Registers all route modules under /api/v1
│   │   │
│   │   ├── auth/
│   │   │   └── index.ts             # POST /auth/sync-user, POST /auth/profile-check
│   │   │
│   │   ├── users/
│   │   │   └── index.ts             # GET /users/me, PATCH /users/me, GET /users/:id (admin)
│   │   │
│   │   ├── programs/
│   │   │   └── index.ts             # Public + admin CRUD
│   │   │
│   │   ├── applications/
│   │   │   └── index.ts             # Apply, list own, admin list + status
│   │   │
│   │   ├── submissions/
│   │   │   ├── smart-goals.ts
│   │   │   ├── milestone-plans.ts
│   │   │   └── market-research.ts
│   │   │
│   │   ├── documents/
│   │   │   └── index.ts             # Business plan PDF uploads (metadata registration)
│   │   │
│   │   ├── evidence/
│   │   │   └── index.ts             # Evidence upload registration + admin review
│   │   │
│   │   ├── templates/
│   │   │   └── index.ts             # Admin template management + public download list
│   │   │
│   │   ├── user-submissions/
│   │   │   └── index.ts             # User file submissions against admin templates
│   │   │
│   │   ├── business-plans/
│   │   │   └── index.ts             # In-app business plan JSON (business_template.php equivalent)
│   │   │
│   │   ├── mentor/
│   │   │   └── index.ts             # Mentees, meetings, notes
│   │   │
│   │   ├── messages/
│   │   │   └── index.ts             # Conversation list, thread, send (REST fallback)
│   │   │
│   │   ├── notifications/
│   │   │   └── index.ts             # List, mark read
│   │   │
│   │   ├── admin/
│   │   │   ├── users.ts
│   │   │   ├── applications.ts
│   │   │   ├── programs.ts
│   │   │   ├── evidence.ts
│   │   │   ├── submissions.ts
│   │   │   ├── mentor-management.ts
│   │   │   ├── analytics.ts
│   │   │   ├── settings.ts
│   │   │   └── activity-log.ts
│   │   │
│   │   └── health/
│   │       └── index.ts             # GET /health
│   │
│   ├── services/
│   │   ├── notification.service.ts  # createNotification() — used by all routes that trigger notifications
│   │   ├── storage.service.ts       # Supabase Storage: signed URL generation, delete
│   │   ├── csv.service.ts           # CSV export helpers
│   │   └── admin-log.service.ts     # logAdminAction() — records to admin_logs table
│   │
│   ├── ws/
│   │   ├── registry.ts              # ConnectionRegistry class — Map<userId, Set<WebSocket>>
│   │   ├── handler.ts               # WebSocket connection handler (auth, routing incoming messages)
│   │   └── events.ts                # Typed event payloads (ServerEvent, ClientEvent enums + types)
│   │
│   ├── schemas/
│   │   ├── user.schema.ts           # Zod schemas for user request/response
│   │   ├── program.schema.ts
│   │   ├── application.schema.ts
│   │   ├── submission.schema.ts
│   │   ├── evidence.schema.ts
│   │   ├── mentor.schema.ts
│   │   ├── message.schema.ts
│   │   ├── notification.schema.ts
│   │   └── admin.schema.ts
│   │
│   └── types/
│       ├── fastify.d.ts             # Module augmentation: FastifyRequest.user, fastify.prisma, etc.
│       └── index.ts                 # Shared TypeScript types
│
├── prisma/
│   ├── schema.prisma                # Complete database schema
│   └── seed.ts                      # Seed script (admin accounts, initial programs)
│
├── scripts/
│   └── migrate-from-mysql.ts        # One-time data migration from MySQL dump → Supabase PG
│
├── .env                             # Local environment variables (git-ignored)
├── .env.example                     # Template showing all required env vars
├── package.json
├── tsconfig.json
└── README.md
```

---

## 4. Environment Variables

```env
# .env.example

# ── Server ──────────────────────────────────────────────────────────────────
PORT=3001
NODE_ENV=development                   # development | production | test
API_PREFIX=/api/v1
ALLOWED_ORIGINS=http://localhost:5173  # comma-separated list for production

# ── Database (Supabase PostgreSQL) ───────────────────────────────────────────
#
# TWO separate URLs are required. Do not use the same value for both.
#
# DATABASE_URL  → the CONNECTION POOLER URL (Session mode, port 5432)
#   Used by Prisma Client at runtime. Routes through Supabase's PgBouncer.
#   Find it in: Supabase Dashboard → Project Settings → Database → Connection Pooling
#   Session mode URL. Append ?pgbouncer=true to signal pooler usage.
#
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?pgbouncer=true
#
# DIRECT_URL  → the DIRECT CONNECTION URL (no pooler, port 5432 on db.*)
#   Used by Prisma Migrate only. Migrations require a persistent connection
#   that PgBouncer's transaction mode does not support.
#   Find it in: Supabase Dashboard → Project Settings → Database → Connection String (URI)
#
DIRECT_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# ── Supabase ─────────────────────────────────────────────────────────────────
# Find these in: Supabase Dashboard → Project Settings → API
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]   # Never exposed to clients — bypasses RLS
SUPABASE_JWT_SECRET=[jwt-secret]               # Under Project Settings → API → JWT Settings

# ── Storage Buckets ──────────────────────────────────────────────────────────
# These bucket names must match exactly what is created in Supabase Storage.
# See Section 4.1 (Supabase Project Setup) for bucket creation instructions.
STORAGE_BUCKET_DOCUMENTS=documents             # Business plan PDFs
STORAGE_BUCKET_EVIDENCE=evidence               # Evidence uploads
STORAGE_BUCKET_PROFILES=profiles               # Profile pictures
STORAGE_BUCKET_TEMPLATES=templates             # Admin-uploaded templates (public)
STORAGE_BUCKET_SUBMISSIONS=submissions         # User file submissions

# ── Rate Limiting ─────────────────────────────────────────────────────────────
RATE_LIMIT_MAX=100                             # Requests per window
RATE_LIMIT_WINDOW_MS=60000                     # Window in ms (60s)
```

---

## 5. Database Schema

> Full Prisma schema. This compiles to the Supabase PostgreSQL database.  
> **Note:** User IDs are UUIDs (from Supabase Auth), not auto-increment integers.

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")    // Pooler URL — used at runtime by Prisma Client
  directUrl = env("DIRECT_URL")      // Direct URL — used only by prisma migrate
}

// ═══════════════════════════════════════════════════════
//  ENUMS
// ═══════════════════════════════════════════════════════

enum UserRole {
  entrepreneur
  mentor
  admin
  super_admin
}

enum Gender {
  Male
  Female
  Other
  Unknown
}

enum BusinessStage {
  Idea
  Prototype
  MVP
  Revenue
}

enum ProgramStatus {
  Active
  Inactive
}

enum ApplicationStatus {
  Pending
  UnderReview
  Approved
  Rejected
}

enum EvidenceStatus {
  pending
  verified
  rejected
}

enum DocumentStatus {
  Pending
  Reviewed
  NeedsRevision
  Approved
}

enum DocumentCategory {
  milestone
  survey
  smart_goals
  market_research
  customer_feedback
}

enum Priority {
  low
  medium
  high
  urgent
}

enum TemplateType {
  milestone
  survey
  smart_goals
  market_research
  customer_feedback
}

enum SubmissionStatus {
  Draft
  Submitted
  UnderReview
  Approved
  NeedsRevision
}

enum MeetingStatus {
  Scheduled
  Completed
  Cancelled
}

enum MeetingType {
  Virtual
  InPerson
}

enum NotificationType {
  application_approved
  application_rejected
  application_under_review
  mentor_assigned
  mentor_unassigned
  meeting_scheduled
  meeting_cancelled
  evidence_verified
  evidence_rejected
  smart_goal_commented
  market_research_commented
  submission_reviewed
  new_program
  new_message
}

enum AdminTargetType {
  user
  application
  program
  evidence
  submission
  template
  system
}

// ═══════════════════════════════════════════════════════
//  USERS
// ═══════════════════════════════════════════════════════

model User {
  id                  String         @id               // UUID from Supabase Auth
  email               String         @unique
  firstName           String
  lastName            String
  gender              Gender         @default(Unknown)
  phone               String?
  county              String?
  profilePic          String?                          // Supabase Storage path
  businessName        String?
  businessStage       BusinessStage?
  businessDescription String?
  role                UserRole       @default(entrepreneur)
  isMentor            Boolean        @default(false)
  isVerified          Boolean        @default(false)
  profileComplete     Boolean        @default(false)
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt

  // ── Relations ──────────────────────────────────────
  applications              Application[]
  smartGoal                 SmartGoal?
  milestonePlan             MilestonePlan?
  marketResearch            MarketResearch?
  documents                 Document[]
  evidence                  Evidence[]
  userSubmissions           UserSubmission[]
  businessPlan              BusinessPlan?
  notifications             Notification[]
  sentMessages              Message[]        @relation("sender")
  receivedMessages          Message[]        @relation("receiver")
  mentorRelationships       MentorMentee[]   @relation("mentor")
  menteeRelationships       MentorMentee[]   @relation("mentee")
  mentorMeetingsAsMentor    MentorMeeting[]  @relation("meetingMentor")
  mentorMeetingsAsMentee    MentorMeeting[]  @relation("meetingMentee")
  mentorNotes               MentorNote[]
  adminTemplatesCreated     AdminTemplate[]
  adminLogsActioned         AdminLog[]       @relation("adminActor")

  @@map("users")
}

// ═══════════════════════════════════════════════════════
//  PROGRAMS
// ═══════════════════════════════════════════════════════

model Program {
  id                      Int           @id @default(autoincrement())
  name                    String
  description             String?
  applicationDeadline     DateTime?
  status                  ProgramStatus @default(Active)
  maxParticipants         Int?
  grantAmount             Decimal?      @db.Decimal(12, 2)
  eligibilityRequirements String?
  tags                    String[]                       // e.g. ["Climate", "Waste", "Energy"]
  createdAt               DateTime      @default(now())
  updatedAt               DateTime      @updatedAt

  applications            Application[]
  evidence                Evidence[]

  @@map("programs")
}

// ═══════════════════════════════════════════════════════
//  APPLICATIONS
// ═══════════════════════════════════════════════════════

model Application {
  id        Int               @id @default(autoincrement())
  userId    String
  programId Int
  status    ApplicationStatus @default(Pending)
  appliedAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt

  user      User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  program   Program           @relation(fields: [programId], references: [id])

  @@unique([userId, programId])
  @@index([userId])
  @@index([programId])
  @@index([status])
  @@map("applications")
}

// ═══════════════════════════════════════════════════════
//  SMART GOALS
// ═══════════════════════════════════════════════════════

model SmartGoal {
  id            Int       @id @default(autoincrement())
  userId        String    @unique
  goalStatement String
  specific      String
  measurable    String
  achievable    String
  relevant      String
  timebound     String
  adminComment  String?
  commentedAt   DateTime?
  commentedById String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("smart_goals")
}

// ═══════════════════════════════════════════════════════
//  MILESTONE PLANS
//  Milestones stored as JSON array instead of 35 flat columns
// ═══════════════════════════════════════════════════════

// Milestone JSON shape (for documentation):
// {
//   number: 1 | 2 | 3 | 4 | 5,
//   title: string,
//   timeline: string,
//   budget: string,
//   goal: string,
//   tasks: string,
//   evidence: string,
//   metrics: string[]
// }

model MilestonePlan {
  id                   Int      @id @default(autoincrement())
  userId               String   @unique
  businessName         String
  grantAmount          String?
  implementationPeriod String?
  stage                String?
  milestones           Json                              // MilestoneItem[]
  adminComment         String?
  commentedAt          DateTime?
  commentedById        String?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("milestone_plans")
}

// ═══════════════════════════════════════════════════════
//  MARKET RESEARCH
// ═══════════════════════════════════════════════════════

model MarketResearch {
  id                   Int       @id @default(autoincrement())
  userId               String    @unique
  businessName         String
  surveyDate           DateTime?
  sampleSize           String?
  surveyDuration       String?
  surveyObjective      String?
  ageDistribution      String?
  genderBreakdown      String?
  location             String?
  otherCharacteristics String?
  topChallenges        Json?                             // string[]
  awareness            String?
  interest             String?
  avgWillingness       String?
  priceRange           String?
  currentSolutions     String?
  openComments         String?
  opportunity1         String?
  opportunity2         String?
  riskBarrier          String?
  nextSteps            Json?                             // string[]
  adminComment         String?
  commentedAt          DateTime?
  commentedById        String?
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  user                 User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("market_research")
}

// ═══════════════════════════════════════════════════════
//  DOCUMENTS (uploaded business plan PDFs, pitch decks)
// ═══════════════════════════════════════════════════════

model Document {
  id               Int              @id @default(autoincrement())
  userId           String
  filename         String                                // storage filename
  originalName     String                                // user's original filename
  storagePath      String                                // Supabase Storage path
  fileSize         Int
  fileType         String
  status           DocumentStatus   @default(Pending)
  documentCategory DocumentCategory @default(milestone)
  description      String?
  priority         Priority         @default(medium)
  tags             String?
  version          String           @default("1.0")
  expiresAt        DateTime?
  lastAccessedAt   DateTime?
  uploadedAt       DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  user             User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
  @@index([documentCategory])
  @@map("documents")
}

// ═══════════════════════════════════════════════════════
//  EVIDENCE
// ═══════════════════════════════════════════════════════

model Evidence {
  id              Int            @id @default(autoincrement())
  userId          String
  programId       Int?
  milestoneNumber Int?
  fileName        String
  storagePath     String                                 // Supabase Storage path
  fileType        String
  fileSize        BigInt
  mimeType        String
  description     String?
  category        String?                                // receipts | invoices | photos | reports | videos
  status          EvidenceStatus @default(pending)
  verifiedById    String?
  verifiedAt      DateTime?
  notes           String?                                // admin rejection reason or notes
  uploadDate      DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  user            User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  program         Program?       @relation(fields: [programId], references: [id])

  @@index([userId])
  @@index([programId])
  @@index([status])
  @@index([milestoneNumber])
  @@map("evidence")
}

// ═══════════════════════════════════════════════════════
//  ADMIN TEMPLATES (downloadable template files)
// ═══════════════════════════════════════════════════════

model AdminTemplate {
  id           Int          @id @default(autoincrement())
  title        String
  description  String?
  filename     String
  originalName String
  storagePath  String                                    // Supabase Storage path
  fileSize     Int
  fileType     String
  templateType TemplateType
  isActive     Boolean      @default(true)
  createdById  String
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  createdBy    User         @relation(fields: [createdById], references: [id])
  submissions  UserSubmission[]

  @@index([templateType])
  @@index([isActive])
  @@map("admin_templates")
}

// ═══════════════════════════════════════════════════════
//  USER SUBMISSIONS (user uploads against a template)
// ═══════════════════════════════════════════════════════

model UserSubmission {
  id             Int              @id @default(autoincrement())
  templateId     Int
  userId         String
  submissionName String
  filename       String
  originalName   String
  storagePath    String                                  // Supabase Storage path
  fileSize       Int
  fileType       String
  status         SubmissionStatus @default(Draft)
  notes          String?                                 // admin review notes
  submittedAt    DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  template       AdminTemplate    @relation(fields: [templateId], references: [id])
  user           User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([templateId])
  @@index([status])
  @@map("user_submissions")
}

// ═══════════════════════════════════════════════════════
//  BUSINESS PLANS (in-app JSON form — business_template.php)
// ═══════════════════════════════════════════════════════

model BusinessPlan {
  id        Int      @id @default(autoincrement())
  userId    String   @unique
  planData  Json                                         // full form JSON
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("business_plans")
}

// ═══════════════════════════════════════════════════════
//  MENTOR SYSTEM
// ═══════════════════════════════════════════════════════

model MentorMentee {
  id         Int      @id @default(autoincrement())
  mentorId   String
  menteeId   String
  assignedAt DateTime @default(now())

  mentor     User     @relation("mentor", fields: [mentorId], references: [id])
  mentee     User     @relation("mentee", fields: [menteeId], references: [id])

  @@unique([mentorId, menteeId])
  @@index([mentorId])
  @@index([menteeId])
  @@map("mentor_mentees")
}

model MentorMeeting {
  id          Int           @id @default(autoincrement())
  mentorId    String
  menteeId    String
  meetingTime DateTime
  status      MeetingStatus @default(Scheduled)
  meetingType MeetingType   @default(Virtual)
  link        String?                                    // video call URL
  location    String?                                    // physical address
  notes       String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  mentor      User          @relation("meetingMentor", fields: [mentorId], references: [id])
  mentee      User          @relation("meetingMentee", fields: [menteeId], references: [id])

  @@index([mentorId])
  @@index([menteeId])
  @@index([meetingTime])
  @@map("mentor_meetings")
}

model MentorNote {
  id        Int      @id @default(autoincrement())
  mentorId  String
  menteeId  String
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  mentor    User     @relation(fields: [mentorId], references: [id])

  @@index([mentorId])
  @@index([menteeId])
  @@map("mentor_notes")
}

// ═══════════════════════════════════════════════════════
//  MESSAGES
// ═══════════════════════════════════════════════════════

model Message {
  id         Int      @id @default(autoincrement())
  senderId   String
  receiverId String
  content    String
  isRead     Boolean  @default(false)
  createdAt  DateTime @default(now())

  sender     User     @relation("sender", fields: [senderId], references: [id])
  receiver   User     @relation("receiver", fields: [receiverId], references: [id])

  @@index([senderId])
  @@index([receiverId])
  @@index([createdAt])
  @@map("messages")
}

// ═══════════════════════════════════════════════════════
//  NOTIFICATIONS
// ═══════════════════════════════════════════════════════

model Notification {
  id        Int              @id @default(autoincrement())
  userId    String
  type      NotificationType
  title     String
  body      String
  isRead    Boolean          @default(false)
  metadata  Json?                                        // { applicationId, programId, fromUserId, etc. }
  createdAt DateTime         @default(now())

  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
  @@map("notifications")
}

// ═══════════════════════════════════════════════════════
//  ADMIN LOGS
// ═══════════════════════════════════════════════════════

model AdminLog {
  id          Int              @id @default(autoincrement())
  adminId     String
  action      String                                     // e.g. "approved_application", "deleted_user"
  targetType  AdminTargetType?
  targetId    String?
  description String?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime         @default(now())

  admin       User             @relation("adminActor", fields: [adminId], references: [id])

  @@index([adminId])
  @@index([createdAt])
  @@map("admin_logs")
}

// ═══════════════════════════════════════════════════════
//  ADMIN SETTINGS
// ═══════════════════════════════════════════════════════

model AdminSetting {
  id           Int      @id @default(autoincrement())
  settingKey   String   @unique
  settingValue String
  description  String?
  updatedAt    DateTime @updatedAt

  @@map("admin_settings")
}
```

---

## 6. Authentication & Authorization

### How Auth Works

1. The **frontend** authenticates users via Supabase Auth (email/password, or magic link).
2. Supabase Auth issues a **JWT** signed with the `SUPABASE_JWT_SECRET`.
3. Every request to this backend must include the header:
   ```
   Authorization: Bearer <supabase-jwt>
   ```
4. The `requireAuth` middleware verifies the JWT using the shared secret and attaches `req.user` to the request.
5. The backend **never issues its own JWTs**. All token operations (refresh, expiry) are Supabase's responsibility.

### First Login — Profile Sync

When a user signs up via Supabase Auth, a row does **not** automatically exist in our `users` table. The frontend must call `POST /api/v1/auth/sync-user` immediately after the first sign-in. This endpoint creates the `User` row using the JWT's `sub` (user ID) and `email` claims.

### Role Model

Roles are stored in the `users.role` column. This is **not** inside the Supabase Auth JWT by default. The `requireAuth` middleware fetches the user's role from the database after verifying the JWT and attaches it to `req.user`.

```
req.user = {
  id: string,          // UUID from JWT sub
  email: string,
  role: UserRole,
  isMentor: boolean
}
```

### Middleware Chain

```
requireAuth       → verifies JWT, fetches user row, attaches req.user
requireAdmin      → asserts req.user.role in ['admin', 'super_admin']
requireSuperAdmin → asserts req.user.role === 'super_admin'
requireMentor     → asserts req.user.isMentor === true
```

---

## 7. API Design Conventions

### Base URL
```
/api/v1/
```

### Response Envelope

All responses use this consistent shape:

```ts
// Success
{
  "success": true,
  "data": <payload>,
  "meta": {              // only on paginated responses
    "total": number,
    "page": number,
    "limit": number,
    "totalPages": number
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": {}          // optional — field-level Zod errors
  }
}
```

### Pagination

All list endpoints support:
```
GET /resource?page=1&limit=20&search=query&sortBy=createdAt&sortOrder=desc
```

Default: `page=1`, `limit=20`, `sortOrder=desc`.

### HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 204 | No Content (DELETE) |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized (no/invalid JWT) |
| 403 | Forbidden (valid JWT, insufficient role) |
| 404 | Not Found |
| 409 | Conflict (duplicate, e.g. applying twice to same program) |
| 422 | Unprocessable Entity (business logic error) |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

### Error Codes

```
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
CONFLICT
BUSINESS_RULE_VIOLATION
INTERNAL_ERROR
```

### Request Validation

All request bodies and query params are validated with **Zod** schemas defined in `src/schemas/`. Invalid requests return `400` with per-field error details.

---

## 8. REST API Reference

### 8.1 Auth

#### POST `/api/v1/auth/sync-user`
Creates a `User` row in the database for a newly registered Supabase Auth user. Called by the frontend immediately after first sign-in.

- **Auth:** Required (Bearer JWT)
- **Body:** none — all data comes from the verified JWT
- **Response 201:**
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "entrepreneur",
      "profileComplete": false,
      "isNewUser": true
    }
  }
  ```
- **Response 200:** If user already exists (idempotent), returns existing user with `"isNewUser": false`.

---

#### GET `/api/v1/auth/profile-check`
Returns minimal info to help the frontend decide where to redirect after login.

- **Auth:** Required
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "profileComplete": false,
      "role": "entrepreneur",
      "isMentor": false
    }
  }
  ```

---

### 8.2 Users

#### GET `/api/v1/users/me`
Returns the authenticated user's full profile.

- **Auth:** Required
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "gender": "Female",
      "phone": "+254712345678",
      "county": "Nairobi",
      "profilePic": "https://[project].supabase.co/storage/v1/object/public/profiles/...",
      "businessName": "GreenBin Solutions",
      "businessStage": "MVP",
      "businessDescription": "...",
      "role": "entrepreneur",
      "isMentor": false,
      "isVerified": true,
      "profileComplete": true,
      "createdAt": "2025-06-08T00:00:00.000Z"
    }
  }
  ```

---

#### PATCH `/api/v1/users/me`
Updates the authenticated user's profile.

- **Auth:** Required
- **Body:**
  ```json
  {
    "firstName": "Jane",
    "lastName": "Doe",
    "phone": "+254712345678",
    "county": "Nairobi",
    "gender": "Female",
    "businessName": "GreenBin Solutions",
    "businessStage": "MVP",
    "businessDescription": "...",
    "profilePic": "profiles/uuid-filename.jpg"
  }
  ```
  All fields optional. `profilePic` is a Supabase Storage path, uploaded by client before calling this.
- **Side effect:** If all required profile fields are now populated, sets `profileComplete = true`.
- **Response 200:** Updated user object.

---

#### GET `/api/v1/users/:id`
Returns a specific user's profile.

- **Auth:** Required (admin only for full detail; mentor can view own mentees; others get 403)
- **Response 200:** User object (same shape as `/users/me`)

---

### 8.3 Programs

#### GET `/api/v1/programs`
Lists programs. Public — no auth required.

- **Query params:** `page`, `limit`, `search`, `status` (Active | Inactive)
- **Response 200:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "Be Green Incubation Program",
        "description": "...",
        "applicationDeadline": "2025-07-01T00:00:00.000Z",
        "status": "Active",
        "maxParticipants": null,
        "grantAmount": null,
        "tags": ["Climate", "Waste"],
        "createdAt": "2025-06-07T00:00:00.000Z",
        "applicationCount": 82
      }
    ],
    "meta": { "total": 2, "page": 1, "limit": 20, "totalPages": 1 }
  }
  ```

---

#### GET `/api/v1/programs/:id`
Returns a single program's full detail.

- **Auth:** Not required
- **Response 200:** Program object + `hasApplied: boolean` if user is authenticated (via optional auth).

---

#### POST `/api/v1/programs`
Creates a new program.

- **Auth:** Admin only
- **Body:**
  ```json
  {
    "name": "YOMA Youth Innovation Challenge",
    "description": "...",
    "applicationDeadline": "2025-07-25",
    "status": "Active",
    "maxParticipants": 100,
    "grantAmount": 250000,
    "eligibilityRequirements": "...",
    "tags": ["Climate", "Energy"]
  }
  ```
- **Response 201:** Created program object.
- **Side effect:** Sends `new_program` notification to all verified users via WebSocket.

---

#### PATCH `/api/v1/programs/:id`
Updates a program.

- **Auth:** Admin only
- **Body:** Any subset of program fields.
- **Response 200:** Updated program object.

---

#### DELETE `/api/v1/programs/:id`
Deletes a program. Blocked if the program has existing applications.

- **Auth:** Admin only
- **Response 204:** No content.
- **Error 422:** If program has applications.

---

### 8.4 Applications

#### GET `/api/v1/applications/me`
Returns all applications made by the authenticated user.

- **Auth:** Required
- **Response 200:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 83,
        "programId": 1,
        "programName": "Be Green Incubation Program",
        "status": "Approved",
        "appliedAt": "2025-06-18T00:00:00.000Z"
      }
    ]
  }
  ```

---

#### POST `/api/v1/applications`
Applies the authenticated user to a program.

- **Auth:** Required (entrepreneur role)
- **Body:**
  ```json
  { "programId": 1 }
  ```
- **Error 409:** If already applied to this program.
- **Error 422:** If program is Inactive or deadline has passed.
- **Response 201:** Created application object.
- **Side effect:** Creates a `Pending` admin notification (no notification to user on apply, only on status change).

---

#### PATCH `/api/v1/applications/:id/status`
Admin updates the status of an application.

- **Auth:** Admin only
- **Body:**
  ```json
  { "status": "Approved" }
  ```
- **Response 200:** Updated application.
- **Side effects:**
  - Creates a `Notification` for the user.
  - Pushes a `application_status_changed` WebSocket event to the user.
  - Logs action in `admin_logs`.

---

#### GET `/api/v1/applications`
Admin: lists all applications across all programs.

- **Auth:** Admin only
- **Query params:** `page`, `limit`, `status`, `programId`, `search` (searches user name/email), `from`, `to` (date range)
- **Response 200:** Paginated list with user and program details embedded.

---

#### GET `/api/v1/applications/export`
Admin: exports filtered applications as a CSV file.

- **Auth:** Admin only
- **Query params:** Same filters as list endpoint.
- **Response:** `Content-Type: text/csv` file download.

---

#### PATCH `/api/v1/applications/bulk-status`
Admin: updates the status of multiple applications at once.

- **Auth:** Admin only
- **Body:**
  ```json
  { "ids": [8, 9, 10], "status": "Approved" }
  ```
- **Response 200:**
  ```json
  { "success": true, "data": { "updated": 3 } }
  ```
- **Side effect:** Creates notifications for each affected user and pushes WebSocket events.

---

### 8.5 Submissions — Smart Goals

#### GET `/api/v1/submissions/smart-goals/me`
Returns the authenticated user's smart goal.

- **Auth:** Required
- **Response 200:** SmartGoal object or `null` if not yet created.

---

#### POST `/api/v1/submissions/smart-goals`
Creates a smart goal for the authenticated user. One per user.

- **Auth:** Required
- **Error 409:** If one already exists (use PATCH instead).
- **Body:**
  ```json
  {
    "goalStatement": "...",
    "specific": "...",
    "measurable": "...",
    "achievable": "...",
    "relevant": "...",
    "timebound": "..."
  }
  ```
- **Response 201:** Created SmartGoal.

---

#### PATCH `/api/v1/submissions/smart-goals/me`
Updates the authenticated user's smart goal.

- **Auth:** Required
- **Body:** Any subset of SmartGoal fields (except admin comment fields).
- **Response 200:** Updated SmartGoal.

---

#### PATCH `/api/v1/submissions/smart-goals/:id/comment`
Admin adds or updates a comment on a user's smart goal.

- **Auth:** Admin only
- **Body:**
  ```json
  { "adminComment": "Good detail on the measurable component..." }
  ```
- **Response 200:** Updated SmartGoal.
- **Side effects:**
  - Creates `smart_goal_commented` Notification for the user.
  - Pushes `smart_goal_commented` WebSocket event to the user.
  - Logs action in `admin_logs`.

---

#### GET `/api/v1/submissions/smart-goals`
Admin: lists all smart goals with user info.

- **Auth:** Admin only
- **Query params:** `page`, `limit`, `search`, `hasComment` (boolean filter)
- **Response 200:** Paginated list.

---

### 8.6 Submissions — Milestone Plans

#### GET `/api/v1/submissions/milestones/me`
- **Auth:** Required
- **Response 200:** MilestonePlan object or `null`.

---

#### POST `/api/v1/submissions/milestones`
- **Auth:** Required
- **Body:**
  ```json
  {
    "businessName": "GreenBin Solutions",
    "grantAmount": "KES 250,000",
    "implementationPeriod": "6 months",
    "stage": "MVP",
    "milestones": [
      {
        "number": 1,
        "title": "Prototype Development",
        "timeline": "Month 1-2",
        "budget": "KES 50,000",
        "goal": "...",
        "tasks": "...",
        "evidence": "...",
        "metrics": ["Units produced", "Test results"]
      }
    ]
  }
  ```
- **Response 201:** Created MilestonePlan.

---

#### PATCH `/api/v1/submissions/milestones/me`
- **Auth:** Required
- **Body:** Any subset of MilestonePlan fields.
- **Response 200:** Updated MilestonePlan.

---

#### PATCH `/api/v1/submissions/milestones/:id/comment`
Admin comments on a milestone plan.

- **Auth:** Admin only
- **Body:** `{ "adminComment": "..." }`
- **Response 200:** Updated MilestonePlan.
- **Side effects:** Notification + WebSocket event to user.

---

#### GET `/api/v1/submissions/milestones`
Admin: lists all milestone plans.

- **Auth:** Admin only
- **Query params:** `page`, `limit`, `search`, `hasComment`
- **Response 200:** Paginated list.

---

### 8.7 Submissions — Market Research

#### GET `/api/v1/submissions/market-research/me`
- **Auth:** Required
- **Response 200:** MarketResearch object or `null`.

---

#### POST `/api/v1/submissions/market-research`
- **Auth:** Required
- **Body:** All MarketResearch fields.
- **Response 201:** Created MarketResearch.

---

#### PATCH `/api/v1/submissions/market-research/me`
- **Auth:** Required
- **Body:** Any subset of MarketResearch fields.
- **Response 200:** Updated MarketResearch.

---

#### PATCH `/api/v1/submissions/market-research/:id/comment`
- **Auth:** Admin only
- **Body:** `{ "adminComment": "..." }`
- **Response 200:** Updated MarketResearch.
- **Side effects:** Notification + WebSocket event.

---

#### GET `/api/v1/submissions/market-research`
- **Auth:** Admin only
- **Response 200:** Paginated list.

---

### 8.8 Documents (File Uploads)

> Documents represent uploaded business plan PDFs and pitch decks.  
> Files go to Supabase Storage first (client-side). The client then POSTs metadata here.

#### POST `/api/v1/documents`
Registers a newly uploaded document.

- **Auth:** Required
- **Body:**
  ```json
  {
    "originalName": "BUSINESS PLAN - GreenBin.pdf",
    "storagePath": "documents/uuid-filename.pdf",
    "fileSize": 548294,
    "fileType": "application/pdf",
    "documentCategory": "milestone",
    "description": "Final business plan",
    "priority": "high"
  }
  ```
- **Response 201:** Created Document record.

---

#### GET `/api/v1/documents/me`
Returns all documents uploaded by the authenticated user.

- **Auth:** Required
- **Query params:** `page`, `limit`, `documentCategory`, `status`
- **Response 200:** Paginated list with signed download URLs.

---

#### GET `/api/v1/documents/:id`
Returns a single document. Users can only access their own. Admins can access all.

- **Auth:** Required
- **Response 200:** Document with a fresh signed download URL.

---

#### DELETE `/api/v1/documents/:id`
Deletes a document record and its file from Supabase Storage. Users can only delete their own.

- **Auth:** Required
- **Response 204.**

---

#### GET `/api/v1/documents`
Admin: lists all documents.

- **Auth:** Admin only
- **Query params:** `page`, `limit`, `search`, `documentCategory`, `status`, `userId`
- **Response 200:** Paginated list.

---

#### PATCH `/api/v1/documents/:id/status`
Admin reviews a document.

- **Auth:** Admin only
- **Body:** `{ "status": "Approved", "notes": "..." }`
- **Response 200:** Updated document.
- **Side effect:** Logs admin action.

---

### 8.9 Evidence

#### POST `/api/v1/evidence`
Registers newly uploaded evidence.

- **Auth:** Required
- **Body:**
  ```json
  {
    "programId": 5,
    "milestoneNumber": 1,
    "fileName": "receipt-photo.jpg",
    "storagePath": "evidence/uuid-filename.jpg",
    "fileSize": 274200,
    "mimeType": "image/jpeg",
    "fileType": "jpg",
    "description": "Receipt for equipment purchase",
    "category": "receipts"
  }
  ```
- **Response 201:** Created Evidence record.

---

#### GET `/api/v1/evidence/me`
Returns all evidence uploaded by the authenticated user.

- **Auth:** Required
- **Query params:** `page`, `limit`, `programId`, `milestoneNumber`, `status`, `category`
- **Response 200:** Paginated list with signed URLs.

---

#### GET `/api/v1/evidence/:id`
- **Auth:** Required (own evidence or admin)
- **Response 200:** Evidence with signed URL.

---

#### DELETE `/api/v1/evidence/:id`
Deletes evidence. Only allowed if status is `pending`.

- **Auth:** Required (own evidence only)
- **Error 422:** If evidence has already been reviewed.
- **Response 204.**

---

#### GET `/api/v1/evidence`
Admin: lists all evidence for review.

- **Auth:** Admin only
- **Query params:** `page`, `limit`, `status`, `programId`, `userId`, `category`, `from`, `to`
- **Response 200:** Paginated list with signed URLs and user details.

---

#### PATCH `/api/v1/evidence/:id/status`
Admin reviews evidence.

- **Auth:** Admin only
- **Body:** `{ "status": "verified" | "rejected", "notes": "..." }`
- **Response 200:** Updated evidence.
- **Side effects:**
  - Creates `evidence_verified` or `evidence_rejected` notification.
  - Pushes WebSocket event to the user.
  - Logs admin action.

---

### 8.10 Admin Templates

#### GET `/api/v1/templates`
Lists active downloadable templates. Available to all authenticated users.

- **Auth:** Required
- **Query params:** `templateType`
- **Response 200:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 4,
        "title": "SMART Goals Template",
        "description": "...",
        "templateType": "smart_goals",
        "fileType": "application/pdf",
        "downloadUrl": "https://..."
      }
    ]
  }
  ```

---

#### POST `/api/v1/templates`
Admin uploads a new template (registers after file goes to Supabase Storage).

- **Auth:** Admin only
- **Body:**
  ```json
  {
    "title": "Milestone Plan Template",
    "description": "...",
    "originalName": "MILESTONE_PLAN.pdf",
    "storagePath": "templates/uuid-filename.pdf",
    "fileSize": 538323,
    "fileType": "application/pdf",
    "templateType": "milestone"
  }
  ```
- **Response 201:** Created AdminTemplate.

---

#### PATCH `/api/v1/templates/:id`
Admin updates template metadata or swaps the file.

- **Auth:** Admin only
- **Response 200:** Updated template.

---

#### PATCH `/api/v1/templates/:id/toggle`
Activate or deactivate a template.

- **Auth:** Admin only
- **Response 200:** `{ "isActive": false }`

---

#### DELETE `/api/v1/templates/:id`
Deletes a template and its file.

- **Auth:** Admin only
- **Error 422:** If users have submissions against this template.
- **Response 204.**

---

### 8.11 User Submissions (Template File Uploads)

#### POST `/api/v1/user-submissions`
User submits a file against a template.

- **Auth:** Required
- **Body:**
  ```json
  {
    "templateId": 4,
    "submissionName": "Jane Doe SMART Goals",
    "originalName": "Jane_Doe_SMARTGoals.pdf",
    "storagePath": "submissions/uuid-filename.pdf",
    "fileSize": 441044,
    "fileType": "application/pdf"
  }
  ```
- **Response 201:** Created UserSubmission.

---

#### GET `/api/v1/user-submissions/me`
Returns all submissions made by the authenticated user.

- **Auth:** Required
- **Response 200:** Paginated list with template info and signed download URLs.

---

#### GET `/api/v1/user-submissions/:id`
- **Auth:** Required (own or admin)
- **Response 200:** Submission with signed URL.

---

#### GET `/api/v1/user-submissions`
Admin: lists all user submissions.

- **Auth:** Admin only
- **Query params:** `page`, `limit`, `templateId`, `status`, `userId`, `search`
- **Response 200:** Paginated list.

---

#### PATCH `/api/v1/user-submissions/:id/status`
Admin reviews a user submission.

- **Auth:** Admin only
- **Body:** `{ "status": "Approved" | "NeedsRevision" | "UnderReview", "notes": "..." }`
- **Response 200:** Updated submission.
- **Side effects:** `submission_reviewed` notification + WebSocket event to user.

---

### 8.12 Business Plans

> The in-app JSON business plan form (equivalent to `business_template.php`).

#### GET `/api/v1/business-plans/me`
- **Auth:** Required
- **Response 200:** BusinessPlan `planData` JSON or `null`.

---

#### POST `/api/v1/business-plans`
Creates or replaces the authenticated user's business plan JSON.

- **Auth:** Required
- **Body:**
  ```json
  {
    "planData": {
      "businessName": "GreenBin ATM",
      "address": "...",
      "members": "3",
      "purpose": "...",
      "...": "..."
    }
  }
  ```
- **Response 201 / 200:** Upserted BusinessPlan.

---

### 8.13 Mentor

#### GET `/api/v1/mentor/mentees`
Returns all mentees assigned to the authenticated mentor.

- **Auth:** Required (mentor only)
- **Response 200:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "firstName": "James",
        "lastName": "Omondi",
        "email": "...",
        "county": "Kisumu",
        "businessName": "Robox-Farm",
        "businessStage": "MVP",
        "assignedAt": "2025-07-04T00:00:00.000Z",
        "submissionProgress": {
          "smartGoal": "submitted",
          "milestonePlan": "submitted",
          "marketResearch": "not_started"
        }
      }
    ]
  }
  ```

---

#### GET `/api/v1/mentor/mentees/:menteeId`
Returns a specific mentee's full profile + all submissions (read-only).

- **Auth:** Required (own mentee only or admin)
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "profile": { "...": "..." },
      "smartGoal": { "...": "..." },
      "milestonePlan": { "...": "..." },
      "marketResearch": { "...": "..." },
      "evidence": [],
      "documents": [],
      "notes": []
    }
  }
  ```

---

#### POST `/api/v1/mentor/meetings`
Schedules a meeting with a mentee.

- **Auth:** Required (mentor only)
- **Body:**
  ```json
  {
    "menteeId": "uuid",
    "meetingTime": "2026-05-01T10:00:00.000Z",
    "meetingType": "Virtual",
    "link": "https://meet.google.com/...",
    "notes": "Initial check-in"
  }
  ```
- **Error 422:** If mentee is not assigned to this mentor.
- **Response 201:** Created MentorMeeting.
- **Side effects:**
  - `meeting_scheduled` notification to mentee.
  - WebSocket push `meeting_scheduled` to mentee.

---

#### GET `/api/v1/mentor/meetings`
Returns all meetings for the authenticated mentor.

- **Auth:** Required (mentor only)
- **Query params:** `status`, `from`, `to`, `menteeId`
- **Response 200:** Paginated list of meetings with mentee info.

---

#### PATCH `/api/v1/mentor/meetings/:id`
Updates a meeting (status, notes, reschedule).

- **Auth:** Required (meeting's mentor only)
- **Body:** Any subset of `{ status, meetingTime, link, location, notes }`
- **Response 200:** Updated meeting.
- **Side effect:** If cancelled, pushes `meeting_cancelled` WebSocket event to mentee.

---

#### POST `/api/v1/mentor/notes`
Creates a note about a mentee.

- **Auth:** Required (mentor only, mentee must be assigned to them)
- **Body:**
  ```json
  {
    "menteeId": "uuid",
    "content": "James is making good progress on milestone 1..."
  }
  ```
- **Response 201:** Created MentorNote.

---

#### GET `/api/v1/mentor/notes/:menteeId`
Returns all notes written about a specific mentee.

- **Auth:** Required (mentor who wrote them, or admin)
- **Response 200:** List of notes with timestamps.

---

#### PATCH `/api/v1/mentor/notes/:id`
Updates a note's content.

- **Auth:** Required (note author only)
- **Body:** `{ "content": "..." }`
- **Response 200:** Updated note.

---

#### DELETE `/api/v1/mentor/notes/:id`
- **Auth:** Required (note author only)
- **Response 204.**

---

### 8.14 Messages

> Primary messaging happens via WebSocket. These REST endpoints serve as fallback and history loading.

#### GET `/api/v1/messages/conversations`
Returns a list of the user's active conversations (one entry per contact), ordered by most recent message.

- **Auth:** Required
- **Response 200:**
  ```json
  {
    "success": true,
    "data": [
      {
        "contactId": "uuid",
        "contactName": "Mentor Jane",
        "contactProfilePic": "...",
        "lastMessage": "See you at the meeting tomorrow",
        "lastMessageAt": "2026-04-10T08:00:00.000Z",
        "unreadCount": 2
      }
    ]
  }
  ```

---

#### GET `/api/v1/messages/:contactId`
Returns the message thread between the authenticated user and a contact.

- **Auth:** Required
- **Query params:** `page`, `limit`
- **Response 200:** Paginated messages, oldest first within page.

---

#### POST `/api/v1/messages`
Sends a message (REST fallback — prefer WebSocket for real-time).

- **Auth:** Required
- **Body:** `{ "receiverId": "uuid", "content": "..." }`
- **Response 201:** Created message.
- **Side effect:** Pushes `new_message` WebSocket event to receiver if connected.

---

#### PATCH `/api/v1/messages/:contactId/read`
Marks all messages in a thread from a contact as read.

- **Auth:** Required
- **Response 200:** `{ "marked": 5 }`

---

### 8.15 Notifications

#### GET `/api/v1/notifications/me`
Returns the authenticated user's notifications.

- **Auth:** Required
- **Query params:** `page`, `limit`, `isRead` (boolean)
- **Response 200:** Paginated notifications, newest first.

---

#### PATCH `/api/v1/notifications/:id/read`
Marks a single notification as read.

- **Auth:** Required (own notification only)
- **Response 200:** Updated notification.

---

#### PATCH `/api/v1/notifications/read-all`
Marks all unread notifications as read for the authenticated user.

- **Auth:** Required
- **Response 200:** `{ "marked": 12 }`

---

### 8.16 Admin — Users

#### GET `/api/v1/admin/users`
Lists all users.

- **Auth:** Admin only
- **Query params:** `page`, `limit`, `search` (name or email), `role`, `county`, `isVerified`, `isMentor`, `businessStage`
- **Response 200:** Paginated users with application counts and submission status.

---

#### GET `/api/v1/admin/users/:id`
Full user detail for admin — profile + applications + all submissions + evidence + documents.

- **Auth:** Admin only
- **Response 200:** Complete user object.

---

#### PATCH `/api/v1/admin/users/:id/role`
Changes a user's role.

- **Auth:** Super-admin only
- **Body:** `{ "role": "admin" | "mentor" | "entrepreneur" }`
- **Response 200:** Updated user.
- **Side effect:** If demoted from mentor, pushes `mentor_unassigned` events to all their mentees.

---

#### PATCH `/api/v1/admin/users/:id/verify`
Verifies or un-verifies a user.

- **Auth:** Admin only
- **Body:** `{ "isVerified": true }`
- **Response 200:** Updated user.

---

#### PATCH `/api/v1/admin/users/:id/mentor-status`
Promotes a user to mentor (or removes mentor status).

- **Auth:** Admin only
- **Body:** `{ "isMentor": true }`
- **Response 200:** Updated user.

---

#### GET `/api/v1/admin/users/export`
Exports full user list as CSV.

- **Auth:** Admin only
- **Query params:** Same filters as list.
- **Response:** `text/csv` download.

---

### 8.17 Admin — Applications

> See [§8.4 Applications](#84-applications) — admin-scoped endpoints are documented there.

---

### 8.18 Admin — Programs

> See [§8.3 Programs](#83-programs) — admin CRUD is documented there.

---

### 8.19 Admin — Evidence Review

> See [§8.9 Evidence](#89-evidence) — admin endpoints documented there.

---

### 8.20 Admin — Submissions Review

> See [§8.5](#85-submissions--smart-goals), [§8.6](#86-submissions--milestone-plans), [§8.7](#87-submissions--market-research) — admin comment endpoints are there.  
> See [§8.11 User Submissions](#811-user-submissions-template-file-uploads) — admin status update there.

---

### 8.21 Admin — Mentor Management

#### GET `/api/v1/admin/mentors`
Lists all users with `isMentor = true`, with mentee counts.

- **Auth:** Admin only
- **Response 200:** Paginated list.

---

#### GET `/api/v1/admin/mentors/:mentorId/mentees`
Lists all mentees assigned to a specific mentor.

- **Auth:** Admin only
- **Response 200:** List of users.

---

#### POST `/api/v1/admin/mentor-assignments`
Assigns a mentor to an entrepreneur.

- **Auth:** Admin only
- **Body:**
  ```json
  { "mentorId": "uuid", "menteeId": "uuid" }
  ```
- **Error 409:** If assignment already exists.
- **Error 422:** If target user is not a mentor.
- **Response 201:** Created MentorMentee assignment.
- **Side effects:**
  - `mentor_assigned` notification to the mentee.
  - WebSocket push `mentor_assigned` to the mentee.
  - Log admin action.

---

#### DELETE `/api/v1/admin/mentor-assignments`
Removes a mentor-mentee assignment.

- **Auth:** Admin only
- **Body:** `{ "mentorId": "uuid", "menteeId": "uuid" }`
- **Response 204.**
- **Side effect:** `mentor_unassigned` notification + WebSocket event to mentee.

---

### 8.22 Admin — Analytics

#### GET `/api/v1/admin/analytics/overview`
Returns high-level platform stats.

- **Auth:** Admin only
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "totalUsers": 221,
      "totalApplications": 185,
      "approvedApplications": 180,
      "rejectedApplications": 1,
      "pendingEvidence": 1,
      "activePrograms": 1,
      "totalPrograms": 2,
      "newUsersThisMonth": 12,
      "successRate": 97.3
    }
  }
  ```

---

#### GET `/api/v1/admin/analytics/applications-by-month`
Monthly application counts for chart display.

- **Auth:** Admin only
- **Query params:** `months` (default 6)
- **Response 200:**
  ```json
  {
    "success": true,
    "data": [
      { "month": "2025-06", "count": 82 },
      { "month": "2025-07", "count": 69 }
    ]
  }
  ```

---

#### GET `/api/v1/admin/analytics/gender-distribution`
- **Auth:** Admin only
- **Response 200:** `{ "Male": 89, "Female": 121, "Other": 3, "Unknown": 8 }`

---

#### GET `/api/v1/admin/analytics/county-distribution`
Returns user counts grouped by county for map visualization.

- **Auth:** Admin only
- **Response 200:**
  ```json
  {
    "success": true,
    "data": [
      { "county": "Nairobi", "count": 74 },
      { "county": "Kisumu", "count": 22 }
    ]
  }
  ```

---

#### GET `/api/v1/admin/analytics/submission-completion`
Per-user completion rate across smart goals, milestone plans, market research.

- **Auth:** Admin only
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "smartGoals": { "submitted": 12, "notSubmitted": 170 },
      "milestonePlans": { "submitted": 9, "notSubmitted": 173 },
      "marketResearch": { "submitted": 10, "notSubmitted": 172 }
    }
  }
  ```

---

### 8.23 Admin — Settings

#### GET `/api/v1/admin/settings`
Returns all settings key-value pairs.

- **Auth:** Admin only
- **Response 200:** `{ "key": "value" }` map.

---

#### PATCH `/api/v1/admin/settings`
Updates one or more settings.

- **Auth:** Super-admin only
- **Body:** `{ "site_name": "Flarehub", "maintenance_mode": "false" }`
- **Response 200:** Updated settings.

---

### 8.24 Admin — Activity Log

#### GET `/api/v1/admin/activity-log`
Returns the admin action history.

- **Auth:** Admin only
- **Query params:** `page`, `limit`, `adminId`, `targetType`, `from`, `to`
- **Response 200:** Paginated list of admin log entries with admin user details.

---

### 8.25 Health

#### GET `/health`
Server health check. Not versioned. Used by load balancers and uptime monitors.

- **Auth:** None
- **Response 200:**
  ```json
  {
    "status": "ok",
    "timestamp": "2026-04-15T08:00:00.000Z",
    "uptime": 3600,
    "db": "connected"
  }
  ```

---

## 9. WebSocket Design

### Connection

```
ws://[server]/ws?token=<supabase-jwt>
```

The token is passed as a query parameter on the initial connection. On connect, the server:
1. Verifies the JWT.
2. Looks up the user in the database.
3. Registers the connection in the `ConnectionRegistry`.
4. Sends a `connected` event with any unread notification count.
5. On disconnect, removes from registry.

### Connection Registry

```ts
// src/ws/registry.ts

class ConnectionRegistry {
  // A user can have multiple tabs open — store a Set per user
  private connections = new Map<string, Set<WebSocket>>();

  register(userId: string, ws: WebSocket): void
  unregister(userId: string, ws: WebSocket): void
  isOnline(userId: string): boolean
  push(userId: string, event: ServerEvent): void   // sends to ALL connections for this user
  pushMany(userIds: string[], event: ServerEvent): void
  broadcast(event: ServerEvent): void              // sends to ALL connected users
}
```

### Event Format

All WebSocket messages are JSON with a `type` discriminator:

```ts
// Sent by server → client
type ServerEvent =
  | { type: 'connected';                  data: { unreadNotifications: number } }
  | { type: 'notification';               data: Notification }
  | { type: 'new_message';                data: Message & { senderName: string } }
  | { type: 'typing';                     data: { fromUserId: string; conversationId: string } }
  | { type: 'application_status_changed'; data: { applicationId: number; programName: string; status: ApplicationStatus } }
  | { type: 'evidence_reviewed';          data: { evidenceId: number; status: EvidenceStatus; notes?: string } }
  | { type: 'mentor_assigned';            data: { mentorId: string; mentorName: string } }
  | { type: 'mentor_unassigned';          data: { mentorId: string } }
  | { type: 'meeting_scheduled';          data: MentorMeeting & { mentorName: string } }
  | { type: 'meeting_cancelled';          data: { meetingId: number; mentorName: string } }
  | { type: 'smart_goal_commented';       data: { comment: string; commentedAt: string } }
  | { type: 'submission_reviewed';        data: { submissionId: number; status: SubmissionStatus; notes?: string } }
  | { type: 'new_program';               data: { programId: number; programName: string } }
  | { type: 'admin_stats_update';         data: AdminOverviewStats }  // admin only
  | { type: 'pong' }
  | { type: 'error';                      data: { code: string; message: string } }

// Sent by client → server
type ClientEvent =
  | { type: 'ping' }
  | { type: 'message_send';   data: { receiverId: string; content: string } }
  | { type: 'typing';         data: { receiverId: string } }
  | { type: 'mark_read';      data: { type: 'notification' | 'message'; id: number } }
  | { type: 'mark_all_read';  data: { type: 'notification' | 'message'; contactId?: string } }
```

### Where WebSockets Are Used

| Feature | Direction | Event |
|---|---|---|
| Application approved/rejected | Server → User | `application_status_changed` + `notification` |
| Evidence verified/rejected | Server → User | `evidence_reviewed` + `notification` |
| Mentor assigned | Server → User | `mentor_assigned` + `notification` |
| Mentor unassigned | Server → User | `mentor_unassigned` + `notification` |
| Meeting scheduled by mentor | Server → Mentee | `meeting_scheduled` + `notification` |
| Meeting cancelled | Server → Mentee | `meeting_cancelled` + `notification` |
| Admin comments on SMART Goal | Server → User | `smart_goal_commented` + `notification` |
| Submission reviewed | Server → User | `submission_reviewed` + `notification` |
| New program launched | Server → All Users | `new_program` + `notification` |
| New message | Server → Receiver | `new_message` + `notification` |
| Typing indicator | Client → Server → Receiver | `typing` |
| Mark message read | Client → Server | `mark_read` |
| Admin live dashboard | Server → Admins | `admin_stats_update` (every 30s or on mutation) |
| Heartbeat | Bidirectional | `ping` / `pong` |

### Heartbeat

The server pings all connections every **30 seconds** and closes connections that do not respond within 10 seconds. The client should send a `ping` every 25 seconds if no other message has been sent.

### Message Delivery via WebSocket

When a client sends `message_send`:
1. Server saves the `Message` to the database.
2. If the receiver is online, pushes `new_message` to them via `ConnectionRegistry.push()`.
3. If the receiver is offline, creates a `new_message` `Notification` in the database — they'll see it on next login via `GET /notifications/me`.
4. Returns the saved message back to the sender.

---

## 10. File Upload Architecture

### Principle

**The backend never receives file bytes.** Files go directly from the browser to Supabase Storage using a signed upload URL. The backend only handles metadata after the upload completes.

### Upload Flow

```
1. Client requests a signed upload URL from the backend
   POST /api/v1/storage/signed-upload-url
   Body: { bucket: "evidence", filename: "receipt.jpg", mimeType: "image/jpeg" }
   Response: { uploadUrl: "https://...", storagePath: "evidence/uuid-receipt.jpg" }

2. Client uploads the file directly to Supabase Storage using the signed URL
   PUT <uploadUrl> — file bytes go directly to Supabase, never through this server

3. Client registers the file with the backend
   POST /api/v1/evidence   (or /documents, /user-submissions, etc.)
   Body: { storagePath: "evidence/uuid-receipt.jpg", ... }
```

### Storage Endpoint

#### POST `/api/v1/storage/signed-upload-url`
Generates a signed upload URL for a specific bucket.

- **Auth:** Required
- **Body:**
  ```json
  {
    "bucket": "evidence",
    "filename": "receipt.jpg",
    "mimeType": "image/jpeg",
    "fileSize": 274200
  }
  ```
- **Validation:**
  - `bucket` must be one of the allowed buckets.
  - `mimeType` is validated against an allowlist per bucket.
  - `fileSize` is checked against per-bucket limits.
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "uploadUrl": "https://[project].supabase.co/storage/v1/object/...",
      "storagePath": "evidence/uuid-receipt.jpg",
      "expiresIn": 300
    }
  }
  ```

### Allowed File Types Per Bucket

| Bucket | Allowed Types | Max Size |
|---|---|---|
| `profiles` | image/jpeg, image/png, image/webp | 5 MB |
| `evidence` | image/*, application/pdf, video/mp4, video/quicktime, audio/mpeg, audio/wav, application/msword, application/vnd.openxmlformats-officedocument.*, text/plain, text/csv | 50 MB |
| `documents` | application/pdf, application/vnd.openxmlformats-officedocument.*, application/vnd.ms-powerpoint | 50 MB |
| `submissions` | application/pdf, application/vnd.openxmlformats-officedocument.*, application/msword, text/plain | 25 MB |
| `templates` | application/pdf, application/vnd.openxmlformats-officedocument.* | 25 MB |

### Download URLs

When returning records that include files, the backend generates **signed download URLs** via the Supabase Storage SDK (valid for 1 hour by default). Public buckets (`templates`) use public URLs instead.

---

## 11. Notification System

### Creating Notifications

A `NotificationService` in `src/services/notification.service.ts` is called from within route handlers and never directly in WebSocket handlers.

```ts
// src/services/notification.service.ts

async function createNotification(prisma: PrismaClient, registry: ConnectionRegistry, payload: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  // 1. Insert into notifications table
  const notification = await prisma.notification.create({ data: payload });

  // 2. If user is online, push via WebSocket immediately
  registry.push(payload.userId, {
    type: 'notification',
    data: notification
  });
}
```

### Notification Triggers

| Action | Triggered By | Recipient | Type |
|---|---|---|---|
| Application status → Approved | Admin | Applicant | `application_approved` |
| Application status → Rejected | Admin | Applicant | `application_rejected` |
| Application status → UnderReview | Admin | Applicant | `application_under_review` |
| Mentor assigned | Admin | Entrepreneur | `mentor_assigned` |
| Mentor unassigned | Admin | Entrepreneur | `mentor_unassigned` |
| Meeting scheduled | Mentor | Mentee | `meeting_scheduled` |
| Meeting cancelled | Mentor | Mentee | `meeting_cancelled` |
| Evidence → verified | Admin | Uploader | `evidence_verified` |
| Evidence → rejected | Admin | Uploader | `evidence_rejected` |
| Smart goal commented | Admin | User | `smart_goal_commented` |
| Market research commented | Admin | User | `market_research_commented` |
| User submission reviewed | Admin | User | `submission_reviewed` |
| New program created | Admin | All verified users | `new_program` |
| New message received (offline) | System | Receiver | `new_message` |

---

## 12. Data Migration Plan

The existing MySQL dump (`yhrqzzlw_flarehub.sql`) must be migrated to Supabase PostgreSQL. This is a one-time operation handled by `scripts/migrate-from-mysql.ts`.

### Step 1 — Supabase Auth User Import

For each row in the MySQL `users` table, call the **Supabase Auth Admin API** to create a Supabase Auth user.

**Critical — Password Hashes Are Directly Importable:**

The existing MySQL passwords are bcrypt hashes (e.g., `$2y$10$...`). Supabase Auth's `createUser` API accepts a `password_hash` field that stores the hash directly. This means **no user needs to reset their password** — they log in with the exact same password they used before.

```typescript
const { data, error } = await supabase.auth.admin.createUser({
  email:          row.email,
  password_hash:  row.password,   // the bcrypt hash from MySQL — imported as-is
  email_confirm:  true,           // mark email as already confirmed — no verification email sent
  user_metadata: {
    first_name: row.first_name,
    last_name:  row.last_name,
  }
});
const newUUID = data.user.id;     // Supabase generates the UUID
```

- Supabase will generate a new **UUID** for each user.
- Store the mapping `{ oldIntegerId: number → newUUID: string }` in memory for the rest of the script.
- `email_confirm: true` skips sending a verification email to all 221 users — their emails were already verified in the old system.

### Step 2 — PostgreSQL Schema

Run `prisma migrate deploy` against the Supabase database to create all tables.

### Step 3 — Data Import (in order)

Import tables in dependency order to satisfy foreign key constraints:

```
1. users              (using UUID map from Step 1)
2. programs
3. applications       (map user_id, program_id)
4. smart_goals        (map user_id, commented_by)
5. milestone_plans    (map user_id; flatten 35 columns → milestones JSON array)
6. market_research    (map user_id, commented_by)
7. documents          (map user_id; file paths → Supabase Storage paths after file upload)
8. evidence           (map user_id, program_id, verified_by)
9. admin_templates    (map created_by)
10. user_submissions  (map user_id, template_id)
11. business_plans    (map user_id; plan_data JSON is already JSON — direct copy)
12. mentor_mentees    (map mentor_id, mentee_id)
13. mentor_meetings   (map mentor_id, mentee_id)
14. mentor_notes      (map mentor_id, mentee_id)
15. messages          (map sender_id, receiver_id)
16. admin_logs        (map admin_id)
17. admin_settings    (direct copy)
```

### Step 4 — File Migration

For each file stored in `uploads/`, `submissions/`, `templates/`:
1. Read the file from the local filesystem.
2. Upload to the corresponding Supabase Storage bucket.
3. Update the `storagePath` column in the database to the new Supabase path.

### Step 5 — Verification

After migration, verify row counts match the source dump for every table.

### Schema Differences from MySQL

| MySQL | Supabase PostgreSQL |
|---|---|
| `INT AUTO_INCREMENT` primary keys | Kept for most tables; `users.id` becomes UUID |
| `ENUM(...)` types | Prisma maps to PostgreSQL native `ENUM` |
| `TINYINT(1)` booleans | PostgreSQL `BOOLEAN` |
| `JSON` columns | PostgreSQL `JSONB` |
| `milestone_plans` 35 flat columns | Collapsed to `milestones JSONB` |
| `business_plans.plan_data LONGTEXT` | `planData JSONB` |
| Separate `admins` table | Merged into `users` table via `role` column |
| `admin_sessions` table | Dropped — Supabase Auth handles sessions |
| `user` table (legacy, unused) | Dropped |

---

## 13. Security

### Authentication
- All protected endpoints require a valid Supabase JWT in the `Authorization: Bearer` header.
- JWTs are verified using the `SUPABASE_JWT_SECRET` — never trusted without verification.
- The `SUPABASE_SERVICE_ROLE_KEY` is used only server-side, never exposed to clients.

### Authorization
- Role checks happen in middleware before route handlers execute.
- Users can only access their own data. Foreign-key ownership checks happen inside route handlers.
- Mentors can only access data for mentees assigned to them (checked via `MentorMentee` join).

### Input Validation
- All request bodies are validated with **Zod** before reaching route handlers.
- File type validation uses MIME type allowlists — not just extension checks.
- File sizes are enforced both at the signed URL generation step and at the Supabase Storage level.

### Rate Limiting
- Global rate limit: 100 requests per 60 seconds per IP (`@fastify/rate-limit`).
- Auth-related endpoints: tighter limit of 10 requests per minute per IP.
- WebSocket connections: 5 concurrent connections per user.

### Security Headers
- `@fastify/helmet` adds `X-Frame-Options`, `X-Content-Type-Options`, `Content-Security-Policy`, `Referrer-Policy`, and `Strict-Transport-Security`.

### SQL Injection
- All database queries go through **Prisma's parameterized queries**. Raw SQL is never used.

### CORS
- Configured to allow only origins listed in `ALLOWED_ORIGINS`.
- Credentials (cookies) are not used — JWTs are in headers only.

### WebSocket Security
- JWT is verified on WebSocket connection. Unauthenticated connections are immediately closed.
- Message payloads are validated with Zod before processing.

---

## 14. Error Handling

### Global Error Handler

Fastify's `setErrorHandler` catches all unhandled errors and returns the standard error envelope:

```ts
fastify.setErrorHandler((error, request, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.flatten().fieldErrors
      }
    });
  }

  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {  // Unique constraint violation
      return reply.status(409).send({
        success: false,
        error: { code: 'CONFLICT', message: 'Resource already exists' }
      });
    }
    if (error.code === 'P2025') {  // Record not found
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Resource not found' }
      });
    }
  }

  // Unknown — log and return 500
  request.log.error(error);
  return reply.status(500).send({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
  });
});
```

### Application Errors

A custom `AppError` class is thrown from business logic:
```ts
throw new AppError('BUSINESS_RULE_VIOLATION', 'Program deadline has passed', 422);
```

---

## 15. Logging

Fastify uses **Pino** natively. All logs are structured JSON.

```ts
// Each request is automatically logged:
{
  "level": "info",
  "time": 1713168000000,
  "reqId": "req-1",
  "req": { "method": "POST", "url": "/api/v1/applications", "remoteAddress": "197.248.65.31" },
  "res": { "statusCode": 201 },
  "responseTime": 43.2
}
```

**In development:** `pino-pretty` for human-readable output.  
**In production:** Raw JSON piped to a log aggregation service (Logtail, Axiom, or similar).

Log levels:
- `info` — request/response, WebSocket connections
- `warn` — auth failures, rate limit hits, validation errors
- `error` — uncaught errors, DB errors, Storage errors
- `debug` — verbose (disabled in production)

---

## 16. Supabase Project Setup

This section documents every step that must be completed in the Supabase dashboard **before** the backend can run. These are one-time setup steps, not code.

### 16.1 — Create the Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Name it `flarehub`
3. Choose a strong database password — save it, you will need it for `DIRECT_URL`
4. Choose the region closest to your users (e.g., `eu-west-1` for Africa/Europe)

### 16.2 — Get Your Credentials

Navigate to **Project Settings → API** and copy:

| Variable | Where to Find It |
|---|---|
| `SUPABASE_URL` | Project URL field |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key (click reveal) |
| `SUPABASE_JWT_SECRET` | JWT Settings → JWT Secret (click reveal) |

Navigate to **Project Settings → Database** and copy:

| Variable | Where to Find It |
|---|---|
| `DATABASE_URL` | Connection Pooling section → Session mode → Connection string (append `?pgbouncer=true`) |
| `DIRECT_URL` | Connection String section → URI (the `db.*` host, not the pooler) |

### 16.3 — Create Storage Buckets

Go to **Storage** in the Supabase sidebar. Create these **5 buckets** with the exact names and visibility settings:

| Bucket Name | Visibility | Description |
|---|---|---|
| `documents` | **Private** | Business plan PDFs and pitch decks |
| `evidence` | **Private** | Evidence uploads (images, videos, docs) |
| `profiles` | **Private** | Profile pictures |
| `templates` | **Public** | Admin-uploaded templates (downloadable by all) |
| `submissions` | **Private** | User submissions against admin templates |

> **Why `templates` is public:** Template files (SMART Goals PDF, Milestone Plan PDF, etc.) are freely downloadable by any authenticated user. Using a public bucket means we can serve them as direct URLs without generating signed URLs on every request — simpler and faster.

For each **private** bucket, the backend accesses files using the `SUPABASE_SERVICE_ROLE_KEY` which bypasses all access checks. Signed URLs with short expiry (1 hour) are generated on demand for clients.

### 16.4 — Row Level Security (RLS) — Explicit Decision

**RLS is disabled on all tables in this project. This is intentional.**

Supabase enables RLS on tables by default when you use the Supabase client directly from the browser (anon key). In this architecture, **the browser never touches the database directly.** All database access goes through this Fastify backend using the `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS entirely.

Authorization is handled entirely by:
- The `requireAuth` middleware (JWT verification)
- The `requireAdmin`, `requireMentor` middlewares (role checks)
- Ownership checks inside each route handler (verifying `userId` matches `request.user.id`)

**Do not enable RLS.** If you add RLS policies without understanding this architecture, queries via the service role key will still bypass them, but it creates confusion and maintenance burden.

The only exception: if you ever add Supabase Realtime subscriptions directly from the frontend (not through this backend), you would need RLS policies. We do not use Supabase Realtime — we use our own WebSocket via Fastify.

### 16.5 — Supabase Auth Settings

In **Authentication → Settings**:

1. **Site URL** — set to your frontend URL (e.g., `http://localhost:5173` for development)
2. **Redirect URLs** — add `http://localhost:5173/**` for development
3. **Email confirmations** — can be disabled during development to speed up testing
4. **Password minimum length** — set to 8

### 16.6 — The `sync-user` Pattern vs Database Trigger

There are two ways to automatically create a `users` table row when a Supabase Auth user signs up:

**Option A (our implementation) — `POST /auth/sync-user` endpoint:**
The frontend calls this endpoint immediately after the first sign-in. The backend creates the `User` row from the JWT claims. Simple, explicit, easy to debug.

**Option B (alternative) — PostgreSQL trigger on `auth.users`:**
A database function that fires automatically whenever Supabase Auth creates a new user. More automatic but harder to debug, and runs with database-level permissions.

We use **Option A**. It is simpler, the error surface is smaller, and the frontend has full control over when the profile row is created.

---

## 17. Development Setup

### Prerequisites

- Node.js 20 LTS
- npm or pnpm
- A Supabase project (free tier is sufficient for development)

### Initial Setup

```bash
# 1. Clone the backend repo
git clone <repo>
cd flarehub-backend

# 2. Install dependencies
npm install

# 3. Copy the env template
cp .env.example .env
# Fill in your Supabase project credentials

# 4. Generate Prisma client
npx prisma generate

# 5. Push the schema to Supabase (first time)
npx prisma db push

# 6. (Optional) Run the seed script
npx tsx prisma/seed.ts

# 7. Start the dev server
npm run dev
```

### Scripts

```json
{
  "scripts": {
    "dev":         "tsx watch src/server.ts",
    "build":       "tsc --project tsconfig.json",
    "start":       "node dist/server.js",
    "db:generate": "prisma generate",
    "db:push":     "prisma db push",
    "db:migrate":  "prisma migrate deploy",
    "db:studio":   "prisma studio",
    "migrate:mysql": "tsx scripts/migrate-from-mysql.ts",
    "lint":        "eslint src --ext .ts",
    "typecheck":   "tsc --noEmit"
  }
}
```

### Key `tsconfig.json` Settings

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### Port Assignments

| Service | Port |
|---|---|
| Fastify backend | `3001` |
| Vite frontend (future) | `5173` |
| Supabase local (optional) | `54321` |
| Prisma Studio | `5555` |

---

---

## 18. Prisma ORM — Role, Advantages & How It Fits

### What Problem Prisma Solves

The old PHP app talks to MySQL with raw SQL strings:
```php
$stmt = $conn->prepare("SELECT * FROM users WHERE id = :id");
$stmt->bindParam(':id', $user_id, PDO::PARAM_INT);
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);
// $user is just an array — no type info, no autocomplete, no guarantees
```

There is no contract between the code and the database. If someone renames a column, the app breaks at runtime, not at compile time. There is no autocomplete, no type checking, no schema documentation — just strings.

**Prisma fixes this completely.** Your `schema.prisma` file is the single source of truth for your database structure. Prisma reads it and generates a fully typed TypeScript client. The database and your code are always in sync.

---

### Prisma's Role in This Project

Prisma serves three functions:

```
schema.prisma  ──►  1. Migration files (SQL Prisma generates and tracks)
                ──►  2. Prisma Client (TypeScript ORM, auto-generated)
                ──►  3. Prisma Studio (visual database browser)
```

**1. Migrations** — Prisma generates SQL migration files from your schema and tracks which ones have run via a `_prisma_migrations` table in PostgreSQL. You never write raw `CREATE TABLE` or `ALTER TABLE` SQL by hand.

**2. Prisma Client** — An auto-generated, type-safe query builder. Every query result has a TypeScript type that matches exactly what the database returns.

**3. Prisma Studio** — A visual browser for your database. Run `npx prisma studio` during development to browse and edit data without writing SQL.

---

### Concrete Advantages Over Raw SQL / PHP PDO Style

#### A — Full Type Safety

```typescript
// Prisma knows the exact return type
const user = await prisma.user.findUnique({
  where: { id: 'uuid' },
  select: { firstName: true, email: true, role: true }
});
// TypeScript knows: user is { firstName: string; email: string; role: UserRole } | null
// If you typo 'firsName' — TypeScript error at compile time, not runtime crash

// ✅ Include relations effortlessly
const application = await prisma.application.findUnique({
  where: { id: 83 },
  include: {
    user: { select: { firstName: true, email: true } },
    program: { select: { name: true } }
  }
});
// application.user.firstName → typed, autocompleted, guaranteed to exist
```

#### B — No SQL Injection by Design

All Prisma queries are parameterized internally. You cannot accidentally write a SQL injection vulnerability because you never write SQL strings.

```typescript
// ✅ Prisma — always safe
const users = await prisma.user.findMany({
  where: { county: req.query.county }  // safely parameterized
});

// ❌ The old way — injection risk if not careful
$stmt = $conn->prepare("SELECT * FROM users WHERE county = '" . $county . "'");
```

#### C — Migration Tracking

Prisma records every migration in the `_prisma_migrations` table. Every environment (local, staging, production) runs the exact same migrations in the exact same order. You can see at any time which migrations have been applied and which are pending.

```bash
npx prisma migrate status
# Shows:
# ✔  20260415120001_create_core_tables
# ✔  20260415120002_create_programs_applications
# ✗  20260416000001_add_blog_posts  ← pending, not yet applied
```

#### D — Schema as Documentation

`schema.prisma` replaces the need for a separate ERD document. Any developer opening the project immediately sees every table, every column, every relationship, and every index in one file with clear syntax.

#### E — Database Agnostic (Useful for Development)

The same `schema.prisma` works with PostgreSQL (Supabase production) and SQLite (fast local development without needing a Supabase connection). You change one line in `.env` and everything works.

#### F — Prisma Studio

```bash
npx prisma studio
# Opens http://localhost:5555
# Browse and edit every table visually — no pgAdmin setup needed
```

---

### The Migration Workflow

#### Development

```bash
# 1. Edit schema.prisma (add a column, create a table, etc.)
# 2. Create a named migration — Prisma generates the SQL for you
npx prisma migrate dev --name add_meeting_type_column

# Prisma:
# ✔ Generated migration file: prisma/migrations/20260416_add_meeting_type_column/migration.sql
# ✔ Applied migration to development database
# ✔ Regenerated Prisma Client
```

#### Production / CI

```bash
# Apply all pending migrations (never generates new ones)
npx prisma migrate deploy
```

---

## 19. Database Migration Strategy

### The Core Question

The MySQL dump (`yhrqzzlw_flarehub.sql`) is **1,777 lines** of MySQL-specific SQL. It cannot be run against PostgreSQL directly — different syntax, different types, different conventions. It is also not a clean schema — there are real structural problems (documented below) that should be fixed during migration.

**The strategy is:**

> **Do not migrate the SQL dump. Migrate the data.**

The SQL dump is **input data**, not a migration file. The Prisma schema is the new source of truth for structure. A one-time TypeScript migration script reads the raw MySQL data and imports it into the clean PostgreSQL schema.

This means:
- The new PostgreSQL schema is cleaner, better structured, and properly constrained
- All existing user data is preserved (no data is lost)
- Problems in the old schema are fixed during the import, not carried over
- Once done, the MySQL dump can be archived

---

### Problems Found in the MySQL Schema (and How We Fix Them)

These are real structural issues discovered in the dump that will **not** be carried into the new schema:

#### Problem 1 — `business_plans` Has No `user_id`

**Current:**
```sql
CREATE TABLE `business_plans` (
  `id` int NOT NULL,
  `plan_data` longtext NOT NULL,  -- no user_id!
  `created_at` timestamp,
  `updated_at` timestamp
)
```
The table has 4 rows with IDs 1, 2, 3, 4. There is no foreign key to `users`. It is impossible to know which user owns which plan without guessing.

**Fix:** Add `userId` as a unique foreign key. During migration, match rows by ID position (row 1 → user whose ID aligns, etc.) or treat existing rows as test/demo data and drop them (they appear to be dummy test data — business names are "f", "fdsf", empty strings).

---

#### Problem 2 — Two Separate User Tables

**Current:** `user` (legacy, `UNSIGNED INT` PK, 0 rows of data) and `users` (active, `INT` PK, all real data). The `blog_posts.author_id` references the legacy `user` table using an `UNSIGNED INT`.

**Fix:** Drop the `user` table entirely. It has zero data. Add `authorId` to `BlogPost` referencing `users`.

---

#### Problem 3 — Two Overlapping Admin Tables

**Current:** A separate `admins` table with its own `id`, `username`, `email`, `password`, `role`, and `status` — completely separate from `users`. Meanwhile, `users.is_admin = 1` is the actual way admin auth works. The `admins` table has only 1 row (a super admin whose email matches a user in the `users` table).

**Fix:** Consolidate into one `users` table with a `role` column (`entrepreneur`, `mentor`, `admin`, `super_admin`). The `admins` table is dropped. Admin auth uses Supabase Auth + the `role` column.

---

#### Problem 4 — Two Overlapping Admin Log Tables

**Current:** Both `admin_activity_log` (references `admins.id`) and `admin_logs` (references `users.id`) track admin actions with overlapping purposes.

**Fix:** Merge into one `admin_logs` table that references `users.id`. The `admin_activity_log` references are remapped.

---

#### Problem 5 — `applications` Missing Unique Constraint

**Current:** No `UNIQUE(user_id, program_id)` constraint. A user could (in theory) apply to the same program multiple times.

**Fix:** The new schema has `@@unique([userId, programId])`. During migration, duplicates (same user, same program) are deduplicated — keep the most recent one.

---

#### Problem 6 — `milestone_plans` Has 35 Flat Columns

**Current:** `milestone1_title`, `milestone1_timeline`, `milestone1_budget`, `milestone1_goal`, `milestone1_tasks`, `milestone1_evidence`, `milestone1_metrics`, ... repeated ×5. That's 35 columns for what is conceptually a list of 5 structured objects.

**Fix:** Store as `milestones JSONB` — an array of 5 milestone objects. Same data, fraction of the columns, infinitely more maintainable.

During migration, the 35 columns are read and collapsed into JSON:
```typescript
const milestones = [1, 2, 3, 4, 5].map(n => ({
  number: n,
  title:    row[`milestone${n}_title`],
  timeline: row[`milestone${n}_timeline`],
  budget:   row[`milestone${n}_budget`],
  goal:     row[`milestone${n}_goal`],
  tasks:    row[`milestone${n}_tasks`],
  evidence: row[`milestone${n}_evidence`],
  metrics:  JSON.parse(row[`milestone${n}_metrics`] || '[]'),
}));
```

---

#### Problem 7 — Auth Columns No Longer Needed

**Current:** `users` has `password` (bcrypt hash), `verification_token`, `email_verified` — all managed by the old PHP session system.

**Fix:** These columns are dropped. Supabase Auth owns all of this. The `password` column is never imported into the new schema — Supabase Auth handles passwords separately through its own user import flow.

---

#### Problem 8 — `admin_sessions` Table Is Obsolete

**Current:** A custom session token table for PHP-based admin sessions.

**Fix:** Dropped entirely. Supabase Auth handles sessions via JWTs.

---

#### Problem 9 — Missing Indexes on Key Query Columns

**Current:**
- `programs` — no index on `status` or `application_deadline`
- `applications` — no index on `status`
- `messages` — no compound index on `(sender_id, receiver_id)` for conversation thread queries
- `documents` — only a `user_id` index, missing `status` and `document_category`

**Fix:** All indexes are defined in the Prisma schema (`@@index`) and created by the migrations.

---

#### Problem 10 — `testimonials.approved_by` and `blog_posts.author_id` Have No FK

**Current:** Both reference user IDs but have no `FOREIGN KEY` constraint defined — orphaned references possible.

**Fix:** Both are properly defined with `@relation` in Prisma, enforcing the FK at the database level.

---

### Migration File Structure (Prisma)

Rather than one giant migration, the schema is built incrementally across **8 logically named migration files**. Each migration is a separate `prisma migrate dev` run with a descriptive name. Prisma generates the SQL; we never write it by hand.

```
prisma/migrations/
│
├── 20260415_001_create_enums_and_users/
│   └── migration.sql
│   # Creates: all ENUM types, users table
│   # This is first because every other table has a FK to users
│
├── 20260415_002_create_programs_and_applications/
│   └── migration.sql
│   # Creates: programs, applications (with UNIQUE constraint)
│
├── 20260415_003_create_submissions/
│   └── migration.sql
│   # Creates: smart_goals, milestone_plans (JSONB), market_research
│   # All have @@unique([userId]) — one per user
│
├── 20260415_004_create_file_management/
│   └── migration.sql
│   # Creates: documents, evidence, admin_templates,
│   #          user_submissions, business_plans
│
├── 20260415_005_create_mentor_system/
│   └── migration.sql
│   # Creates: mentor_mentees (UNIQUE pair), mentor_meetings, mentor_notes
│
├── 20260415_006_create_communication/
│   └── migration.sql
│   # Creates: messages, notifications
│
├── 20260415_007_create_content/
│   └── migration.sql
│   # Creates: blog_posts, testimonials
│   # blog_posts.author_id now correctly references users
│
└── 20260415_008_create_admin_tools/
    └── migration.sql
    # Creates: admin_logs (merged from admin_logs + admin_activity_log),
    #          admin_settings
```

Each migration file is committed to git. The history is the audit trail of every schema change ever made to the database.

---

### What Each Migration File Contains (Generated SQL Preview)

Prisma generates standard PostgreSQL DDL. This is what migration `001` looks like — you do not write this; Prisma writes it from your schema:

```sql
-- prisma/migrations/20260415_001_create_enums_and_users/migration.sql
-- Generated by Prisma from schema.prisma

CREATE TYPE "UserRole" AS ENUM ('entrepreneur', 'mentor', 'admin', 'super_admin');
CREATE TYPE "Gender" AS ENUM ('Male', 'Female', 'Other', 'Unknown');
CREATE TYPE "BusinessStage" AS ENUM ('Idea', 'Prototype', 'MVP', 'Revenue');

CREATE TABLE "users" (
    "id"                  TEXT NOT NULL,          -- UUID from Supabase Auth
    "email"               TEXT NOT NULL,
    "firstName"           TEXT NOT NULL,
    "lastName"            TEXT NOT NULL,
    "gender"              "Gender" NOT NULL DEFAULT 'Unknown',
    "phone"               TEXT,
    "county"              TEXT,
    "profilePic"          TEXT,
    "businessName"        TEXT,
    "businessStage"       "BusinessStage",
    "businessDescription" TEXT,
    "role"                "UserRole" NOT NULL DEFAULT 'entrepreneur',
    "isMentor"            BOOLEAN NOT NULL DEFAULT false,
    "isVerified"          BOOLEAN NOT NULL DEFAULT false,
    "profileComplete"     BOOLEAN NOT NULL DEFAULT false,
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
```

---

### The Data Migration Script

After all 8 Prisma migrations have been applied and the clean schema exists in Supabase, the data migration script runs **once**. It reads from the MySQL dump (parsed as a JS object by a MySQL dump parser library), transforms the data, and inserts into the new schema via Prisma Client.

```
scripts/
└── migrate-from-mysql.ts    # One-time script, run manually, never again
```

**Script execution order** (must respect FK dependencies):

```typescript
// scripts/migrate-from-mysql.ts  — pseudocode overview

async function run() {
  // ── STEP 1: Parse the MySQL dump ──────────────────────────────────
  const dump = await parseMySQLDump('./yhrqzzlw_flarehub.sql');
  // dump.users, dump.programs, dump.applications, etc.

  // ── STEP 2: Create Supabase Auth users + build ID map ─────────────
  const idMap = new Map<number, string>(); // oldIntId → newUUID

  for (const row of dump.users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email:         row.email,
      password_hash: row.password,    // import bcrypt hash directly — no password reset needed
      email_confirm: true,            // skip re-verification — already verified in old system
      user_metadata: {
        first_name: row.first_name,
        last_name:  row.last_name,
      },
    });
    if (error) {
      console.warn(`⚠ Failed to create auth user ${row.email}: ${error.message}`);
      continue;
    }
    idMap.set(row.id, data.user.id);
  }

  // ── STEP 3: Insert users into our users table ──────────────────────
  for (const row of dump.users) {
    const uuid = idMap.get(row.id)!;
    const role = row.is_admin ? 'admin' : 'entrepreneur';
    await prisma.user.create({
      data: {
        id:                 uuid,
        email:              row.email,
        firstName:          row.first_name,
        lastName:           row.last_name,
        gender:             row.gender ?? 'Unknown',
        phone:              row.phone,
        county:             row.county,
        profilePic:         row.profile_pic || null,
        businessName:       row.business_name,
        businessStage:      row.business_stage,
        businessDescription: row.business_description,
        role:               role,
        isMentor:           row.is_mentor === 1,
        isVerified:         row.is_verified === 1,
        profileComplete:    row.profile_complete === 1,
        createdAt:          new Date(row.created_at),
      }
    });
  }

  // ── STEP 4: Programs ───────────────────────────────────────────────
  const programIdMap = new Map<number, number>();
  for (const row of dump.programs) {
    const prog = await prisma.program.create({
      data: {
        name:               row.name,
        description:        row.description,
        applicationDeadline: row.application_deadline ? new Date(row.application_deadline) : null,
        status:             row.status,
        createdAt:          new Date(row.created_at),
      }
    });
    programIdMap.set(row.id, prog.id);
  }

  // ── STEP 5: Applications ───────────────────────────────────────────
  // Deduplicate: if same user applied to same program twice, keep latest
  const seen = new Set<string>();
  const deduped = dump.applications
    .sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())
    .filter(row => {
      const key = `${row.user_id}-${row.program_id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  for (const row of deduped) {
    const userId    = idMap.get(row.user_id);
    const programId = programIdMap.get(row.program_id);
    if (!userId || !programId) continue; // skip orphaned rows

    await prisma.application.create({
      data: {
        userId,
        programId,
        status:    row.status.replace(' ', '') as ApplicationStatus,
        appliedAt: new Date(row.applied_at),
      }
    });
  }

  // ── STEP 6: Smart Goals ────────────────────────────────────────────
  for (const row of dump.smart_goals) {
    const userId = idMap.get(row.user_id);
    if (!userId) continue;
    await prisma.smartGoal.create({
      data: {
        userId,
        goalStatement: row.goal_statement,
        specific:      row.specific,
        measurable:    row.measurable,
        achievable:    row.achievable,
        relevant:      row.relevant,
        timebound:     row.timebound,
        adminComment:  row.admin_comment,
        commentedAt:   row.commented_at ? new Date(row.commented_at) : null,
        commentedById: row.commented_by ? idMap.get(row.commented_by) : null,
        createdAt:     new Date(row.created_at),
      }
    });
  }

  // ── STEP 7: Milestone Plans (flatten 35 cols → JSONB) ─────────────
  for (const row of dump.milestone_plans) {
    const userId = idMap.get(row.user_id);
    if (!userId) continue;

    const milestones = [1, 2, 3, 4, 5].map(n => ({
      number:   n,
      title:    row[`milestone${n}_title`]    ?? '',
      timeline: row[`milestone${n}_timeline`] ?? '',
      budget:   row[`milestone${n}_budget`]   ?? '',
      goal:     row[`milestone${n}_goal`]     ?? '',
      tasks:    row[`milestone${n}_tasks`]    ?? '',
      evidence: row[`milestone${n}_evidence`] ?? '',
      metrics:  safeParseJSON(row[`milestone${n}_metrics`], []),
    }));

    await prisma.milestonePlan.create({
      data: {
        userId,
        businessName:         row.business_name,
        grantAmount:          row.grant_amount,
        implementationPeriod: row.implementation_period,
        stage:                row.stage,
        milestones,
        createdAt:            new Date(row.created_at),
      }
    });
  }

  // ── STEP 8: Market Research ────────────────────────────────────────
  for (const row of dump.market_research) {
    const userId = idMap.get(row.user_id);
    if (!userId) continue;
    await prisma.marketResearch.create({
      data: {
        userId,
        businessName:        row.business_name,
        surveyDate:          row.survey_date ? new Date(row.survey_date) : null,
        sampleSize:          row.sample_size,
        topChallenges:       safeParseJSON(row.top_challenges, []),
        nextSteps:           safeParseJSON(row.next_steps, []),
        // ... all other fields mapped directly
        adminComment:        row.admin_comment,
        commentedById:       row.commented_by ? idMap.get(row.commented_by) : null,
        createdAt:           new Date(row.created_at),
      }
    });
  }

  // ── STEP 9: Documents ──────────────────────────────────────────────
  for (const row of dump.documents) {
    const userId = idMap.get(row.user_id);
    if (!userId) continue;
    await prisma.document.create({
      data: {
        userId,
        filename:         row.filename,
        originalName:     row.original_name,
        storagePath:      `documents/${row.filename}`, // will be updated after file migration
        fileSize:         row.file_size,
        fileType:         row.file_type,
        status:           row.status as DocumentStatus,
        documentCategory: row.document_category as DocumentCategory,
        description:      row.description,
        priority:         (row.priority ?? 'medium') as Priority,
        uploadedAt:       new Date(row.uploaded_at),
      }
    });
  }

  // ── STEP 10: Evidence ──────────────────────────────────────────────
  for (const row of dump.evidence) {
    const userId      = idMap.get(row.user_id);
    const programId   = row.program_id ? programIdMap.get(row.program_id) : null;
    const verifiedById = row.verified_by ? idMap.get(row.verified_by) : null;
    if (!userId) continue;

    await prisma.evidence.create({
      data: {
        userId,
        programId:       programId ?? null,
        milestoneNumber: row.milestone_number,
        fileName:        row.file_name,
        storagePath:     `evidence/${row.file_path.split('/').pop()}`,
        fileType:        row.file_type,
        fileSize:        BigInt(row.file_size),
        mimeType:        row.mime_type,
        description:     row.description,
        category:        row.category,
        status:          row.status as EvidenceStatus,
        verifiedById:    verifiedById ?? null,
        verifiedAt:      row.verified_at ? new Date(row.verified_at) : null,
        notes:           row.notes,
        uploadDate:      new Date(row.upload_date),
      }
    });
  }

  // ── STEP 11: Admin Templates ───────────────────────────────────────
  const templateIdMap = new Map<number, number>();
  for (const row of dump.admin_templates) {
    const createdById = idMap.get(row.created_by);
    if (!createdById) continue;
    const tmpl = await prisma.adminTemplate.create({
      data: {
        title:        row.title,
        description:  row.description,
        filename:     row.filename,
        originalName: row.original_name,
        storagePath:  `templates/${row.filename}`,
        fileSize:     row.file_size,
        fileType:     row.file_type,
        templateType: row.template_type as TemplateType,
        isActive:     row.is_active === 1,
        createdById,
        createdAt:    new Date(row.created_at),
      }
    });
    templateIdMap.set(row.id, tmpl.id);
  }

  // ── STEP 12: User Submissions ──────────────────────────────────────
  for (const row of dump.user_submissions) {
    const userId     = idMap.get(row.user_id);
    const templateId = templateIdMap.get(row.template_id);
    if (!userId || !templateId) continue;

    await prisma.userSubmission.create({
      data: {
        templateId,
        userId,
        submissionName: row.submission_name,
        filename:       row.filename,
        originalName:   row.original_name,
        storagePath:    `submissions/${row.filename}`,
        fileSize:       row.file_size,
        fileType:       row.file_type,
        status:         row.status.replace(' ', '') as SubmissionStatus,
        notes:          row.notes,
        submittedAt:    new Date(row.submitted_at),
      }
    });
  }

  // ── STEP 13: Mentor assignments ────────────────────────────────────
  for (const row of dump.mentor_mentees) {
    const mentorId = idMap.get(row.mentor_id);
    const menteeId = idMap.get(row.mentee_id);
    if (!mentorId || !menteeId) continue;
    await prisma.mentorMentee.create({ data: { mentorId, menteeId } });
  }

  // ── STEP 14: Mentor meetings ───────────────────────────────────────
  for (const row of dump.mentor_meetings) {
    const mentorId = idMap.get(row.mentor_id);
    const menteeId = idMap.get(row.mentee_id);
    if (!mentorId || !menteeId) continue;
    await prisma.mentorMeeting.create({
      data: {
        mentorId, menteeId,
        meetingTime: new Date(row.meeting_time),
        status:      row.status as MeetingStatus,
        notes:       row.notes,
        createdAt:   new Date(row.created_at),
      }
    });
  }

  // ── STEP 15: Mentor notes ──────────────────────────────────────────
  for (const row of dump.mentor_notes) {
    const mentorId = idMap.get(row.mentor_id);
    const menteeId = idMap.get(row.mentee_id);
    if (!mentorId || !menteeId) continue;
    await prisma.mentorNote.create({
      data: { mentorId, menteeId, content: row.note, createdAt: new Date(row.created_at) }
    });
  }

  // ── STEP 16: Messages ──────────────────────────────────────────────
  for (const row of dump.messages) {
    const senderId   = idMap.get(row.sender_id);
    const receiverId = idMap.get(row.receiver_id);
    if (!senderId || !receiverId) continue;
    await prisma.message.create({
      data: {
        senderId, receiverId,
        content:   row.message,
        isRead:    row.seen === 1,
        createdAt: new Date(row.sent_at),
      }
    });
  }

  // ── STEP 17: Admin logs (merged from two tables) ───────────────────
  for (const row of dump.admin_logs) {
    const adminId = idMap.get(row.admin_id);
    if (!adminId) continue;
    await prisma.adminLog.create({
      data: {
        adminId,
        action:    row.action,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        createdAt: new Date(row.created_at),
      }
    });
  }

  // ── STEP 18: Admin settings ────────────────────────────────────────
  for (const row of dump.admin_settings) {
    await prisma.adminSetting.create({
      data: {
        settingKey:   row.setting_key,
        settingValue: row.setting_value,
        description:  row.description,
      }
    });
  }

  // ── STEP 19: blog_posts and testimonials ───────────────────────────
  for (const row of dump.blog_posts) {
    const authorId = row.author_id ? idMap.get(row.author_id) : null;
    await prisma.blogPost.create({
      data: {
        heading:   row.heading,
        content:   row.content,
        image:     row.image,
        status:    row.status,
        views:     row.views ?? 0,
        slug:      row.slug,
        authorId:  authorId ?? null,
        createdAt: new Date(row.created_at),
      }
    });
  }

  for (const row of dump.testimonials) {
    await prisma.testimonial.create({
      data: {
        name:       row.name,
        story:      row.story,
        imageUrl:   row.image_url,
        email:      row.email,
        location:   row.location,
        isApproved: row.is_approved === 1,
        isFeatured: row.is_featured === 1,
        createdAt:  new Date(row.created_at),
      }
    });
  }

  console.log('✅ Migration complete');
  console.log(`   Users migrated:        ${dump.users.length}`);
  console.log(`   Applications migrated: ${deduped.length}`);
  console.log(`   Smart goals:           ${dump.smart_goals.length}`);
  console.log(`   Milestone plans:       ${dump.milestone_plans.length}`);
  console.log(`   Market research:       ${dump.market_research.length}`);
  console.log(`   Documents:             ${dump.documents.length}`);
  console.log(`   Evidence files:        ${dump.evidence.length}`);
  console.log(`   Messages:              ${dump.messages.length}`);
}
```

---

### File Migration (After Data Migration)

After the data migration completes, the physical files in `uploads/`, `submissions/`, and `templates/` must be uploaded to Supabase Storage. A separate script handles this:

```
scripts/
└── migrate-files-to-storage.ts
```

**It does:**
1. Reads each file from the local filesystem
2. Uploads it to the correct Supabase Storage bucket
3. Updates the `storagePath` column in the database to the new Supabase path
4. Logs any missing files (some entries in the DB reference files that no longer exist on disk)

---

### Migration Verification Checklist

Run these queries after migration to confirm data integrity:

```sql
-- 1. User count must match
SELECT COUNT(*) FROM users;                                        -- must equal MySQL users count

-- 2. No application duplicates
SELECT user_id, program_id, COUNT(*) as c
FROM applications
GROUP BY user_id, program_id
HAVING c > 1;                                                      -- must return 0 rows

-- 3. No orphaned applications
SELECT COUNT(*) FROM applications a
LEFT JOIN users u ON a.user_id = u.id
WHERE u.id IS NULL;                                                -- must be 0

-- 4. Milestone plans have correct JSON structure
SELECT COUNT(*) FROM milestone_plans
WHERE jsonb_array_length(milestones) != 5;                         -- must be 0

-- 5. All evidence rows have valid user references
SELECT COUNT(*) FROM evidence e
LEFT JOIN users u ON e.user_id = u.id
WHERE u.id IS NULL;                                                -- must be 0

-- 6. Admin users exist with correct role
SELECT id, email, role FROM users WHERE role IN ('admin', 'super_admin');
```

---

### Summary — What You Gain From This Approach

| Old MySQL Schema | New Supabase PostgreSQL Schema |
|---|---|
| Raw SQL strings, no type safety | Prisma Client — fully typed in TypeScript |
| No migration tracking | `_prisma_migrations` table — full history |
| 35-column milestone_plans | `milestones JSONB` — clean, maintainable |
| Two user tables (`user`, `users`) | One `users` table |
| Two admin systems (`admins` + `is_admin`) | One `role` column on `users` |
| Two log tables | One `admin_logs` table |
| `business_plans` with no `user_id` | `business_plans` with `@unique userId` |
| Missing unique constraint on applications | `@@unique([userId, programId])` enforced |
| Passwords stored in DB | Supabase Auth owns all credentials |
| No FK on `blog_posts.author_id` | Enforced FK with `@relation` |
| Missing indexes on critical query columns | All indexes defined in schema |
| MySQL-only syntax | Standard PostgreSQL — portable, compatible with Supabase |

*End of Flarehub Backend Design Specification*
