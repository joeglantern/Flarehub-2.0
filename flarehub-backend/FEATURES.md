# Flarehub Backend — Features

This file tracks all features added beyond the initial build. Each entry includes the feature name, what it does, the relevant files, and the API endpoints it adds or modifies.

---

## 1. Email Notifications (Resend)

**Status:** ✅ Complete  
**Package:** `resend`  
**Service:** `src/services/email.service.ts`

Sends transactional emails to users when key events happen. Hooks into the same triggers as in-app notifications. Uses Resend as the email provider.

**Triggers:**
| Event | Recipient | Subject |
|---|---|---|
| Application approved | Applicant | "Your application has been approved" |
| Application rejected | Applicant | "Update on your application" |
| Application under review | Applicant | "Your application is under review" |
| Mentor assigned | Entrepreneur | "You've been assigned a mentor" |
| Meeting scheduled | Mentee | "New meeting scheduled" |
| Evidence verified | Uploader | "Your evidence has been verified" |
| Evidence rejected | Uploader | "Action required on your evidence" |
| New program | All verified users | "New program available" |

**Env vars added:**
```
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@flarehub.org
```

---

## 2. Africa's Talking SMS

**Status:** ✅ Complete  
**Package:** `africastalking`  
**Service:** `src/services/sms.service.ts`

Sends SMS to Kenyan phone numbers on critical events. Falls back silently if phone number is missing or send fails.

**Triggers:**
- Application approved/rejected
- Mentor assigned
- Meeting scheduled/cancelled

**Env vars added:**
```
AT_API_KEY=...
AT_USERNAME=...
AT_SENDER_ID=FLAREHUB
```

---

## 3. Stricter Auth Rate Limiting

**Status:** ✅ Complete  
**Files modified:** `src/routes/auth/index.ts`

Auth endpoints (`/auth/sync-user`) are rate-limited to **10 requests per minute per IP** — separate from the global 100 req/min limit.

---

## 4. Swagger / OpenAPI Docs

**Status:** ✅ Complete  
**Packages:** `@fastify/swagger`, `@fastify/swagger-ui`  
**URL:** `http://localhost:3001/docs`

Auto-generated interactive API documentation. All routes are documented with request/response schemas.

---

## 5. Application Scoring / Rubric

**Status:** ✅ Complete  
**Model:** `ApplicationScore` (added to `prisma/schema.prisma`)  
**Routes:** `src/routes/applications/scoring.ts`

Admins can score applications across multiple criteria before making an approve/reject decision.

**Schema:**
```
ApplicationScore {
  id, applicationId, adminId
  innovation (1–10), feasibility (1–10), impact (1–10)
  teamStrength (1–10), marketPotential (1–10)
  totalScore (computed), notes, createdAt, updatedAt
}
```

**Endpoints added:**
```
POST   /api/v1/applications/:id/score    — admin submits/updates score
GET    /api/v1/applications/:id/score    — get score for an application
GET    /api/v1/admin/scores              — list all scored applications (paginated)
```

---

## 6. Announcements System

**Status:** ✅ Complete  
**Model:** `Announcement` (added to `prisma/schema.prisma`)  
**Routes:** `src/routes/announcements/index.ts`

Admins post platform-wide announcements. Users can list and mark them as read.

**Schema:**
```
Announcement {
  id, title, body, isPinned, isActive
  targetRole (all | entrepreneur | mentor)
  createdById, createdAt, updatedAt
}
```

**Endpoints added:**
```
GET    /api/v1/announcements             — list active (auth required, filtered by role)
POST   /api/v1/admin/announcements       — create announcement (admin)
PATCH  /api/v1/admin/announcements/:id   — update (admin)
DELETE /api/v1/admin/announcements/:id   — delete (admin)
```

**WebSocket event added:**
```
{ type: 'new_announcement', data: { id, title, body } }
```

---

## 7. Redis Caching for Analytics

**Status:** ✅ Complete  
**Package:** `ioredis`  
**Service:** `src/services/cache.service.ts`

Analytics endpoints are cached in Redis for 5 minutes (300s). Cache is invalidated when relevant data changes (new application, new user, etc.).

**Cached endpoints:**
- `GET /admin/analytics/overview` — 5 min TTL
- `GET /admin/analytics/applications-by-month` — 5 min TTL
- `GET /admin/analytics/gender-distribution` — 10 min TTL
- `GET /admin/analytics/county-distribution` — 10 min TTL
- `GET /admin/analytics/submission-completion` — 5 min TTL

**Env vars added:**
```
REDIS_URL=redis://localhost:6379
```

---

## 8. Cohort / Program Progress Tracking

**Status:** ✅ Complete  
**Routes added to:** `src/routes/admin/analytics.ts`

Shows per-program breakdown of how many approved participants have completed each submission type.

**Endpoint added:**
```
GET /api/v1/admin/analytics/program-progress/:programId
```

**Response:**
```json
{
  "programId": 1,
  "programName": "Be Green Incubation",
  "approvedParticipants": 82,
  "submissions": {
    "smartGoals":     { "submitted": 12, "notSubmitted": 70, "rate": 14.6 },
    "milestonePlans": { "submitted": 9,  "notSubmitted": 73, "rate": 11.0 },
    "marketResearch": { "submitted": 10, "notSubmitted": 72, "rate": 12.2 }
  },
  "evidence": { "total": 34, "verified": 30, "pending": 3, "rejected": 1 }
}
```

---

## 9. PDF Report Generation

**Status:** ✅ Complete  
**Package:** `pdfkit`  
**Service:** `src/services/pdf.service.ts`  
**Routes:** `src/routes/reports/index.ts`

Generates downloadable PDF reports for entrepreneurs and admins.

**Endpoints added:**
```
GET /api/v1/reports/entrepreneur/:userId    — full entrepreneur profile PDF (admin or own)
GET /api/v1/reports/program/:programId      — program summary PDF (admin)
```

**Entrepreneur PDF includes:**
- Profile info
- Application status per program
- Smart Goals, Milestone Plan, Market Research content
- Evidence summary (count by status)
- Business plan summary

---

## 11. User Audit Trail

**Status:** ✅ Complete  
**Routes added to:** `src/routes/users/index.ts`

Users can see their own activity history. Admins can see any user's history.

**Endpoint added:**
```
GET /api/v1/users/me/activity     — own activity (submissions, applications, uploads)
GET /api/v1/admin/users/:id/activity — full activity for any user (admin)
```

**Activity includes:**
- Applications submitted and status changes
- Submissions created/updated
- Evidence uploads
- Documents uploaded
- Business plan saves
