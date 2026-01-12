# NSS Database Schema - Inconsistencies Analysis

> **Generated**: 2026-01-12
> **Files Analyzed**: `psql_schema_v7.sql` (956 lines), `nss_public_schema.sql` (1891 lines)

---

## Executive Summary

This document identifies all inconsistencies between the designed schema (v7) and the actual production Supabase database. Two **CRITICAL** issues were found that would break the application if v7 were deployed to a fresh instance.

---

## Critical Issues

### 1. Missing Functions (App Will Break)

| Function | In v7? | Called by App? | Status |
|----------|--------|----------------|--------|
| `get_user_stats()` | NO | YES (`UserManagementPage.tsx:70`) | **CRITICAL** |
| `get_volunteer_hours_summary()` | NO | YES (`HeadsDashboard.tsx:83`) | **CRITICAL** |

**Impact**: Application will crash with "function does not exist" errors.

### 2. UUID Generation Incompatible with Supabase

| Schema | Method |
|--------|--------|
| v7 | `uuid_generate_v4()` |
| Production | `extensions.uuid_generate_v4()` |

**Impact**: v7 won't work on Supabase - the extension is in `extensions` schema, not `public`.

---

## Complete Inconsistency List

### A. Functions

#### Present in Production, Missing in v7:

| Function | Purpose | Used by App? |
|----------|---------|--------------|
| `get_user_stats()` | User statistics (total, active, pending, admin count) | YES |
| `get_volunteer_hours_summary()` | Volunteer hours summary with rankings | YES |
| `has_role(text)` | Check if user has specific role | No |
| `has_any_role(text[])` | Check if user has any of specified roles | No |
| `can_register_for_event(uuid)` | Validate event registration | No |
| `create_event(...)` | Create event with security definer | No |
| `register_for_event(uuid, int)` | Register for event | No |
| `realtime_broadcast_changes()` | Trigger function for realtime | Triggers |
| `trigger_set_updated_at()` | Auto-update updated_at column | Triggers |

#### Functions in Both (Verified Working):

- `get_current_volunteer()` - Core auth function
- `get_events_with_stats()` - Events listing
- `get_dashboard_stats()` - Dashboard metrics
- `get_monthly_activity_trends()` - Monthly trends
- `get_category_distribution()` - Category analytics
- `get_top_events_by_impact(int)` - Top events
- `get_volunteers_with_stats()` - Volunteer listing
- `get_attendance_summary()` - Attendance stats
- `get_event_participants(uuid)` - Event participants
- `get_volunteer_participation_history(uuid)` - Volunteer history
- `mark_event_attendance(...)` - Mark attendance
- `sync_event_attendance(...)` - Sync attendance
- `update_event_attendance(...)` - Update attendance

---

### B. Views

#### Present in Production, Missing in v7:

| View | Purpose | Columns |
|------|---------|---------|
| `event_summary` | Comprehensive event analytics | id, name, description, dates, hours, category, participants, capacity |
| `role_management` | Role assignment management | volunteer info, role info, assignment details |
| `volunteer_summary` | Volunteer with stats | volunteer info, roles, participation counts, hours |

---

### C. Triggers

#### Present in Production, Missing in v7:

**Realtime Broadcast Triggers:**
- `event_categories_realtime_broadcast`
- `event_participation_realtime_broadcast`
- `events_realtime_broadcast`
- `user_roles_realtime_broadcast`
- `volunteers_realtime_broadcast`

**Note**: v7 changelog says "Removed realtime broadcast triggers (not needed)" but app uses realtime subscriptions. However, postgres_changes can work without these custom triggers.

---

### D. Indexes

#### v7 Has (10 indexes):
```
volunteers_auth_user_id_idx
volunteers_email_idx
user_roles_volunteer_id_idx
user_roles_role_definition_id_idx
events_category_id_idx
events_created_by_volunteer_id_idx
event_participation_event_id_idx
event_participation_volunteer_id_idx
idx_event_participation_status
idx_event_participation_volunteer
```

#### Production Has (24+ indexes) - Missing in v7:
```
idx_events_active (partial)
idx_events_end_date
idx_events_start_date
idx_events_status
idx_participation_registration
idx_participation_status
idx_participation_event
idx_participation_volunteer
idx_role_definitions_active (partial)
idx_role_definitions_hierarchy
idx_role_definitions_name
idx_user_roles_active (partial)
idx_user_roles_expires
idx_user_roles_role_def
idx_user_roles_volunteer
idx_volunteers_active (partial)
idx_volunteers_branch
idx_volunteers_year
idx_volunteers_roll_number
idx_volunteers_email
idx_volunteers_auth_user
```

---

