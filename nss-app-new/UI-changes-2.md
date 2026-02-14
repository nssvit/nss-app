# UI Changes Round 2 - Database Flow Fixes & Role-Based Routing

> **Context**: After verifying the UI <-> DB flow end-to-end, these are the remaining issues that need fixing. Changes are grouped by severity and area.

---

## CRITICAL ISSUES (Will cause runtime errors or show wrong data)

### 1. `getEventsWithStats()` missing `declared_hours` column

**File**: `src/db/queries/events.ts` (line 14-42)

**Problem**: The SQL SELECT in `getEventsWithStats()` does not include `e.declared_hours`. The mapper (`mapEventRow` in `src/lib/mappers.ts:59`) reads `r.declared_hours ?? 0`, which always falls back to `0` because the query never returns the column.

**Impact**: Every event card, event list, and reports page shows `0` declared hours for all events.

**Fix**: Add `e.declared_hours,` to the SELECT clause in `getEventsWithStats()`:
```sql
SELECT
  e.id,
  e.event_name,
  e.description,
  e.start_date,
  e.end_date,
  e.declared_hours,          -- ADD THIS LINE
  e.location,
  ...
```

Also add it to the TypeScript return type annotation below the query:
```ts
declared_hours: number       // ADD THIS LINE
```

---

### 2. `getEventParticipants()` missing approval columns

**File**: `src/db/queries/attendance.ts` (line 14-46)

**Problem**: The SQL SELECT is missing `ep.approval_status`, `ep.approved_hours`, `ep.approved_by`, and `ep.approved_at`. These columns exist in the `event_participation` table and are needed for attendance management and hours approval workflows.

**Impact**: Attendance manager and hours approval pages cannot display approval status, approved hours, or who approved them.

**Fix**: Add these columns to the SELECT:
```sql
SELECT
  ep.id as participant_id,
  ep.volunteer_id,
  CONCAT(v.first_name, ' ', v.last_name) as volunteer_name,
  v.roll_number,
  v.branch,
  v.year,
  ep.participation_status,
  ep.hours_attended,
  ep.attendance_date,
  ep.registration_date,
  ep.notes,
  ep.approval_status,        -- ADD
  ep.approved_hours,          -- ADD
  ep.approved_by,             -- ADD
  ep.approved_at              -- ADD
FROM event_participation ep
...
```

Also add to the TypeScript return type:
```ts
approval_status: string | null
approved_hours: number | null
approved_by: string | null
approved_at: Date | null
```

---

### 3. Dashboard page always renders `AdminDashboard` - No role differentiation

**File**: `src/app/(dashboard)/dashboard/page.tsx`

**Problem**: The dashboard page always renders `<AdminDashboard>` regardless of user role. A volunteer seeing admin stats (total volunteers, pending reviews, etc.) is confusing and potentially leaks operational data.

**Current code**:
```tsx
export default async function DashboardPage() {
  await requireAuthServer()
  const [stats, trendRows] = await Promise.all([...])
  return (
    <div>
      <AdminDashboard initialData={{ stats, trends }} />  // ALWAYS admin
    </div>
  )
}
```

**Impact**: Volunteers and heads see admin-level stats instead of their own personalized dashboard.

**Fix**: Import both dashboards and conditionally render based on user role:
```tsx
import { AdminDashboard, VolunteerDashboard } from '@/components/dashboard'
import { getCurrentVolunteer } from '@/lib/auth-cache'

export default async function DashboardPage() {
  const volunteer = await requireAuthServer()

  // Determine user roles
  const roles = volunteer.roles || [] // however roles are retrieved

  if (roles.includes('admin')) {
    // Fetch admin-level data
    const [stats, trendRows] = await Promise.all([...])
    return <AdminDashboard initialData={{ stats, trends }} />
  }

  // For heads: could show HeadsDashboard (or VolunteerDashboard with extra info)
  // For volunteers: show VolunteerDashboard
  return <VolunteerDashboard />
}
```

**Note**: `VolunteerDashboard` component already exists at `src/components/dashboard/volunteer-dashboard.tsx` and is fully functional. It calls `getVolunteerDashboardData()` internally. It's already exported from `src/components/dashboard/index.ts` but is currently **never rendered by any page**.

---

## MEDIUM ISSUES (Will break when features are used or show incorrect labels)

### 4. User management page shows raw branch codes instead of display names

**File**: `src/components/users/user-management-page.tsx` (line 119)

**Problem**: `<TableCell>{volunteer.branch}</TableCell>` renders raw DB codes like `CMPN` instead of `Computer Engineering`.

