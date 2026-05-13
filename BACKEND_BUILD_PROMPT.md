# Flarehub Backend — Build Prompt for Claude Code

## Your Mission

You are building the complete production-ready backend for **Flarehub**, a youth entrepreneurship program management platform. Every architectural decision, every endpoint, every schema model, and every file has already been designed. Your job is to implement it exactly as specified — no improvisation, no skipping sections, no "you can add this later." Build it completely, correctly, and in the right order the first time.

## Mandatory Reference

**Read this file before writing a single line of code and refer back to it constantly:**

```
BACKEND_DESIGN.md  (located in the same directory as this file)
```

That document is the single source of truth. It contains:
- The complete Prisma schema (Section 5)
- Every API endpoint with exact request/response shapes (Section 8)
- The WebSocket design with typed events (Section 9)
- The file upload architecture (Section 10)
- The notification system (Section 11)
- Security requirements (Section 13)
- Error handling conventions (Section 14)
- The Prisma ORM explanation and migration strategy (Sections 17–18)

Do not deviate from it. If something in this prompt conflicts with the design doc, the design doc wins.

---

## Project Location

Create the backend in a **new folder** inside this directory:

```
C:\Users\liban\OneDrive\Desktop\Projects\Flarehub Rebuild\flarehub-backend\
```

All commands and file paths below are relative to `flarehub-backend/` unless stated otherwise.

---

## Phase 0 — Supabase Project Setup (Do This First)

Before writing a single line of code, the Supabase project must be configured. These are one-time manual steps in the Supabase dashboard.

### Step 0.1 — Storage Buckets

Go to **Supabase Dashboard → Storage** and create these exact 5 buckets:

| Bucket Name | Visibility | Reason |
|---|---|---|
| `documents` | **Private** | Business plan PDFs |
| `evidence` | **Private** | Evidence uploads |
| `profiles` | **Private** | Profile pictures |
| `templates` | **Public** | Template files are freely downloadable — public bucket avoids generating signed URLs per request |
| `submissions` | **Private** | User file submissions |

### Step 0.2 — Auth Settings

In **Authentication → Settings**:
- Set **Site URL** to `http://localhost:5173`
- Add `http://localhost:5173/**` to **Redirect URLs**
- Set password minimum length to **8**

### Step 0.3 — Row Level Security (RLS)

**Leave RLS disabled on all tables.** This is an intentional architecture decision.

This backend accesses the database exclusively via the `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS entirely. All authorization is handled by Fastify middleware (`requireAuth`, `requireAdmin`, `requireMentor`) and ownership checks inside route handlers. Do not add RLS policies — they will create confusion and have no effect on this backend's queries.

### Step 0.4 — Retrieve Credentials

Fill in `.env` with values from:
- **Project Settings → API** → Project URL, `service_role` key, JWT Secret
- **Project Settings → Database → Connection Pooling** → Session mode URI (append `?pgbouncer=true`) → this is your `DATABASE_URL`
- **Project Settings → Database → Connection String** → URI tab (db.*.supabase.co host) → this is your `DIRECT_URL`

---

## Phase 1 — Project Scaffold

### Step 1.1 — Initialize the Project

```bash
mkdir flarehub-backend
cd flarehub-backend
npm init -y
```

### Step 1.2 — Install All Dependencies

Install these exact packages. Do not add extras. Do not skip any.

```bash
# Runtime dependencies
npm install fastify @fastify/cors @fastify/helmet @fastify/rate-limit @fastify/websocket @fastify/multipart
npm install @prisma/client @supabase/supabase-js
npm install zod jsonwebtoken fast-csv
npm install dotenv

# Dev dependencies
npm install -D typescript tsx @types/node @types/jsonwebtoken
npm install -D prisma
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D pino-pretty
```

### Step 1.3 — Create `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*", "prisma/seed.ts", "scripts/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 1.4 — Create `package.json` Scripts

Replace the scripts section of `package.json` with:

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc --project tsconfig.json",
    "start": "node dist/server.js",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate:dev": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    "migrate:mysql": "tsx scripts/migrate-from-mysql.ts",
    "migrate:files": "tsx scripts/migrate-files-to-storage.ts",
    "lint": "eslint src --ext .ts",
    "typecheck": "tsc --noEmit"
  },
  "type": "module"
}
```

### Step 1.5 — Create `.env.example`

```env
# Server
PORT=3001
NODE_ENV=development
API_PREFIX=/api/v1
ALLOWED_ORIGINS=http://localhost:5173

# ── Database ─────────────────────────────────────────────────────────────────
# TWO separate Supabase database URLs are required. Never use the same value.
#
# DATABASE_URL → Connection Pooler (Session mode)
#   Supabase Dashboard → Project Settings → Database → Connection Pooling
#   Copy the "Session mode" URI and append ?pgbouncer=true
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?pgbouncer=true
#
# DIRECT_URL → Direct connection (no pooler)
#   Supabase Dashboard → Project Settings → Database → Connection String (URI tab)
#   This is the db.*.supabase.co host — used by prisma migrate only
DIRECT_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Supabase — find all of these in Project Settings → API
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
SUPABASE_JWT_SECRET=[jwt-secret]

