# NSS App - Drizzle ORM Migration Guide

> **Purpose**: This document provides Claude Code with complete context for refactoring the NSS-VIT web app to use Drizzle ORM for database schema management, migrations, and type-safe queries.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Why Drizzle ORM](#2-why-drizzle-orm)
3. [Project Structure](#3-project-structure)
4. [Installation & Setup](#4-installation--setup)
5. [Schema Definitions](#5-schema-definitions)
6. [Database Connection](#6-database-connection)
7. [Migration Workflow](#7-migration-workflow)
8. [Query Examples](#8-query-examples)
9. [Supabase Integration (Hybrid Approach)](#9-supabase-integration-hybrid-approach)
10. [Safe Migration Patterns](#10-safe-migration-patterns)
11. [Common Scenarios & Solutions](#11-common-scenarios--solutions)
12. [CI/CD Integration](#12-cicd-integration)
13. [Commands Reference](#13-commands-reference)
14. [Best Practices](#14-best-practices)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. Project Overview

### Current Stack
- **Frontend**: Next.js + TypeScript
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Current State**: Schema managed via Supabase Dashboard (no formal migration system)

### Goals
- Implement proper database schema version control
- Type-safe database queries
- Portable schema (not locked into Supabase)
- Easy handoff to future NSS batches
- Prevent schema breakage during updates

### Database Tables (Expected)
- `users` - Team members and volunteers
- `events` - NSS events and camps
- `volunteer_registrations` - Event registrations
- `achievements` - NSS achievements
- `gallery` - Event photos
- `announcements` - News and updates
- `faqs` - Frequently asked questions

---

## 2. Why Drizzle ORM

### Comparison with Alternatives

| Feature | Drizzle | Prisma | Raw SQL |
|---------|---------|--------|---------|
| Bundle Size | ~7KB ✅ | ~2MB+ ❌ | 0KB |
| Type Safety | Excellent ✅ | Excellent ✅ | None ❌ |
| SQL-like Syntax | Yes ✅ | No (custom) | Yes ✅ |
| Serverless/Edge | Perfect ✅ | Needs workarounds | Yes |
| Learning Curve | Low (if you know SQL) | Medium | N/A |
| Vendor Lock-in | None ✅ | Low | None ✅ |
| Cost | 100% Free ✅ | Freemium | Free |
| Supabase Support | First-class ✅ | Good | Native |

### Key Benefits for NSS App

1. **Zero Lock-in**: Switch between Supabase, Neon, Railway, local Postgres by changing one environment variable
2. **Type Safety**: Catch errors at compile time, not runtime
3. **SQL Familiarity**: Queries feel like SQL, easy for team to understand
4. **Lightweight**: Perfect for Vercel serverless deployment
5. **Version Control**: Schema and migrations committed to Git
6. **Handoff Friendly**: Next NSS batch can understand the codebase

### Portability Demonstration

```bash
# Switching databases is ONE line change:

# Supabase
DATABASE_URL="postgresql://postgres.xxx:pass@aws-0-region.pooler.supabase.com:5432/postgres"

# Neon
DATABASE_URL="postgresql://user:pass@ep-cool-name.neon.tech/neondb?sslmode=require"

# Railway
DATABASE_URL="postgresql://postgres:pass@containers-us-west.railway.app:5432/railway"

# Local Docker
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nss_dev"

# Your code stays EXACTLY the same!
```

---

## 3. Project Structure

```
nss-app/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx
│   │   ├── events/
│   │   ├── team/
│   │   ├── gallery/
│   │   └── api/
│   │       └── events/
│   │           └── register/
│   │               └── route.ts
│   │
│   ├── db/                           # 🆕 DATABASE LAYER
│   │   ├── index.ts                  # DB connection & exports
│   │   ├── schema/                   # Table definitions
│   │   │   ├── index.ts              # Export all schemas
│   │   │   ├── users.ts              # Users/Team members
│   │   │   ├── events.ts             # NSS Events
│   │   │   ├── volunteers.ts         # Volunteer registrations
│   │   │   ├── achievements.ts       # Achievements
│   │   │   ├── gallery.ts            # Gallery images
│   │   │   ├── announcements.ts      # Announcements
│   │   │   ├── faqs.ts               # FAQs
│   │   │   └── relations.ts          # Table relationships
│   │   └── migrations/               # Auto-generated SQL migrations
│   │       ├── 0000_initial.sql
│   │       ├── 0001_add_events.sql
│   │       └── meta/
│   │           └── _journal.json     # Migration history
│   │
│   ├── lib/
│   │   └── supabase.ts               # Supabase client (Auth/Storage only)
│   │
│   └── types/                        # Additional TypeScript types
│
├── drizzle.config.ts                 # Drizzle configuration
├── package.json
├── .env.local                        # Local environment
├── .env.example                      # Environment template
└── tsconfig.json
```

---

## 4. Installation & Setup

### Step 1: Install Dependencies

```bash
# Core Drizzle packages
npm install drizzle-orm postgres

# Development tools
npm install -D drizzle-kit

# Optional: For dotenv support
npm install -D dotenv
```

### Step 2: Create Drizzle Config

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  // Path to your schema files
  schema: './src/db/schema/index.ts',
  
  // Output directory for migrations
  out: './src/db/migrations',
  
  // Database dialect
  dialect: 'postgresql',
  
  // Database connection
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  
  // Helpful options
  verbose: true,   // Show detailed logs
  strict: true,    // Strict mode for safety
});
```

### Step 3: Add Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate", 
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:pull": "drizzle-kit introspect",
    "db:check": "drizzle-kit check",
    "db:drop": "drizzle-kit drop"
  }
}
```

### Step 4: Environment Variables

```bash
# .env.local
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# For Supabase Auth/Storage (optional, if still using)
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

```bash
# .env.example (commit this to git)
DATABASE_URL="postgresql://user:password@host:5432/database"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

---

## 5. Schema Definitions

### 5.1 Users/Team Members Schema

```typescript
// src/db/schema/users.ts
import { 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  boolean, 
  pgEnum,
  integer 
} from 'drizzle-orm/pg-core';

// Enum for user roles in NSS hierarchy
export const userRoleEnum = pgEnum('user_role', [
  'president',
  'vice_president', 
  'secretary',
  'treasurer',
  'program_officer',
  'head',
  'volunteer'
]);

// Users/Team members table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  
  // Basic info
  name: text('name').notNull(),
  email: text('email').unique(),
  phone: text('phone'),
  
  // NSS-specific fields
  role: userRoleEnum('role').default('volunteer'),
  department: text('department'),          // e.g., "Computer Science"
  year: text('year'),                       // e.g., "Third Year"
  rollNumber: text('roll_number'),
  batch: text('batch'),                     // e.g., "2024-25"
  
  // Profile
  imageUrl: text('image_url'),
  linkedinUrl: text('linkedin_url'),
  bio: text('bio'),
  
  // Status
  isActive: boolean('is_active').default(true),
  isVerified: boolean('is_verified').default(false),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Type exports for use in application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

### 5.2 Events Schema

```typescript
// src/db/schema/events.ts
import { 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  integer, 
  boolean, 
  pgEnum,
  date
} from 'drizzle-orm/pg-core';

// Event type categories
export const eventTypeEnum = pgEnum('event_type', [
  'nss_camp',
  'blood_donation',
  'cleanliness_drive',
  'tree_plantation',
  'awareness_program',
  'workshop',
  'seminar',
  'celebration',
  'community_service',
  'other'
]);

// Event status
export const eventStatusEnum = pgEnum('event_status', [
  'draft',
  'upcoming',
  'ongoing',
  'completed',
  'cancelled',
  'postponed'
]);

// Events table
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  
  // Basic info
  title: text('title').notNull(),
  slug: text('slug').unique(),              // URL-friendly identifier
  description: text('description'),
  shortDescription: text('short_description'),
  
  // Classification
  eventType: eventTypeEnum('event_type').default('other'),
  status: eventStatusEnum('status').default('draft'),
  
  // Date & Time
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  registrationDeadline: timestamp('registration_deadline'),
  
  // Location
  location: text('location'),
  venue: text('venue'),
  isOnline: boolean('is_online').default(false),
  meetingLink: text('meeting_link'),
  
  // Capacity
  maxVolunteers: integer('max_volunteers'),
  registeredCount: integer('registered_count').default(0),
  
  // Media
  imageUrl: text('image_url'),
  galleryUrls: text('gallery_urls'),        // JSON array as text
  
  // Additional info
  requirements: text('requirements'),
  benefits: text('benefits'),
  contactPerson: text('contact_person'),
  contactEmail: text('contact_email'),
  
  // Publishing
  isPublished: boolean('is_published').default(false),
  isFeatured: boolean('is_featured').default(false),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  publishedAt: timestamp('published_at'),
});

// Type exports
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
```

### 5.3 Volunteer Registrations Schema

```typescript
// src/db/schema/volunteers.ts
import { 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  integer, 
  boolean,
  pgEnum 
} from 'drizzle-orm/pg-core';
import { events } from './events';
import { users } from './users';

// Registration status
export const registrationStatusEnum = pgEnum('registration_status', [
  'pending',
  'approved',
  'rejected',
  'waitlisted',
  'cancelled'
]);

// Volunteer registrations table
export const volunteerRegistrations = pgTable('volunteer_registrations', {
  id: serial('id').primaryKey(),
  
  // References
  eventId: integer('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'set null' }),
  
  // Registration info (for non-registered users)
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  rollNumber: text('roll_number'),
  department: text('department'),
  year: text('year'),
  
  // Status
  status: registrationStatusEnum('status').default('pending'),
  
  // Attendance
  attendanceMarked: boolean('attendance_marked').default(false),
  attendanceTime: timestamp('attendance_time'),
  hoursContributed: integer('hours_contributed'),
  
  // Feedback
  feedback: text('feedback'),
  rating: integer('rating'),
  
  // Certificate
  certificateIssued: boolean('certificate_issued').default(false),
  certificateUrl: text('certificate_url'),
  
  // Timestamps
  registeredAt: timestamp('registered_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Type exports
export type VolunteerRegistration = typeof volunteerRegistrations.$inferSelect;
export type NewVolunteerRegistration = typeof volunteerRegistrations.$inferInsert;
```

### 5.4 Achievements Schema

```typescript
// src/db/schema/achievements.ts
import { 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  integer,
  pgEnum 
} from 'drizzle-orm/pg-core';

// Achievement category
export const achievementCategoryEnum = pgEnum('achievement_category', [
  'award',
  'recognition',
  'milestone',
  'competition',
  'certification',
  'other'
]);

// Achievements table
export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  
  // Basic info
  title: text('title').notNull(),
  description: text('description'),
  category: achievementCategoryEnum('category').default('other'),
  
  // Date
  achievedDate: timestamp('achieved_date'),
  academicYear: text('academic_year'),      // e.g., "2024-25"
  
  // Media
  imageUrl: text('image_url'),
  certificateUrl: text('certificate_url'),
  
  // Display
  displayOrder: integer('display_order').default(0),
  isHighlighted: boolean('is_highlighted').default(false),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Need to import boolean
import { boolean } from 'drizzle-orm/pg-core';

// Type exports
export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;
```

### 5.5 Gallery Schema

```typescript
// src/db/schema/gallery.ts
import { 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  integer,
  boolean 
} from 'drizzle-orm/pg-core';
import { events } from './events';

// Gallery images table
export const gallery = pgTable('gallery', {
  id: serial('id').primaryKey(),
  
  // Image info
  imageUrl: text('image_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  caption: text('caption'),
  altText: text('alt_text'),
  
  // References
  eventId: integer('event_id')
    .references(() => events.id, { onDelete: 'set null' }),
  
  // Organization
  academicYear: text('academic_year'),
  category: text('category'),
  displayOrder: integer('display_order').default(0),
  
  // Status
  isPublished: boolean('is_published').default(true),
  isFeatured: boolean('is_featured').default(false),
  
  // Timestamps
  takenAt: timestamp('taken_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Type exports
export type GalleryImage = typeof gallery.$inferSelect;
export type NewGalleryImage = typeof gallery.$inferInsert;
```

### 5.6 Announcements Schema

```typescript
// src/db/schema/announcements.ts
import { 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  boolean,
  pgEnum 
} from 'drizzle-orm/pg-core';

// Announcement priority
export const announcementPriorityEnum = pgEnum('announcement_priority', [
  'low',
  'normal',
  'high',
  'urgent'
]);

// Announcements table
export const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  
  // Content
  title: text('title').notNull(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  
  // Classification
  priority: announcementPriorityEnum('priority').default('normal'),
  category: text('category'),
  
  // Publishing
  isPublished: boolean('is_published').default(false),
  isPinned: boolean('is_pinned').default(false),
  publishedAt: timestamp('published_at'),
  expiresAt: timestamp('expires_at'),
  
  // Media
  imageUrl: text('image_url'),
  attachmentUrl: text('attachment_url'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Type exports
export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;
```

### 5.7 FAQs Schema

```typescript
// src/db/schema/faqs.ts
import { 
  pgTable, 
  serial, 
  text, 
  integer,
  boolean,
  timestamp 
} from 'drizzle-orm/pg-core';

// FAQs table
export const faqs = pgTable('faqs', {
  id: serial('id').primaryKey(),
  
  // Content
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  
  // Organization
  category: text('category'),
  displayOrder: integer('display_order').default(0),
  
  // Status
  isPublished: boolean('is_published').default(true),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Type exports
export type FAQ = typeof faqs.$inferSelect;
export type NewFAQ = typeof faqs.$inferInsert;
```

### 5.8 Relations Definition

```typescript
// src/db/schema/relations.ts
import { relations } from 'drizzle-orm';
import { users } from './users';
import { events } from './events';
import { volunteerRegistrations } from './volunteers';
import { gallery } from './gallery';

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  registrations: many(volunteerRegistrations),
}));

// Event relations
export const eventsRelations = relations(events, ({ many }) => ({
  registrations: many(volunteerRegistrations),
  gallery: many(gallery),
}));

// Registration relations
export const registrationsRelations = relations(volunteerRegistrations, ({ one }) => ({
  event: one(events, {
    fields: [volunteerRegistrations.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [volunteerRegistrations.userId],
    references: [users.id],
  }),
}));

// Gallery relations
export const galleryRelations = relations(gallery, ({ one }) => ({
  event: one(events, {
    fields: [gallery.eventId],
    references: [events.id],
  }),
}));
```

### 5.9 Schema Index Export

```typescript
// src/db/schema/index.ts
// Export all schemas
export * from './users';
export * from './events';
export * from './volunteers';
export * from './achievements';
export * from './gallery';
export * from './announcements';
export * from './faqs';

// Export relations
export * from './relations';
```

---

## 6. Database Connection

```typescript
// src/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Connection string from environment
const connectionString = process.env.DATABASE_URL!;

// Create postgres client
// `prepare: false` is required for serverless environments (Vercel)
const client = postgres(connectionString, { 
  prepare: false,
  // Optional: connection pool settings
  max: 10,
  idle_timeout: 20,
});

// Create drizzle instance with schema
export const db = drizzle(client, { schema });

// Export schema for easy access
export { schema };

// Export types
export type Database = typeof db;
```

### Alternative: With Connection Pooling for High Traffic

```typescript
// src/db/index.ts (alternative for high-traffic apps)
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// For query operations (pooled connection)
const queryClient = postgres(connectionString, { 
  prepare: false,
  max: 10,
});

// For migrations (direct connection - if needed)
const migrationClient = postgres(connectionString, { 
  max: 1,
});

export const db = drizzle(queryClient, { schema });
export const migrationDb = drizzle(migrationClient, { schema });

export { schema };
```

---

## 7. Migration Workflow

### 7.1 Initial Setup (From Existing Supabase)

If you already have tables in Supabase:

```bash
# Step 1: Pull existing schema from Supabase
npm run db:pull

# This creates TypeScript schema files from your existing database
# Review and organize them into the schema/ folder structure
```

### 7.2 Standard Migration Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MIGRATION WORKFLOW                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. EDIT SCHEMA                                                     │
│     └─ Modify files in src/db/schema/                              │
│                                                                     │
│  2. GENERATE MIGRATION                                              │
│     └─ npm run db:generate                                         │
│     └─ Creates SQL file in src/db/migrations/                      │
│                                                                     │
│  3. REVIEW THE SQL                                                  │
│     └─ Open the generated .sql file                                │
│     └─ Check for dangerous operations                              │
│     └─ Edit if needed (add defaults, backfills, etc.)              │
│                                                                     │
│  4. TEST ON LOCAL/STAGING                                           │
│     └─ npm run db:push (quick dev sync)                            │
│     └─ OR: npm run db:migrate (proper migration)                   │
│                                                                     │
│  5. COMMIT TO GIT                                                   │
│     └─ git add src/db/                                             │
│     └─ git commit -m "feat: add certificate field to events"       │
│                                                                     │
│  6. DEPLOY TO PRODUCTION                                            │
│     └─ CI/CD runs migrations automatically                         │
│     └─ OR: DATABASE_URL=prod_url npm run db:migrate                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.3 Commands Explained

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `db:generate` | Create migration from schema changes | After modifying schema files |
| `db:migrate` | Run pending migrations | Deploy to staging/production |
| `db:push` | Sync schema directly (no migration file) | Quick dev testing only |
| `db:studio` | Open visual database browser | Debugging, data inspection |
| `db:pull` | Generate schema from existing DB | Initial setup, sync check |
| `db:check` | Verify migration consistency | Before deploying |

### 7.4 Development vs Production

```bash
# DEVELOPMENT - Quick iteration
npm run db:push  # Directly syncs, no migration files

# STAGING/PRODUCTION - Always use migrations
npm run db:generate  # Create migration file
npm run db:migrate   # Apply migration file
```

---

## 8. Query Examples

### 8.1 Basic CRUD Operations

```typescript
// src/app/api/events/route.ts
import { db, schema } from '@/db';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// GET all events
export async function GET() {
  const events = await db
    .select()
    .from(schema.events)
    .where(eq(schema.events.isPublished, true))
    .orderBy(desc(schema.events.startDate));
    
  return NextResponse.json(events);
}

// POST create event
export async function POST(req: NextRequest) {
  const body = await req.json();
  
  const [newEvent] = await db
    .insert(schema.events)
    .values({
      title: body.title,
      description: body.description,
      eventType: body.eventType,
      startDate: new Date(body.startDate),
      location: body.location,
      maxVolunteers: body.maxVolunteers,
    })
    .returning();
    
  return NextResponse.json(newEvent, { status: 201 });
}
```

### 8.2 Complex Queries

```typescript
// Get upcoming events with registration count
const upcomingEvents = await db
  .select({
    id: schema.events.id,
    title: schema.events.title,
    startDate: schema.events.startDate,
    location: schema.events.location,
    maxVolunteers: schema.events.maxVolunteers,
    registeredCount: schema.events.registeredCount,
  })
  .from(schema.events)
  .where(
    and(
      eq(schema.events.status, 'upcoming'),
      eq(schema.events.isPublished, true),
      gte(schema.events.startDate, new Date())
    )
  )
  .orderBy(schema.events.startDate)
  .limit(10);
```

### 8.3 Queries with Relations

```typescript
// Get event with all registrations
const eventWithRegistrations = await db.query.events.findFirst({
  where: eq(schema.events.id, eventId),
  with: {
    registrations: {
      where: eq(schema.volunteerRegistrations.status, 'approved'),
    },
  },
});

// Get user with their event registrations
const userWithEvents = await db.query.users.findFirst({
  where: eq(schema.users.id, userId),
  with: {
    registrations: {
      with: {
        event: true,
      },
    },
  },
});
```

### 8.4 Aggregations

```typescript
import { count, sum, avg } from 'drizzle-orm';

// Count registrations per event
const eventStats = await db
  .select({
    eventId: schema.volunteerRegistrations.eventId,
    totalRegistrations: count(schema.volunteerRegistrations.id),
  })
  .from(schema.volunteerRegistrations)
  .groupBy(schema.volunteerRegistrations.eventId);

// Get total hours contributed by a volunteer
const volunteerHours = await db
  .select({
    totalHours: sum(schema.volunteerRegistrations.hoursContributed),
  })
  .from(schema.volunteerRegistrations)
  .where(eq(schema.volunteerRegistrations.userId, userId));
```

### 8.5 Transactions

```typescript
// Register volunteer for event (atomic operation)
await db.transaction(async (tx) => {
  // Insert registration
  const [registration] = await tx
    .insert(schema.volunteerRegistrations)
    .values({
      eventId,
      name,
      email,
      phone,
    })
    .returning();
  
  // Increment event's registered count
  await tx
    .update(schema.events)
    .set({ 
      registeredCount: sql`${schema.events.registeredCount} + 1` 
    })
    .where(eq(schema.events.id, eventId));
  
  return registration;
});
```

### 8.6 Raw SQL (When Needed)

```typescript
import { sql } from 'drizzle-orm';

// Complex query with raw SQL
const results = await db.execute(sql`
  SELECT 
    e.title,
    COUNT(vr.id) as registration_count,
    AVG(vr.rating) as avg_rating
  FROM ${schema.events} e
  LEFT JOIN ${schema.volunteerRegistrations} vr ON vr.event_id = e.id
  WHERE e.status = 'completed'
  GROUP BY e.id
  HAVING COUNT(vr.id) > 10
  ORDER BY avg_rating DESC
`);
```

---

## 9. Supabase Integration (Hybrid Approach)

Use Drizzle for database queries, keep Supabase client for Auth/Storage/Realtime.

### 9.1 Supabase Client Setup

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client (for API routes)
export const createServerSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};
```

### 9.2 Hybrid Usage Example

```typescript
// src/app/api/events/[id]/upload-image/route.ts
import { db, schema } from '@/db';
import { supabase } from '@/lib/supabase';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const eventId = parseInt(params.id);
  const formData = await req.formData();
  const file = formData.get('image') as File;
  
  // Use Supabase for file upload
  const fileName = `events/${eventId}/${Date.now()}-${file.name}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('event-images')
    .upload(fileName, file);
  
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('event-images')
    .getPublicUrl(fileName);
  
  // Use Drizzle to update database
  const [updatedEvent] = await db
    .update(schema.events)
    .set({ imageUrl: publicUrl })
    .where(eq(schema.events.id, eventId))
    .returning();
  
  return NextResponse.json(updatedEvent);
}
```

### 9.3 What to Use Where

| Feature | Use Drizzle | Use Supabase Client |
|---------|-------------|---------------------|
| Database queries | ✅ | ❌ |
| Schema migrations | ✅ | ❌ |
| Type-safe queries | ✅ | ❌ |
| Authentication | ❌ | ✅ |
| File storage | ❌ | ✅ |
| Realtime subscriptions | ❌ | ✅ |
| Edge functions | ❌ | ✅ |
| Row Level Security | ⚠️ Define in Drizzle, enforce via Supabase | ✅ |

---

## 10. Safe Migration Patterns

### 10.1 Adding Columns

**Safe: Nullable column**
```typescript
// Schema change
export const events = pgTable('events', {
  // existing columns...
  certificateUrl: text('certificate_url'), // Nullable - SAFE
});
```

**Needs attention: Required column**
```typescript
// Schema change
export const events = pgTable('events', {
  // existing columns...
  eventCode: text('event_code').notNull(), // NOT NULL - DANGER!
});
```

**Fix the generated migration:**
```sql
-- Generated (WILL FAIL):
ALTER TABLE "events" ADD COLUMN "event_code" TEXT NOT NULL;

-- Fixed version:
ALTER TABLE "events" ADD COLUMN "event_code" TEXT;
UPDATE "events" SET event_code = 'EVT-' || id WHERE event_code IS NULL;
ALTER TABLE "events" ALTER COLUMN "event_code" SET NOT NULL;
```

### 10.2 Adding Constraints

**Adding unique constraint (check for duplicates first):**
```sql
-- Step 1: Check for duplicates
SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1;

-- Step 2: Handle duplicates (if any)

-- Step 3: Add constraint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE ("email");
```

**Adding foreign key to existing data:**
```sql
-- Add as NOT VALID first (instant, no table scan)
ALTER TABLE "registrations" 
ADD CONSTRAINT "fk_event" 
FOREIGN KEY (event_id) REFERENCES events(id) NOT VALID;

-- Validate separately (background, non-blocking)
ALTER TABLE "registrations" VALIDATE CONSTRAINT "fk_event";
```

### 10.3 Handling ON DELETE Behavior

Always define explicit behavior:
```typescript
// CASCADE - Delete children when parent is deleted
eventId: integer('event_id')
  .references(() => events.id, { onDelete: 'cascade' })

// SET NULL - Set to null when parent is deleted
eventId: integer('event_id')
  .references(() => events.id, { onDelete: 'set null' })

// RESTRICT - Prevent parent deletion if children exist
eventId: integer('event_id')
  .references(() => events.id, { onDelete: 'restrict' })
```

### 10.4 Large Table Considerations

For tables with lots of data:

```sql
-- Use CONCURRENTLY for indexes (non-blocking)
CREATE INDEX CONCURRENTLY idx_registrations_event ON volunteer_registrations(event_id);

-- Set lock timeout to fail fast
SET lock_timeout TO '5s';
ALTER TABLE events ADD COLUMN new_field TEXT;
RESET lock_timeout;
```

---

## 11. Common Scenarios & Solutions

### Scenario 1: Can't Delete User (Foreign Key Constraint)

**Problem**: Error when trying to delete a user who has registrations.

**Solution**: Define proper ON DELETE behavior in schema:
```typescript
// In volunteers.ts
userId: integer('user_id')
  .references(() => users.id, { onDelete: 'set null' }) // or 'cascade'
```

### Scenario 2: Adding NOT NULL Column to Existing Table

**Problem**: Migration fails because existing rows don't have values.

**Solution**: Three-step migration:
```sql
-- 1. Add as nullable
ALTER TABLE "events" ADD COLUMN "event_code" TEXT;

-- 2. Backfill data
UPDATE "events" SET event_code = 'EVT-' || id;

-- 3. Add NOT NULL constraint
ALTER TABLE "events" ALTER COLUMN "event_code" SET NOT NULL;
```

### Scenario 3: Renaming a Column

**Problem**: Renaming breaks existing queries.

**Solution**: Use expand-contract pattern:
```sql
-- Step 1: Add new column
ALTER TABLE "users" ADD COLUMN "full_name" TEXT;

-- Step 2: Backfill data
UPDATE "users" SET full_name = name;

-- Step 3: Update application to use new column

-- Step 4: (Later) Remove old column
ALTER TABLE "users" DROP COLUMN "name";
```

### Scenario 4: Changing Column Type

**Problem**: Can't directly change VARCHAR to TEXT or similar.

**Solution**: 
```sql
-- For compatible types (VARCHAR → TEXT)
ALTER TABLE "users" ALTER COLUMN "name" TYPE TEXT;

-- For incompatible types, use conversion
ALTER TABLE "events" 
ALTER COLUMN "max_volunteers" TYPE INTEGER 
USING max_volunteers::INTEGER;
```

### Scenario 5: Adding Enum Value

**Problem**: PostgreSQL enums are tricky to modify.

**Solution**:
```sql
-- Add new value to enum
ALTER TYPE event_status ADD VALUE 'postponed';

-- Note: Cannot remove enum values easily
-- Consider using TEXT with CHECK constraint instead for flexibility
```

---

## 12. CI/CD Integration

### 12.1 GitHub Actions Workflow

```yaml
# .github/workflows/database.yml
name: Database Migrations

on:
  push:
    branches: [main]
    paths:
      - 'src/db/**'
  pull_request:
    branches: [main]
    paths:
      - 'src/db/**'

jobs:
  # Test migrations on PR
  test-migrations:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: nss_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run migrations
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/nss_test
        run: npm run db:migrate
      
      - name: Verify schema
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/nss_test
        run: npm run db:check

  # Deploy to production on merge
  deploy-production:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run production migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: npm run db:migrate
```

### 12.2 Optional: Add Squawk Linting

```yaml
# Add to the test-migrations job
- name: Install Squawk
  run: npm install -g squawk-cli

- name: Lint migrations
  run: squawk src/db/migrations/*.sql
```

Squawk will warn about:
- Adding NOT NULL without default
- Creating indexes without CONCURRENTLY
- Dropping columns (data loss warning)
- Other dangerous patterns

---

## 13. Commands Reference

### Development Commands

```bash
# Generate migration from schema changes
npm run db:generate

# Apply migrations (for production)
npm run db:migrate

# Push schema directly (dev only, no migration file)
npm run db:push

# Open Drizzle Studio (visual DB browser)
npm run db:studio

# Pull schema from existing database
npm run db:pull

# Check migration consistency
npm run db:check

# Drop a migration (careful!)
npm run db:drop
```

### Database URLs for Different Environments

```bash
# Local development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nss_dev"

# Supabase
DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Neon
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"
```

### Useful Drizzle-Kit Options

```bash
# Generate with custom name
npx drizzle-kit generate --name add_certificate_column

# Push with verbose output
npx drizzle-kit push --verbose

# Studio on custom port
npx drizzle-kit studio --port 4000
```

---

## 14. Best Practices

### Schema Design

1. **Always define ON DELETE behavior** for foreign keys
2. **Use enums for fixed value sets** (status, types, roles)
3. **Add timestamps** (`createdAt`, `updatedAt`) to all tables
4. **Make columns nullable by default**, add NOT NULL intentionally
5. **Use serial/SERIAL for primary keys** (or uuid if needed)

### Migration Practices

1. **Always review generated migrations** before applying
2. **Test on local/staging** before production
3. **One feature = one migration** (keep migrations focused)
4. **Never edit applied migrations** (create new ones)
5. **Commit schema + migrations together**

### Query Practices

1. **Use the schema object** for type safety
2. **Prefer query builder** over raw SQL
3. **Use transactions** for multi-step operations
4. **Add indexes** for frequently queried columns
5. **Use `.returning()`** to get inserted/updated data

### Team Collaboration

1. **Document schema changes** in commit messages
2. **Review migration PRs carefully**
3. **Communicate breaking changes** to team
4. **Keep migration history clean** (squash when needed)

---

## 15. Troubleshooting

### Common Errors

**Error: "relation does not exist"**
```
Solution: Run migrations - `npm run db:migrate`
```

**Error: "column already exists"**
```
Solution: Migration already applied. Check `__drizzle_migrations` table.
```

**Error: "violates foreign key constraint"**
```
Solution: Check ON DELETE behavior. Either:
- Delete child records first
- Change to `onDelete: 'cascade'`
- Change to `onDelete: 'set null'`
```

**Error: "null value in column violates not-null constraint"**
```
Solution: Add default value or backfill existing data before adding NOT NULL.
```

**Error: "cannot drop column because other objects depend on it"**
```
Solution: Drop dependent objects (indexes, constraints) first.
```

### Reset Development Database

```bash
# Nuclear option - drop everything and recreate
npm run db:drop
npm run db:push

# Or recreate from migrations
dropdb nss_dev
createdb nss_dev
npm run db:migrate
```

### Check Migration Status

```sql
-- See applied migrations
SELECT * FROM __drizzle_migrations ORDER BY created_at;
```

### Sync Issues Between Environments

```bash
# Pull actual schema from production
DATABASE_URL=prod_url npm run db:pull

# Compare with your local schema
# Fix any discrepancies
```

---

## Summary

This guide provides everything needed to refactor the NSS-VIT web app to use Drizzle ORM:

1. **Schema files** for all tables (users, events, registrations, etc.)
2. **Database connection** setup for serverless (Vercel)
3. **Migration workflow** for safe schema changes
4. **Query examples** for common operations
5. **Hybrid approach** keeping Supabase for Auth/Storage
6. **CI/CD integration** for automated deployments
7. **Best practices** and troubleshooting tips

The key benefits:
- ✅ Type-safe database queries
- ✅ Version-controlled schema
- ✅ Zero vendor lock-in
- ✅ Easy handoff to future NSS batches
- ✅ Modern, lightweight, serverless-ready

---

*Document created for Claude Code assistance in refactoring NSS-VIT web app to Drizzle ORM.*