### E. Foreign Keys

| Relationship | v7 | Production | Recommended |
|--------------|-----|------------|-------------|
| `event_participation.event_id` | No action | `ON DELETE CASCADE` | CASCADE |
| `event_participation.volunteer_id` | No action | `ON DELETE CASCADE` | CASCADE |
| `event_participation.recorded_by_volunteer_id` | No action | `ON DELETE RESTRICT` | RESTRICT |
| `volunteers.auth_user_id` | No action | `ON DELETE CASCADE` | CASCADE |
| `user_roles.volunteer_id` | No action | `ON DELETE CASCADE` | CASCADE |
| `user_roles.role_definition_id` | No action | `ON DELETE CASCADE` | CASCADE |
| `user_roles.assigned_by` | No action | `ON DELETE SET NULL` | SET NULL |
| `events.created_by_volunteer_id` | No action | `ON DELETE RESTRICT` | RESTRICT |
| `events.category_id` | No action | No action | Keep |

---

### F. Column Differences

#### event_participation table:

| Column | v7 | Production |
|--------|-----|------------|
| `declared_hours` | `DEFAULT 0 CHECK (declared_hours >= 0)` | `DEFAULT 0` (no CHECK) |
| `approved_hours` | `CHECK (approved_hours >= 0)` | No CHECK |
| `hours_attended` | `CHECK (hours_attended >= 0)` | `CHECK (hours_attended >= 0)` |

**Recommendation**: Keep CHECK constraints for data integrity.

---

### G. Schema Comments

| Location | v7 | Production |
|----------|-----|------------|
| Schema comment | "v7" | "v5" (outdated) |

---

## Database Usage Analysis

### RPC Functions Called by Application:

| Function | Locations | Files |
|----------|-----------|-------|
| `get_dashboard_stats` | 3 | useDashboardStats.ts, useDashboardStatsOptimized.ts, DashboardCacheContext.tsx |
| `get_monthly_activity_trends` | 3 | useDashboardStats.ts, useDashboardStatsOptimized.ts, DashboardCacheContext.tsx |
| `get_volunteers_with_stats` | 1 | useVolunteers.ts |
| `get_category_distribution` | 1 | useReports.ts |
| `get_top_events_by_impact` | 1 | useReports.ts |
| `get_attendance_summary` | 1 | useAttendance.ts |
| `get_event_participants` | 1 | useAttendance.ts |
| `get_current_volunteer` | 1 | AuthContext.tsx |
| `get_user_stats` | 1 | UserManagementPage.tsx |
| `get_events_with_stats` | 1 | EventsPage.tsx |
| `get_volunteer_hours_summary` | 1 | HeadsDashboard.tsx |

### Tables Directly Queried:

| Table | Operations | Primary Locations |
|-------|------------|-------------------|
| `volunteers` | SELECT, INSERT, UPDATE | AuthContext.tsx, useVolunteers.ts, AdminDashboard.tsx |
| `events` | SELECT, INSERT, UPDATE | useEvents.ts, DashboardCacheContext.tsx, AdminDashboard.tsx |
| `event_participation` | SELECT, INSERT | useEvents.ts, AdminDashboard.tsx |
| `event_categories` | SELECT | EventsPage.tsx |
| `user_roles` | SELECT, INSERT | AuthContext.tsx |
| `role_definitions` | SELECT | AuthContext.tsx |

### Unused Functions (Safe to Keep for Future):

- `has_role()` - Useful for RLS policies
- `has_any_role()` - Useful for RLS policies
- `can_register_for_event()` - Event validation utility
- `create_event()` - SECURITY DEFINER event creation
- `register_for_event()` - SECURITY DEFINER registration

---

## Recommendations for v8

### Must Fix:
1. Add `get_user_stats()` function
2. Add `get_volunteer_hours_summary()` function
3. Change UUID generation to `extensions.uuid_generate_v4()` or `gen_random_uuid()`

### Should Include:
1. All 24+ indexes from production
2. Foreign key CASCADE/RESTRICT rules
3. All 3 views
4. Keep utility functions for future use

### Optional:
1. Realtime broadcast triggers (app works without them via postgres_changes)
2. `trigger_set_updated_at()` function (convenient but not critical)

---

## Migration Path

### For Existing Database:
- No migration needed - production already has everything

### For Fresh Supabase Instance:
1. Run `psql_schema_v8.sql` which includes all fixes
2. Verify with test queries
3. Connect application

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v5 | Original | Initial schema |
| v6 | - | Added dashboard functions |
| v7 | 2024-11-23 | Consolidated migrations, removed realtime triggers |
| v8 | 2026-01-12 | Fixed inconsistencies, added missing functions |