# Storage Buckets — must be created in Supabase Storage before running the app
# See Phase 0 (Supabase Setup) below for creation instructions
STORAGE_BUCKET_DOCUMENTS=documents
STORAGE_BUCKET_EVIDENCE=evidence
STORAGE_BUCKET_PROFILES=profiles
STORAGE_BUCKET_TEMPLATES=templates
STORAGE_BUCKET_SUBMISSIONS=submissions

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
```

Copy `.env.example` to `.env` and leave it for the user to fill in.

---

## Phase 2 — Create the Full Directory Structure

Create every folder and placeholder file now so the structure is established before any implementation. Use the exact structure from Section 3 of the design doc:

```
src/
  config/
    index.ts
  plugins/
    prisma.ts
    supabase.ts
    auth.ts
    websocket.ts
    cors.ts
    helmet.ts
    rate-limit.ts
  middleware/
    require-auth.ts
    require-admin.ts
    require-mentor.ts
    require-super-admin.ts
  routes/
    index.ts
    auth/
      index.ts
    users/
      index.ts
    programs/
      index.ts
    applications/
      index.ts
    submissions/
      smart-goals.ts
      milestone-plans.ts
      market-research.ts
    documents/
      index.ts
    evidence/
      index.ts
    templates/
      index.ts
    user-submissions/
      index.ts
    business-plans/
      index.ts
    mentor/
      index.ts
    messages/
      index.ts
    notifications/
      index.ts
    admin/
      users.ts
      applications.ts
      programs.ts
      evidence.ts
      submissions.ts
      mentor-management.ts
      analytics.ts
      settings.ts
      activity-log.ts
    health/
      index.ts
  services/
    notification.service.ts
    storage.service.ts
    csv.service.ts
    admin-log.service.ts
  ws/
    registry.ts
    handler.ts
    events.ts
  schemas/
    user.schema.ts
    program.schema.ts
    application.schema.ts
    submission.schema.ts
    evidence.schema.ts
    mentor.schema.ts
    message.schema.ts
    notification.schema.ts
    admin.schema.ts
  types/
    fastify.d.ts
    index.ts
  app.ts
  server.ts
prisma/
  schema.prisma
  seed.ts
scripts/
  migrate-from-mysql.ts
  migrate-files-to-storage.ts
```

---

## Phase 3 — Database Schema

### Step 3.1 — Initialize Prisma

```bash
npx prisma init --datasource-provider postgresql
```

After running this, immediately update the datasource block in the generated `schema.prisma` to use both `url` and `directUrl`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // pooler — used by Prisma Client at runtime
  directUrl = env("DIRECT_URL")     // direct — used by prisma migrate only
}
```

This two-URL setup is required for Supabase. Without `directUrl`, `prisma migrate dev` and `prisma migrate deploy` will fail because PgBouncer (the pooler) does not support the DDL statements that migrations need.

### Step 3.2 — Write `prisma/schema.prisma`

Copy the **complete Prisma schema** from **Section 5** of `BACKEND_DESIGN.md` into `prisma/schema.prisma`. Do not abbreviate it, do not skip any model, do not skip any field. The schema includes these models:

- `User`
- `Program`
- `Application`
- `SmartGoal`
- `MilestonePlan`
- `MarketResearch`
- `Document`
- `Evidence`
- `AdminTemplate`
- `UserSubmission`
- `BusinessPlan`
- `MentorMentee`
- `MentorMeeting`
- `MentorNote`
- `Message`
- `Notification`
- `AdminLog`
- `AdminSetting`

And these enums:
`UserRole`, `Gender`, `BusinessStage`, `ProgramStatus`, `ApplicationStatus`, `EvidenceStatus`, `DocumentStatus`, `DocumentCategory`, `Priority`, `TemplateType`, `SubmissionStatus`, `MeetingStatus`, `MeetingType`, `NotificationType`, `AdminTargetType`

After writing the schema:
```bash
npm run db:generate
```

### Step 3.3 — Create the 8 Migration Files

Run the following commands **in order** to create the 8 logical migrations. Between each command, ensure the schema state matches what that migration should contain. Prisma will generate the SQL; you are just naming the runs:

```bash
# After schema has only users + enums defined:
npx prisma migrate dev --name create_enums_and_users

# After adding programs + applications:
npx prisma migrate dev --name create_programs_and_applications

# After adding smart_goals + milestone_plans + market_research:
npx prisma migrate dev --name create_submissions

# After adding documents + evidence + admin_templates + user_submissions + business_plans:
npx prisma migrate dev --name create_file_management

# After adding mentor_mentees + mentor_meetings + mentor_notes:
npx prisma migrate dev --name create_mentor_system

# After adding messages + notifications:
npx prisma migrate dev --name create_communication

# After adding blog_posts + testimonials:
npx prisma migrate dev --name create_content

# After adding admin_logs + admin_settings:
npx prisma migrate dev --name create_admin_tools
```

**Important:** Build the schema incrementally for the migrations (add models in the groups above), then restore the full schema after all 8 migrations are created. This gives a clean migration history. After the final migration, run `npm run db:generate` again.

---

## Phase 4 — Core Infrastructure

Implement these files **in order** — each one is a dependency for what follows.

### Step 4.1 — `src/config/index.ts`

Parse and validate all environment variables at startup. If a required variable is missing, **throw an error and crash** — never let the app start with a broken config.