**Fix**: Import and use the display name mapping:
```tsx
import { BRANCH_DISPLAY_NAMES } from '@/lib/constants'

// In the table cell:
<TableCell>{BRANCH_DISPLAY_NAMES[volunteer.branch] ?? volunteer.branch}</TableCell>
```

---

### 5. `getUserStats()` returns snake_case keys but components expect camelCase

**File**: `src/db/queries/reports.ts` (line 190-220)

**Problem**: Function returns `{ total_users, active_users, pending_users, admin_count }` but the `UserStats` type in `src/types/index.ts` expects camelCase.

**Fix - Option A (Recommended)**: Change the return keys to camelCase directly:
```ts
return {
  totalUsers: totalUsers?.count ?? 0,
  activeUsers: activeUsers?.count ?? 0,
  pendingUsers: pendingUsers?.count ?? 0,
  adminCount: adminCount?.count ?? 0,
}
```

**Fix - Option B**: Add a mapper function in `src/lib/mappers.ts` that converts.

---

### 6. `approvedHours` hardcoded to `0` in volunteer dashboard stats

**File**: `src/app/actions/volunteers.ts` (line 130-135)

**Problem**: The stats calculation in `getVolunteerDashboardData()` hardcodes `approvedHours: 0` instead of calculating from the actual participation data.

**Current code**:
```ts
const stats = {
  totalHours: participationHistory.reduce((sum, p) => sum + (p.hours_attended || 0), 0),
  approvedHours: 0,  // HARDCODED!
  eventsParticipated: participationHistory.length,
}
```

**Fix**: Calculate from participation data that already has `approval_status` and `approved_hours`:
```ts
approvedHours: participationHistory
  .filter((p: any) => p.approval_status === 'approved')
  .reduce((sum: number, p: any) => sum + (p.approved_hours || p.hours_attended || 0), 0),
```