```typescript
import { config } from 'dotenv';
config();

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

export const appConfig = {
  port:           parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv:        process.env.NODE_ENV ?? 'development',
  apiPrefix:      process.env.API_PREFIX ?? '/api/v1',
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173').split(','),
  isDev:          (process.env.NODE_ENV ?? 'development') === 'development',

  db: {
    url:       requireEnv('DATABASE_URL'),
    directUrl: requireEnv('DIRECT_URL'),
  },

  supabase: {
    url:            requireEnv('SUPABASE_URL'),
    serviceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    jwtSecret:      requireEnv('SUPABASE_JWT_SECRET'),
  },

  storage: {
    buckets: {
      documents:   process.env.STORAGE_BUCKET_DOCUMENTS   ?? 'documents',
      evidence:    process.env.STORAGE_BUCKET_EVIDENCE     ?? 'evidence',
      profiles:    process.env.STORAGE_BUCKET_PROFILES     ?? 'profiles',
      templates:   process.env.STORAGE_BUCKET_TEMPLATES    ?? 'templates',
      submissions: process.env.STORAGE_BUCKET_SUBMISSIONS  ?? 'submissions',
    },
  },

  rateLimit: {
    max:      parseInt(process.env.RATE_LIMIT_MAX        ?? '100', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS  ?? '60000', 10),
  },
} as const;

export type AppConfig = typeof appConfig;
```

### Step 4.2 — `src/types/index.ts`

Define all shared TypeScript types used across the codebase:

```typescript
import type { User, UserRole } from '@prisma/client';

// The authenticated user attached to every request after JWT verification
export interface AuthUser {
  id:       string;
  email:    string;
  role:     UserRole;
  isMentor: boolean;
}

// Standard API response envelope
export interface ApiResponse<T = unknown> {
  success: true;
  data:    T;
}

export interface ApiResponsePaginated<T = unknown> {
  success: true;
  data:    T[];
  meta: {
    total:      number;
    page:       number;
    limit:      number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code:     string;
    message:  string;
    details?: unknown;
  };
}

// Pagination query parameters
export interface PaginationQuery {
  page?:      number;
  limit?:     number;
  sortBy?:    string;
  sortOrder?: 'asc' | 'desc';
  search?:    string;
}

// Application error class — throw this in route handlers for predictable error responses
export class AppError extends Error {
  constructor(
    public readonly code:       string,
    message:                    string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

### Step 4.3 — `src/types/fastify.d.ts`

Augment Fastify's type system so `request.user`, `fastify.prisma`, and `fastify.supabase` are fully typed everywhere:

```typescript
import type { PrismaClient } from '@prisma/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthUser } from './index.js';
import type { ConnectionRegistry } from '../ws/registry.js';

declare module 'fastify' {
  interface FastifyInstance {
    prisma:           PrismaClient;
    supabase:         SupabaseClient;
    wsRegistry:       ConnectionRegistry;
    authenticate:     (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    user?: AuthUser;
  }
}
```

### Step 4.4 — `src/lib/prisma.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { appConfig } from '../config/index.js';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: appConfig.isDev ? ['query', 'error', 'warn'] : ['error'],
  });

if (appConfig.isDev) globalForPrisma.prisma = prisma;
```

### Step 4.5 — `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { appConfig } from '../config/index.js';

// Admin client — server-side only, never exposed to clients
export const supabaseAdmin = createClient(
  appConfig.supabase.url,
  appConfig.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  },
);
```

### Step 4.6 — `src/plugins/prisma.ts`

Register PrismaClient as a Fastify plugin (singleton):

```typescript
import fp from 'fastify-plugin';
import { prisma } from '../lib/prisma.js';

export default fp(async (fastify) => {
  await prisma.$connect();
  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
});
```

### Step 4.7 — `src/plugins/supabase.ts`

```typescript
import fp from 'fastify-plugin';
import { supabaseAdmin } from '../lib/supabase.js';

export default fp(async (fastify) => {
  fastify.decorate('supabase', supabaseAdmin);
});
```

### Step 4.8 — `src/plugins/auth.ts`

Verify Supabase JWTs and attach user info to requests:

```typescript
import fp from 'fastify-plugin';
import jwt from 'jsonwebtoken';
import { appConfig } from '../config/index.js';
import { AppError } from '../types/index.js';

export default fp(async (fastify) => {
  fastify.decorate('authenticate', async (request, reply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('UNAUTHORIZED', 'Missing or invalid Authorization header', 401);
    }

    const token = authHeader.slice(7);

    let decoded: { sub: string; email: string };
    try {
      decoded = jwt.verify(token, appConfig.supabase.jwtSecret) as typeof decoded;
    } catch {
      throw new AppError('UNAUTHORIZED', 'Invalid or expired token', 401);
    }

    // Fetch current role from DB — never trust role from JWT
    const user = await fastify.prisma.user.findUnique({
      where:  { id: decoded.sub },
      select: { id: true, email: true, role: true, isMentor: true },
    });

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'User account not found', 401);
    }

    request.user = user;
  });
});
```

### Step 4.9 — `src/plugins/websocket.ts`

```typescript
import fp from 'fastify-plugin';
import websocketPlugin from '@fastify/websocket';
import { ConnectionRegistry } from '../ws/registry.js';

export default fp(async (fastify) => {
  await fastify.register(websocketPlugin);
  fastify.decorate('wsRegistry', new ConnectionRegistry());
});
```

### Step 4.10 — `src/plugins/cors.ts`

```typescript
import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { appConfig } from '../config/index.js';

export default fp(async (fastify) => {
  fastify.register(cors, {
    origin:      appConfig.allowedOrigins,
    credentials: false,
    methods:     ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });
});
```

### Step 4.11 — `src/plugins/helmet.ts`

```typescript
import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';

export default fp(async (fastify) => {
  fastify.register(helmet, {
    contentSecurityPolicy: false, // Frontend handles its own CSP
  });
});
```

### Step 4.12 — `src/plugins/rate-limit.ts`

```typescript
import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import { appConfig } from '../config/index.js';

export default fp(async (fastify) => {
  fastify.register(rateLimit, {
    max:      appConfig.rateLimit.max,
    timeWindow: appConfig.rateLimit.windowMs,
    keyGenerator: (request) =>
      request.user?.id ?? request.ip,
  });
});
```

---

## Phase 5 — Middleware

### Step 5.1 — `src/middleware/require-auth.ts`

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify';

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  await request.server.authenticate(request, reply);
}
```

### Step 5.2 — `src/middleware/require-admin.ts`

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../types/index.js';

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await request.server.authenticate(request, reply);
  if (!request.user || !['admin', 'super_admin'].includes(request.user.role)) {
    throw new AppError('FORBIDDEN', 'Admin access required', 403);
  }
}
```

### Step 5.3 — `src/middleware/require-super-admin.ts`

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../types/index.js';

export async function requireSuperAdmin(request: FastifyRequest, reply: FastifyReply) {
  await request.server.authenticate(request, reply);
  if (!request.user || request.user.role !== 'super_admin') {
    throw new AppError('FORBIDDEN', 'Super-admin access required', 403);
  }
}
```

### Step 5.4 — `src/middleware/require-mentor.ts`

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../types/index.js';

export async function requireMentor(request: FastifyRequest, reply: FastifyReply) {
  await request.server.authenticate(request, reply);
  if (!request.user?.isMentor) {
    throw new AppError('FORBIDDEN', 'Mentor access required', 403);
  }
}
```

---

## Phase 6 — Zod Schemas

Write all Zod validation schemas in `src/schemas/`. These are used to validate request bodies and query params in every route. Do not skip any — every route that accepts input must validate it.

### `src/schemas/user.schema.ts`
Validate: `PATCH /users/me` body (optional firstName, lastName, phone, county, gender, businessName, businessStage, businessDescription, profilePic).

### `src/schemas/program.schema.ts`
Validate: create program body (name required, description, applicationDeadline, status, maxParticipants, grantAmount, eligibilityRequirements, tags array), update body (all optional), query params (page, limit, search, status).

### `src/schemas/application.schema.ts`
Validate: apply body (`{ programId: number }`), status update body (`{ status: ApplicationStatus }`), bulk status body (`{ ids: number[], status: ApplicationStatus }`), query params (page, limit, status, programId, search, from, to).

### `src/schemas/submission.schema.ts`
Validate: Smart Goal create/update body (all 6 SMART fields), Milestone Plan body (businessName, grantAmount, implementationPeriod, stage, milestones array with 5 items each having: number, title, timeline, budget, goal, tasks, evidence, metrics), Market Research body (all fields from the design doc), admin comment body (`{ adminComment: string }`).

### `src/schemas/evidence.schema.ts`
Validate: register evidence body (programId optional, milestoneNumber optional, fileName, storagePath, fileSize, mimeType, fileType, description optional, category optional), status update body (`{ status: EvidenceStatus, notes?: string }`), query params.

### `src/schemas/mentor.schema.ts`
Validate: schedule meeting body (menteeId, meetingTime, meetingType, link optional, location optional, notes optional), update meeting body (all optional), create note body (menteeId, content).

### `src/schemas/message.schema.ts`
Validate: send message body (`{ receiverId: string, content: string }`).

### `src/schemas/notification.schema.ts`
No request body validation needed — just response shapes.

### `src/schemas/admin.schema.ts`
Validate: role update body (`{ role: UserRole }`), verify body (`{ isVerified: boolean }`), mentor assignment body (`{ mentorId: string, menteeId: string }`), settings update body (`Record<string, string>`), user list query (page, limit, search, role, county, isVerified, isMentor, businessStage).

---

## Phase 7 — WebSocket System

Implement the WebSocket system **before** routes, because routes need to push events to connected clients.

### Step 7.1 — `src/ws/events.ts`

Define all typed events exactly as specified in **Section 9** of the design doc. Include:
- `ServerEvent` union type — every event the server can push to a client
- `ClientEvent` union type — every event a client can send to the server
- Export event type constants as string literals

### Step 7.2 — `src/ws/registry.ts`

Implement the `ConnectionRegistry` class exactly as described in Section 9:

```typescript
import type { WebSocket } from '@fastify/websocket';
import type { ServerEvent } from './events.js';

export class ConnectionRegistry {
  private connections = new Map<string, Set<WebSocket>>();

  register(userId: string, ws: WebSocket): void {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(ws);
  }

  unregister(userId: string, ws: WebSocket): void {
    const conns = this.connections.get(userId);
    if (!conns) return;
    conns.delete(ws);
    if (conns.size === 0) this.connections.delete(userId);
  }

  isOnline(userId: string): boolean {
    const conns = this.connections.get(userId);
    return !!conns && conns.size > 0;
  }