Note: `getVolunteerParticipationHistory()` already returns `approval_status` and `approved_hours` (but `approved_hours` is available in the raw DB but not SELECTed — you'll need to add `ep.approved_hours` to that query too, see issue #8).

---

### 7. Reports page has no `ProtectedRoute` wrapper

**File**: `src/app/(dashboard)/reports/page.tsx`

**Problem**: The reports page is accessible to **any authenticated user** including volunteers. Reports contain aggregate organizational data that should likely be restricted to admin/head roles.

**Current code**:
```tsx
export default function Page() {
  return <ReportsPage />  // No role protection
}
```

**Fix**: Add ProtectedRoute wrapper:
```tsx
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'head']}>
      <ReportsPage />
    </ProtectedRoute>
  )
}
```

---

### 8. Report queries return snake_case but types expect camelCase (dormant but will break)

**Files**: `src/db/queries/reports.ts`

**Problem**: These query functions return snake_case column names from raw SQL, but when consumed by components or hooks they'll need camelCase. Currently **dormant** (the reports page uses `getEvents()` via `use-reports.ts` which maps correctly), but will break once any component uses these directly:

| Function | snake_case keys returned | Needs mapping? |
|---|---|---|
| `getCategoryDistribution()` | `category_id`, `category_name`, `event_count`, `color_hex`, `participant_count`, `total_hours` | Yes |
| `getTopEventsByImpact()` | `event_id`, `event_name`, `start_date`, `category_name`, `participant_count`, `total_hours`, `impact_score`, `event_status` | Yes |
| `getAttendanceSummary()` | `event_id`, `event_name`, `start_date`, `category_name`, `total_registered`, `total_present`, `total_absent`, `attendance_rate`, `total_hours` | Yes |
| `getVolunteerHoursSummary()` | `volunteer_id`, `volunteer_name`, `total_hours`, `approved_hours`, `events_count`, `last_activity` | Yes |

**Fix**: Add mapper functions in `src/lib/mappers.ts` for each, similar to the existing `mapEventRow` pattern. OR change the SQL aliases to use camelCase-compatible names and update the type annotations.

---

## LOW PRIORITY (Minor data gaps)

### 9. `mapParticipationRow` hardcodes `feedback: null`

**File**: `src/lib/mappers.ts` (line 82)

**Problem**: The `feedback` field is hardcoded to `null`. The `event_participation` table has a `notes` column that could serve as feedback, or a dedicated feedback column could be added.

**Fix**: Map `notes` to `feedback`:
```ts
feedback: r.notes ?? null,
```

---

### 10. `getVolunteerParticipationHistory()` missing `approved_hours`

**File**: `src/db/queries/reports.ts` (line 152-170)

**Problem**: The query SELECTs `ep.approval_status`, `ep.approved_by`, `ep.approved_at` but does NOT select `ep.approved_hours`. This means the volunteer dashboard can't calculate actual approved hours.

**Fix**: Add `ep.approved_hours` to the SELECT:
```sql
SELECT
  ...
  ep.approval_status,
  ep.approved_hours,          -- ADD THIS
  ep.approved_by,
  ep.approved_at
FROM event_participation ep
```

And add to the return type:
```ts
approved_hours: number | null
```

---

## ROLE-BASED FLOW AUDIT RESULTS

### Current Role System Architecture

The app has 3 roles with a hierarchy:
- **admin** (privilege level 100) - Full access
- **head** (privilege level 50) - Management access
- **volunteer** (privilege level 10) - Basic access

### What Works Correctly

| Area | Status | Notes |
|---|---|---|
| Auth Context | OK | `hasRole()`, `hasAnyRole()`, role hierarchy via `hasHigherOrEqualPrivilege` all work |
| Sidebar filtering | OK | `getFilteredNavItems(userRoles)` correctly hides menu items based on role |
| Nav config roles | OK | Admin section: `['admin']`, Management: `['admin', 'head']`, Main: no restriction |
| Categories page | OK | `allowedRoles={['admin', 'head']}` |
| Attendance Manager | OK | `allowedRoles={['admin', 'head']}` |
| Hours Approval | OK | `allowedRoles={['admin', 'head']}` |
| Role Management | OK | `allowedRoles={['admin']}` |
| User Management | OK | `allowedRoles={['admin']}` |
| Signup flow | OK | Sends correct metadata, creates volunteer record |
| Profile page | OK | Shows own data via `getMyProfile()` |

### What Needs Fixing

| Area | Issue | Severity |
|---|---|---|
| `/dashboard` page | Always renders `AdminDashboard` regardless of role | **CRITICAL** |
| `VolunteerDashboard` | Component exists but is orphaned (never rendered) | **CRITICAL** |
| `/reports` page | No `ProtectedRoute` wrapper - any user can access | **MEDIUM** |
| Heads dashboard | `getHeadsDashboardStats()` action exists but no dedicated HeadsDashboard component or page route | **LOW** |

### Expected Role-Based Behavior

```
/dashboard
  - admin  -> AdminDashboard (stats, trends, recent events, quick actions)
  - head   -> HeadsDashboard OR AdminDashboard with filtered data
  - volunteer -> VolunteerDashboard (my hours, my events, upcoming events)

/reports
  - admin  -> Full reports page (all data)
  - head   -> Reports page (filtered to their events)
  - volunteer -> BLOCKED (redirect to /dashboard)

/attendance-manager, /hours-approval, /categories
  - admin, head -> Access granted
  - volunteer   -> BLOCKED (redirect to /dashboard)

/role-management, /user-management
  - admin     -> Access granted
  - head      -> BLOCKED
  - volunteer -> BLOCKED

/events, /event-registration, /volunteers, /profile, /settings
  - All roles -> Access granted
```

---

## IMPLEMENTATION PRIORITY ORDER

1. **Fix `getEventsWithStats()` missing `declared_hours`** (Issue #1) - Affects every event display
2. **Fix dashboard role-based rendering** (Issue #3) - Core UX issue
3. **Fix `getEventParticipants()` missing approval columns** (Issue #2) - Blocks hours workflow
4. **Add reports page protection** (Issue #7) - Security concern
5. **Fix `getUserStats()` snake_case** (Issue #5) - Will crash user management
6. **Fix branch display names** (Issue #4) - Quick UI fix
7. **Fix volunteer `approvedHours` hardcode** (Issue #6) - Data accuracy
8. **Add `approved_hours` to participation history query** (Issue #10) - Data completeness
9. **Add report query mappers** (Issue #8) - Future-proofing
10. **Map feedback field** (Issue #9) - Minor data gap

---

## QUICK REFERENCE: Files to Modify

| File | Issues |
|---|---|
| `src/db/queries/events.ts` | #1 |
| `src/db/queries/attendance.ts` | #2 |
| `src/app/(dashboard)/dashboard/page.tsx` | #3 |
| `src/components/users/user-management-page.tsx` | #4 |
| `src/db/queries/reports.ts` | #5, #8, #10 |
| `src/app/actions/volunteers.ts` | #6 |
| `src/app/(dashboard)/reports/page.tsx` | #7 |
| `src/lib/mappers.ts` | #8, #9 |