  // Push event to ALL connections for this user (multiple tabs support)
  push(userId: string, event: ServerEvent): void {
    const conns = this.connections.get(userId);
    if (!conns) return;
    const payload = JSON.stringify(event);
    for (const ws of conns) {
      if (ws.readyState === ws.OPEN) {
        ws.send(payload);
      }
    }
  }

  pushMany(userIds: string[], event: ServerEvent): void {
    for (const id of userIds) this.push(id, event);
  }

  // Push to all admins currently connected
  pushToAdmins(prisma: PrismaClient, event: ServerEvent): void {
    // Admins whose IDs are in the registry
    for (const [userId, conns] of this.connections) {
      for (const ws of conns) {
        ws.send(JSON.stringify(event)); // filtered by role at query time
      }
    }
  }

  broadcast(event: ServerEvent): void {
    const payload = JSON.stringify(event);
    for (const conns of this.connections.values()) {
      for (const ws of conns) {
        if (ws.readyState === ws.OPEN) {
          ws.send(payload);
        }
      }
    }
  }

  // Heartbeat — close dead connections
  startHeartbeat(intervalMs = 30_000): NodeJS.Timeout {
    return setInterval(() => {
      for (const [userId, conns] of this.connections) {
        for (const ws of conns) {
          if (ws.readyState !== ws.OPEN) {
            this.unregister(userId, ws);
          }
        }
      }
    }, intervalMs);
  }
}
```

### Step 7.3 — `src/ws/handler.ts`

Handle the WebSocket connection lifecycle:

1. Extract token from query string (`ws.query.token`)
2. Verify JWT using `jsonwebtoken` and the `SUPABASE_JWT_SECRET`
3. Look up user in database (get role and isMentor)
4. If invalid, send `error` event and close connection
5. Register connection in `registry.register(userId, ws)`
6. Send `connected` event with unread notification count
7. Listen for incoming messages — route them based on `type`:
   - `ping` → respond with `pong`
   - `message_send` → save to DB, push `new_message` to receiver if online
   - `typing` → push `typing` event to receiver if online
   - `mark_read` → mark notification or message as read in DB
   - `mark_all_read` → mark all as read in DB
8. On `close` or `error` → `registry.unregister(userId, ws)`

---

## Phase 8 — Services

### Step 8.1 — `src/services/notification.service.ts`

```typescript
import type { PrismaClient, NotificationType } from '@prisma/client';
import type { ConnectionRegistry } from '../ws/registry.js';

export interface CreateNotificationPayload {
  userId:    string;
  type:      NotificationType;
  title:     string;
  body:      string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(
  prisma:   PrismaClient,
  registry: ConnectionRegistry,
  payload:  CreateNotificationPayload,
): Promise<void> {
  const notification = await prisma.notification.create({
    data: {
      userId:   payload.userId,
      type:     payload.type,
      title:    payload.title,
      body:     payload.body,
      metadata: payload.metadata ?? {},
    },
  });

  // Push immediately if user is online — they get it in real-time
  registry.push(payload.userId, {
    type: 'notification',
    data: notification,
  });
}
```

### Step 8.2 — `src/services/storage.service.ts`

Handle all Supabase Storage operations:

- `getSignedUploadUrl(bucket, storagePath, mimeType, expiresIn?)` — generates a signed URL for client-side upload
- `getSignedDownloadUrl(bucket, storagePath, expiresIn?)` — generates a signed URL for client-side download
- `getPublicUrl(bucket, storagePath)` — for public buckets (templates)
- `deleteFile(bucket, storagePath)` — deletes a file from storage
- `validateFileType(mimeType, bucket)` — checks against the allowlist from Section 10 of the design doc
- `validateFileSize(bytes, bucket)` — checks against per-bucket limits from Section 10

Implement the full allowlist from Section 10:

```typescript
const BUCKET_ALLOWLISTS: Record<string, { types: string[]; maxBytes: number }> = {
  profiles:    { types: ['image/jpeg', 'image/png', 'image/webp'],                                                                    maxBytes: 5  * 1024 * 1024 },
  evidence:    { types: ['image/jpeg','image/png','image/gif','image/webp','application/pdf','video/mp4','video/quicktime','audio/mpeg','audio/wav','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain','text/csv'], maxBytes: 50 * 1024 * 1024 },
  documents:   { types: ['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.ms-powerpoint'], maxBytes: 50 * 1024 * 1024 },
  submissions: { types: ['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/msword','text/plain','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], maxBytes: 25 * 1024 * 1024 },
  templates:   { types: ['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], maxBytes: 25 * 1024 * 1024 },
};
```

### Step 8.3 — `src/services/admin-log.service.ts`

```typescript
import type { PrismaClient, AdminTargetType } from '@prisma/client';

export interface LogAdminActionPayload {
  adminId:     string;
  action:      string;
  targetType?: AdminTargetType;
  targetId?:   string;
  description?: string;
  ipAddress?:  string;
  userAgent?:  string;
}

export async function logAdminAction(
  prisma:  PrismaClient,
  payload: LogAdminActionPayload,
): Promise<void> {
  await prisma.adminLog.create({ data: payload });
}
```

### Step 8.4 — `src/services/csv.service.ts`

Implement CSV export helpers using `fast-csv`:
- `exportUsers(users[])` → returns CSV string of user data
- `exportApplications(applications[])` → returns CSV string of application data

---

## Phase 9 — Routes

This is the largest phase. Implement every route module completely. No stubs. No `// TODO` comments. Every endpoint from Section 8 of the design doc must be fully implemented.

### Implementation Rules for Every Route

1. **Always validate input with Zod** — every body, every query param
2. **Always check ownership** — users can only access their own data (not just check JWT, check the DB record's userId matches request.user.id)
3. **Always use the response envelope** — `{ success: true, data: ... }` for success, `{ success: false, error: { code, message } }` for errors
4. **Always call `createNotification` where documented** — see the trigger table in Section 11 of the design doc
5. **Always call `logAdminAction` in admin routes** — every mutation by an admin is logged
6. **Always push WebSocket events where documented** — see Section 9 of the design doc
7. **Paginated routes** always return `{ success: true, data: [], meta: { total, page, limit, totalPages } }`
8. **Signed URLs** — any response that includes a file record must include a fresh signed download URL from `storage.service.ts`

### Step 9.1 — `src/routes/index.ts`

Register all route modules under the `/api/v1` prefix. Register the WebSocket route at `/ws`. Register the health route at `/health` (no prefix).

### Step 9.2 — Health Route

```typescript
// src/routes/health/index.ts
fastify.get('/health', async (request, reply) => {
  let dbStatus = 'connected';
  try {
    await fastify.prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'disconnected';
  }
  return reply.send({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    db: dbStatus,
  });
});
```

### Step 9.3 — WebSocket Route

```typescript
// Add this in src/routes/index.ts alongside the REST routes
fastify.get('/ws', { websocket: true }, (socket, request) => {
  handleWebSocketConnection(socket, request, fastify.wsRegistry, fastify.prisma);
});
```

### Step 9.4 — Auth Routes (`src/routes/auth/index.ts`)

Implement:
- `POST /auth/sync-user` — idempotent, creates User if not exists using JWT sub+email
- `GET /auth/profile-check` — returns `{ profileComplete, role, isMentor }`

### Step 9.5 — Users Routes (`src/routes/users/index.ts`)

Implement:
- `GET /users/me`
- `PATCH /users/me` — after update, check if profile is now complete and set `profileComplete = true`
- `GET /users/:id` — admin gets full detail; mentor only for own mentees; others get 403

### Step 9.6 — Programs Routes (`src/routes/programs/index.ts`)

Implement all 5 endpoints from Section 8.3. Public endpoints (GET list, GET single) do not require auth but optionally attach `hasApplied` if a JWT is present. On `POST /programs`, push `new_program` WebSocket event to all online users and create notifications for all verified users (batch create).

### Step 9.7 — Applications Routes (`src/routes/applications/index.ts`)

Implement all 6 endpoints from Section 8.4:
- `GET /applications/me`
- `POST /applications` — validate program is Active and deadline not passed
- `PATCH /applications/:id/status` — trigger notification + WS event
- `GET /applications` (admin)
- `GET /applications/export` (admin) — use csv.service.ts, set correct headers
- `PATCH /applications/bulk-status` (admin) — loop through IDs, update each, send notifications

### Step 9.8 — Submissions Routes

Implement all 3×4 = 12 endpoints from Sections 8.5, 8.6, 8.7:

**Smart Goals** (`src/routes/submissions/smart-goals.ts`):
- `GET /submissions/smart-goals/me`
- `POST /submissions/smart-goals`
- `PATCH /submissions/smart-goals/me`
- `PATCH /submissions/smart-goals/:id/comment` (admin) — trigger `smart_goal_commented` notification + WS
- `GET /submissions/smart-goals` (admin)

**Milestone Plans** (`src/routes/submissions/milestone-plans.ts`):
- Same 5-endpoint pattern. Admin comment triggers `milestone_plan_commented` notification + WS.

**Market Research** (`src/routes/submissions/market-research.ts`):
- Same 5-endpoint pattern. Admin comment triggers `market_research_commented` notification + WS.

### Step 9.9 — Storage Route (`src/routes/storage/index.ts`)

Implement `POST /storage/signed-upload-url` — validate bucket name against allowlist, validate mimeType against per-bucket allowlist, validate fileSize, generate signed upload URL via `storage.service.ts`, return `{ uploadUrl, storagePath, expiresIn }`.

### Step 9.10 — Documents Routes (`src/routes/documents/index.ts`)

Implement all 6 endpoints from Section 8.8. Include signed download URLs in all file responses.

### Step 9.11 — Evidence Routes (`src/routes/evidence/index.ts`)

Implement all 7 endpoints from Section 8.9. On admin status update, trigger `evidence_verified` or `evidence_rejected` notification + WS event.

### Step 9.12 — Templates Routes (`src/routes/templates/index.ts`)

Implement all 5 endpoints from Section 8.10.

### Step 9.13 — User Submissions Routes (`src/routes/user-submissions/index.ts`)

Implement all 5 endpoints from Section 8.11. On admin status update, trigger `submission_reviewed` notification + WS event.

### Step 9.14 — Business Plans Routes (`src/routes/business-plans/index.ts`)

Implement both endpoints from Section 8.12. Use `upsert` in Prisma — if the user already has a plan, update it; if not, create it.

### Step 9.15 — Mentor Routes (`src/routes/mentor/index.ts`)

Implement all 8 endpoints from Section 8.13:
- `GET /mentor/mentees` — include `submissionProgress` for each mentee
- `GET /mentor/mentees/:menteeId` — full profile + all submissions + evidence + notes (verify mentee is assigned to this mentor)
- `POST /mentor/meetings` — verify mentee assignment, trigger `meeting_scheduled` notification + WS
- `GET /mentor/meetings`
- `PATCH /mentor/meetings/:id` — if cancelled, trigger `meeting_cancelled` notification + WS
- `POST /mentor/notes`
- `GET /mentor/notes/:menteeId`
- `PATCH /mentor/notes/:id`
- `DELETE /mentor/notes/:id`

### Step 9.16 — Messages Routes (`src/routes/messages/index.ts`)

Implement all 4 endpoints from Section 8.14. On `POST /messages`, check if receiver is online via registry — if yes push `new_message` WS event directly; if offline, create a `new_message` notification in DB.

### Step 9.17 — Notifications Routes (`src/routes/notifications/index.ts`)

Implement all 3 endpoints from Section 8.15.

### Step 9.18 — Admin Routes

Implement all admin route files. Each file:

**`src/routes/admin/users.ts`** — 7 endpoints from Section 8.16. Include signed profile picture URLs in user list responses.

**`src/routes/admin/applications.ts`** — The admin-scoped application endpoints are already in `applications/index.ts` behind `requireAdmin` middleware. This file adds nothing extra but re-exports or registers the admin-only helpers if needed.

**`src/routes/admin/programs.ts`** — Same pattern.

**`src/routes/admin/evidence.ts`** — Delegates to `evidence/index.ts` admin endpoints.

**`src/routes/admin/submissions.ts`** — Admin view of all submission types with filter and search.

**`src/routes/admin/mentor-management.ts`** — 4 endpoints from Section 8.21:
- `GET /admin/mentors`
- `GET /admin/mentors/:mentorId/mentees`
- `POST /admin/mentor-assignments` — trigger `mentor_assigned` notification + WS
- `DELETE /admin/mentor-assignments` — trigger `mentor_unassigned` notification + WS

**`src/routes/admin/analytics.ts`** — 5 endpoints from Section 8.22. Use Prisma aggregation queries (`count`, `groupBy`).

**`src/routes/admin/settings.ts`** — 2 endpoints from Section 8.23.

**`src/routes/admin/activity-log.ts`** — 1 endpoint from Section 8.24.

---

## Phase 10 — App Assembly

### Step 10.1 — `src/app.ts`

```typescript
import Fastify from 'fastify';
import { appConfig } from './config/index.js';
import { AppError } from './types/index.js';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

// Plugins
import prismaPlugin    from './plugins/prisma.js';
import supabasePlugin  from './plugins/supabase.js';
import authPlugin      from './plugins/auth.js';
import websocketPlugin from './plugins/websocket.js';
import corsPlugin      from './plugins/cors.js';
import helmetPlugin    from './plugins/helmet.js';
import rateLimitPlugin from './plugins/rate-limit.js';

// Routes
import routes from './routes/index.js';

export async function buildApp() {
  const fastify = Fastify({
    logger: appConfig.isDev
      ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
      : true,
  });

  // ── Plugins (order matters) ─────────────────────────────────────────
  await fastify.register(helmetPlugin);
  await fastify.register(corsPlugin);
  await fastify.register(rateLimitPlugin);
  await fastify.register(prismaPlugin);
  await fastify.register(supabasePlugin);
  await fastify.register(authPlugin);
  await fastify.register(websocketPlugin);

  // ── Routes ──────────────────────────────────────────────────────────
  await fastify.register(routes);

  // ── Global Error Handler ─────────────────────────────────────────────
  fastify.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    if (error instanceof ZodError) {
      return reply.status(400).send({
        success: false,
        error: {
          code:    'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.flatten().fieldErrors,
        },
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: { code: error.code, message: error.message },
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return reply.status(409).send({
          success: false,
          error: { code: 'CONFLICT', message: 'This resource already exists' },
        });
      }
      if (error.code === 'P2025') {
        return reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Resource not found' },
        });
      }
    }

    // Fastify's own 429 rate limit error
    if (error.statusCode === 429) {
      return reply.status(429).send({
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many requests, slow down' },
      });
    }

    return reply.status(500).send({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  });

  // ── 404 Handler ──────────────────────────────────────────────────────
  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      success: false,
      error: { code: 'NOT_FOUND', message: `Route ${request.method} ${request.url} not found` },
    });
  });

  return fastify;
}
```

### Step 10.2 — `src/server.ts`

```typescript
import { buildApp } from './app.js';
import { appConfig } from './config/index.js';

async function start() {
  const app = await buildApp();

  try {
    await app.listen({ port: appConfig.port, host: '0.0.0.0' });
    app.log.info(`Server running on port ${appConfig.port}`);
    app.log.info(`Environment: ${appConfig.nodeEnv}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
```

---

## Phase 11 — Data Migration Scripts

### Step 11.1 — `scripts/migrate-from-mysql.ts`

Implement the full data migration script exactly as specified in **Section 19** of `BACKEND_DESIGN.md`. The script must:

1. Parse the MySQL dump file. Its location is:
   ```
   C:\Users\liban\OneDrive\Desktop\Projects\flarehub.org\yhrqzzlw_flarehub.sql
   ```
   Use this absolute path in the script. Do not move or copy the SQL file — read it from the original location.
2. Create Supabase Auth users using `supabase.auth.admin.createUser()` with:
   - `email` from the MySQL row
   - `password_hash: row.password` — **import the bcrypt hash directly so users keep their existing passwords**
   - `email_confirm: true` — users are already verified, do not send verification emails
   - Build an `oldIntId → newUUID` map from the results
3. Import all tables in the dependency order from the design doc (19 steps in the pseudocode)
4. Handle the **35-column → JSONB** transformation for milestone_plans
5. Deduplicate applications (same user + same program — keep most recent)
6. Skip orphaned rows (where FK target does not exist) — log them, do not crash
7. Print a full summary count per table at the end
8. Be idempotent — use `upsert` or skip-on-conflict so running twice does not duplicate data

Use a regex-based SQL dump parser to extract INSERT rows from the `.sql` file, or install `mysql-query-parser` from npm. Parse each `INSERT INTO` block into an array of plain objects, then process them in order.

### Step 11.2 — `scripts/migrate-files-to-storage.ts`

Implement the file migration script:
1. Read all `Document`, `Evidence`, `AdminTemplate`, and `UserSubmission` rows from the database
2. For each row, read the corresponding file from the local filesystem path (using the original path stored in `storagePath`)
3. Upload to the correct Supabase Storage bucket
4. Update the `storagePath` column to the new Supabase path format
5. Log any missing files (file referenced in DB but not found on disk)
6. Print summary at the end

---

## Phase 12 — Seed Script

### `prisma/seed.ts`

Create a seed script that populates initial data for a fresh environment:

1. Create a super admin user in Supabase Auth + `users` table
2. Create the two initial programs from the original data:
   - "Be Green Incubation & Mentorship Program" (Inactive)
   - "YOMA Youth Innovation Climate Challenge" (Active)
3. Create the 3 admin templates (SMART Goals Template, Milestone Plan, Market Research template) — without actual files for seed, just the metadata
4. Create default admin settings

---

## Phase 13 — Final Checks

After all code is written, run these in order:

```bash
# 1. Type check — must pass with zero errors
npm run typecheck

# 2. Lint — fix any issues
npm run lint

# 3. Build — must compile without errors
npm run build

# 4. Start dev server — must start without errors
npm run dev
```

Then manually verify these endpoints with a tool like `curl` or Bruno/Insomnia:

```bash
# Health check (no auth required)
curl http://localhost:3001/health

# Should return:
# { "status": "ok", "timestamp": "...", "uptime": ..., "db": "connected" }

# Programs list (no auth required)
curl http://localhost:3001/api/v1/programs

# Should return:
# { "success": true, "data": [], "meta": { "total": 0, "page": 1, ... } }

# Protected route without token (should return 401)
curl http://localhost:3001/api/v1/users/me

# Should return:
# { "success": false, "error": { "code": "UNAUTHORIZED", "message": "..." } }
```

---

## Quality Standards — Non-Negotiable

These apply to every single file written:

| Standard | Requirement |
|---|---|
| **TypeScript** | `strict: true` — no `any`, no `as unknown as X` hacks unless absolutely necessary and commented |
| **Error handling** | Every `async` function is wrapped in try/catch or errors propagate to the global handler |
| **Input validation** | Every request with a body or meaningful query params is validated with a Zod schema before touching the DB |
| **Ownership checks** | Every route that reads/modifies a specific record checks the record belongs to `request.user.id` (or is an admin) |
| **Response format** | Every response uses the standard envelope from Section 7 of the design doc — no raw objects returned directly |
| **Side effects** | Every admin mutation logs to `admin_logs`. Every status change that triggers a notification does so without fail |
| **No raw SQL** | Everything goes through Prisma Client. No `prisma.$queryRaw` except in the analytics aggregation routes where `groupBy` is insufficient |
| **File imports** | Use `.js` extensions in all imports (required for `NodeNext` module resolution in TypeScript) |
| **No console.log** | Use `request.log.info()` / `fastify.log.info()` for all logging |

---

## What NOT to Do

- Do not add features not in the design doc
- Do not add extra tables to the schema
- Do not add extra endpoints beyond what is specified
- Do not use `express`, `koa`, or any other framework — only Fastify
- Do not use `sequelize`, `typeorm`, or raw `pg` — only Prisma
- Do not store JWTs in the database — Supabase Auth manages sessions
- Do not add comments explaining what the code does — write self-documenting code instead
- Do not leave `// TODO` or `// FIXME` in any file — implement it or don't commit it
- Do not add a frontend — this is the backend only

---

## Completion Criteria

The backend is complete when:

- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm run build` compiles without errors
- [ ] `npm run dev` starts without errors and `/health` returns `{ "status": "ok", "db": "connected" }`
- [ ] All 8 Prisma migration files exist in `prisma/migrations/`
- [ ] Every endpoint from Section 8 of `BACKEND_DESIGN.md` has a matching implementation
- [ ] The WebSocket handler connects, authenticates, and pushes `connected` event
- [ ] The data migration script exists and handles all 19 import steps from Section 18
- [ ] The file migration script exists
- [ ] The seed script runs without errors
- [ ] No TypeScript errors, no `any` types, no missing null checks
