# Multi-Tenancy Implementation Roadmap

## Overview
This document breaks down the multi-tenancy migration into 7 phases with specific, testable tasks. Each phase should be completed and tested before moving to the next.

**Estimated Timeline:** 4-6 weeks (part-time) or 2-3 weeks (full-time)

---

## Phase 1: Foundation & Data Types (1-2 days)
**Goal:** Prepare data models without making breaking changes. This phase is safe - no UI or logic changes yet.

### P1.1: Update TypeScript Types
- [ ] Add `tenant_id: string` to `Appointment` type
- [ ] Add `tenant_id: string` to `TimeSlot` type
- [ ] Create new `Organization` type with fields: id, name, owner_uid, subscription_tier, status, created_at
- [ ] Create new `Tenant` type (user's view of org): id, name, role
- [ ] Add `tenant_id` field to `AuthUser` type (in authApi.ts)
- [ ] Create new `Settings` type with `tenant_id` field
- [ ] Create `CalendarToken` type: tenant_id, user_uid, provider, access_token, refresh_token, token_expires_at

**Files to modify:**
- `src/types/appointment.ts`
- `src/types/timeSlot.ts`
- `src/types/calendar.ts` (or create new types file)
- `src/api/authApi.ts`

**Verification:**
- No TypeScript errors
- All types compile successfully

---

### P1.2: Create Firestore Rules (Staged Deployment)
- [ ] Create backup of current `firestore.rules`
- [ ] Write new multi-tenant rules (use MULTI_TENANCY_ARCHITECTURE.md as reference)
- [ ] **DO NOT DEPLOY YET** - Just have it ready for Phase 2
- [ ] Add comment: "// Multi-tenant rules - deploy after migration script"

**File to create:**
- `firestore.rules.v2` (staging file with new rules)

**Key validation:**
- Rules syntax is valid (test in Firebase console)
- Helper functions test correctly

---

### P1.3: Create Migration Script
- [ ] Create `src/scripts/migrateToMultiTenant.ts`
- [ ] Implement migration logic (from ARCHITECTURE doc)
- [ ] **DO NOT RUN YET**
- [ ] Add safety checks:
  - Verify no tenant_id fields exist yet
  - Create DEFAULT_TENANT organization
  - Batch migrate time_slots
  - Batch migrate appointments
  - Update user document with tenant_id
  - Log all operations

**File to create:**
- `src/scripts/migrateToMultiTenant.ts`

**Testing:**
- Script runs without errors on test data
- Dry-run mode available

---

## Phase 2: Backend API Refactoring (3-4 days)
**Goal:** Make all API functions tenant-aware. This phase keeps UI working while changing internal logic.

### P2.1: Update firebaseApi.ts - Time Slots
- [ ] Update `listTimeSlots(tenantId: string)` - add `where("tenant_id", "==", tenantId)`
- [ ] Update `getTimeSlot(tenantId, id)` - verify tenant_id matches
- [ ] Update `createTimeSlot(tenantId, data)` - add tenant_id to doc
- [ ] Update `updateTimeSlot(tenantId, id, data)` - verify tenant before update
- [ ] Update `deleteTimeSlot(tenantId, id)` - verify tenant before delete
- [ ] Update batch operations for time slots

**Testing:**
- Functions accept tenantId parameter
- Queries filter by tenant
- No tenant-id leakage (add unit tests)

---

### P2.2: Update firebaseApi.ts - Appointments
- [ ] Update `listAppointments(tenantId)` - add tenant filter
- [ ] Update `getAppointment(tenantId, id)` - verify tenant_id
- [ ] Update `createAppointment(tenantId, data)` - add tenant_id to doc
- [ ] Update `updateAppointment(tenantId, id, data)` - verify tenant
- [ ] Update `deleteAppointment(tenantId, id)` - verify tenant
- [ ] Create `listAppointmentsByTenant(tenantId)` - explicit function

**Testing:**
- Each function verifies tenant_id
- Filters work correctly

---

### P2.3: Update firebaseApi.ts - Settings
- [ ] Update `getSettings(tenantId)` - query by tenant_id
- [ ] Update `updateSettings(tenantId, settings)` - add tenant_id to doc
- [ ] Handle settings structure with tenant isolation

**Testing:**
- Settings properly scoped by tenant

---

### P2.4: Create New Tenant Management Functions
- [ ] Create `createOrganization(name, ownerUid): Promise<string>` - returns tenant_id
- [ ] Create `getOrganization(tenantId): Promise<Organization>`
- [ ] Create `listTenantUsers(tenantId): Promise<AuthUser[]>`
- [ ] Create `getTenantByUser(userId): Promise<Tenant[]>` - list all tenants for user
- [ ] Create `updateOrganization(tenantId, updates): Promise<void>`
- [ ] Create `inviteUserToTenant(tenantId, email, role): Promise<void>` (can return empty for now)
- [ ] Create `removeUserFromTenant(tenantId, userId): Promise<void>`

**File to add functions to:**
- `src/api/firebaseApi.ts`

**Testing:**
- Organization CRUD works
- User list filtering works

---

## Phase 3: AuthContext Enhancement (2-3 days)
**Goal:** Make auth flow tenant-aware. Users now track which tenant they're in.

### P3.1: Extend AuthUser Type
- [ ] Update `AuthUser` type to include `tenant_id`
- [ ] Create `Tenant` type for org selection
- [ ] Create `AuthContextValue` type with `tenantId` and `tenants` fields

**File:**
- `src/context/AuthContext.tsx`

---

### P3.2: Update Login Flow
- [ ] After Firebase auth succeeds:
  - Get user document (includes tenant_id)
  - Load organization data
  - Set `tenantId` in context
  - Store to localStorage
- [ ] Handle first-time users:
  - Create organization during signup
  - Assign owner role
  - Set tenant_id on user doc

**Testing:**
- Login sets tenantId correctly
- tenantId persists in localStorage
- User can logout and login again

---

### P3.3: Add Tenant Switching
- [ ] Implement `switchTenant(tenantId): Promise<void>`
- [ ] Validate user belongs to tenant
- [ ] Update context and localStorage
- [ ] Refresh data on switch

**Testing:**
- Can switch between tenants
- Data updates correctly
- Cannot switch to unauthorized tenant

---

### P3.4: Session Persistence
- [ ] Load tenantId from localStorage on app load
- [ ] Validate tenant still exists
- [ ] Restore session state

**Testing:**
- Page refresh maintains tenantId
- Invalid tenantId defaults to first available

---

## Phase 4: Component & Hook Updates (3-4 days)
**Goal:** Make UI tenant-aware. Components now read `useAuth().tenantId` and pass it to API functions.

### P4.1: Create useFirestoreTenantQuery Hook
- [ ] Create `src/hooks/useFirestoreTenantQuery.ts`
- [ ] Hook accepts `(tenantId: string) => Promise<T>`
- [ ] Automatically includes tenantId from useAuth()
- [ ] Handles loading/error states

**Testing:**
- Hook passes tenantId to query function
- Refetches when tenantId changes

---

### P4.2: Update AdminSlots Component
- [ ] Import and use `useAuth()` to get tenantId
- [ ] Pass tenantId to `listAppointments(tenantId)`
- [ ] Pass tenantId to `getSettings(tenantId)`
- [ ] Use `useFirestoreTenantQuery` for queries
- [ ] Update all API calls

**Testing:**
- Component renders with tenant data
- Data updates when tenant changes
- No data leaks between tenants

---

### P4.3: Update AdminSettings Component
- [ ] Use `useAuth()` to get tenantId
- [ ] Pass tenantId to all API calls
- [ ] Update `getSettings(tenantId)`
- [ ] Update `updateSettings(tenantId, ...)`
- [ ] Update all setting sub-components

**Testing:**
- Settings load for current tenant
- Updates save to correct tenant

---

### P4.4: Update AdminAppointments Component
- [ ] Use `useAuth()` to get tenantId
- [ ] Pass tenantId to appointment queries
- [ ] Filter by tenant

**Testing:**
- Shows only current tenant's appointments

---

### P4.5: Update AdminUserManagement Component
- [ ] Use `useAuth()` to get tenantId
- [ ] Display tenant users only
- [ ] Implement invite/remove functions

**Testing:**
- Shows team members for current tenant

---

### P4.6: Update BookAppointment Component
- [ ] Accept `tenantId` from URL params: `/book/:tenantId`
- [ ] Load tenant settings without auth
- [ ] Create appointments with tenant_id

**Testing:**
- Public booking works with tenantId
- Appointment goes to correct tenant

---

## Phase 5: New Multi-Tenant Features (3-4 days)
**Goal:** Enable multi-tenancy workflows. Add UI for organizations and team management.

### P5.1: Create Organization Setup Page
- [ ] Create `src/pages/OrganizationSetup.tsx`
- [ ] Route: `/admin/organization/setup` or `/onboarding`
- [ ] Form: organization name, type
- [ ] On submit:
  - Call `createOrganization(name, uid)`
  - Get back tenantId
  - Create/update user doc with tenant_id
  - Redirect to dashboard
- [ ] Handle: user already has organization

**Testing:**
- Can create new organization
- User automatically in new org
- Redirects to dashboard

---

### P5.2: Create Team Management Page
- [ ] Create `src/pages/TeamManagement.tsx`
- [ ] Route: `/admin/team`
- [ ] Display:
  - List of current team members (name, role, email, status)
  - Invite form (email, role dropdown)
- [ ] Functionality:
  - Invite user: `inviteUserToTenant(tenantId, email, role)`
  - Remove user: `removeUserFromTenant(tenantId, userId)`
  - Update role: `updateUserRole(tenantId, userId, role)`
- [ ] Permissions: only owner/admin can manage team

**Testing:**
- Can invite users
- Can remove users
- Can update roles
- Only authorized users see page

---

### P5.3: Create Tenant Switcher Component
- [ ] Create `src/components/TenantSwitcher.tsx`
- [ ] Show dropdown if user has multiple tenants
- [ ] Show current tenant name
- [ ] On select: call `useAuth().switchTenant(tenantId)`
- [ ] Add to header/navbar

**Testing:**
- Shows all user's tenants
- Can switch between them
- Data updates on switch

---

### P5.4: Create Public Booking Route
- [ ] Create route: `/book/:tenantId`
- [ ] Make component public (no auth required)
- [ ] Load tenant settings by tenantId
- [ ] Display booking form (reuse existing form)
- [ ] On submit: create appointment with tenant_id
- [ ] Add link generation tool (admin can copy shareable link)

**Testing:**
- Can book without auth
- Booking creates appointment for correct tenant
- Each tenant has unique URL

---

### P5.5: Update Navigation & Routes
- [ ] Add `/admin/team` route
- [ ] Add `/admin/organization/setup` route
- [ ] Add `/book/:tenantId` route
- [ ] Update navigation based on user role
- [ ] Add tenant switcher to header

**Testing:**
- All routes accessible as expected
- Permissions enforced correctly

---

## Phase 6: Calendar Integration - Multi-Tenant (2-3 days)
**Goal:** Store and manage calendar tokens per-tenant instead of globally.

### P6.1: Create calendar_tokens Collection
- [ ] Create `calendar_tokens/{tenantId}_{userId}` structure
- [ ] Fields: tenant_id, user_uid, provider, access_token, refresh_token, token_expires_at, created_at
- [ ] Add to Firestore rules (read/write only by admin in tenant)

**Testing:**
- Rules allow only tenant admins to access
- Structure matches schema

---

### P6.2: Update OAuth Callback Handlers
- [ ] Google callback (`GoogleOAuthCallback.tsx`):
  - Get tenantId from useAuth()
  - Save token to `calendar_tokens/{tenantId}_{uid}`
  - Call `saveCalendarToken(tenantId, uid, provider, tokens)`
- [ ] Outlook callback (`OutlookOAuthCallback.tsx`):
  - Same flow

**Testing:**
- Tokens save to correct tenant location
- Can switch tenants without losing other tenant's tokens

---

### P6.3: Create Calendar Token Management Functions
- [ ] Create `saveCalendarToken(tenantId, uid, provider, tokens): Promise<void>`
- [ ] Create `getCalendarToken(tenantId, uid): Promise<CalendarToken | null>`
- [ ] Create `deleteCalendarToken(tenantId, uid): Promise<void>`
- [ ] Add token encryption (optional, use Firestore encryption)

**File:**
- `src/api/firebaseApi.ts` (add functions)

**Testing:**
- Can save token for tenant
- Can retrieve token
- Cannot access other tenant's tokens

---

### P6.4: Update Backend Calendar API
- [ ] Update `/api/calendar/events` endpoint:
  - Extract tenantId from request
  - Get token from `calendar_tokens/{tenantId}_{userId}`
  - Fetch calendar events using token
  - Return events
- [ ] Update `/api/calendar/status` endpoint similarly

**File:**
- `api/calendar/events.ts`
- `api/calendar/status.ts`

**Testing:**
- API fetches events for correct tenant
- Token validation works
- Cannot fetch other tenant's events

---

### P6.5: Update Calendar Integration Settings Page
- [ ] Show calendar integration status per tenant
- [ ] Disconnect button per provider
- [ ] Calls `deleteCalendarToken(tenantId, uid)`

**Testing:**
- Can disconnect without affecting other tenants

---

## Phase 7: Deployment & Testing (2-3 days)
**Goal:** Migrate live data and test thoroughly before final deployment.

### P7.1: Pre-Migration Checklist
- [ ] Backup Firestore database (export to CSV)
- [ ] Backup Firebase Auth users list
- [ ] Review all Phase 1-6 changes
- [ ] All unit tests passing
- [ ] All component tests passing

**Testing:**
- No breaking changes remain
- All functions have tenant_id support

---

### P7.2: Deploy Firestore Rules
- [ ] Replace `firestore.rules` with new multi-tenant rules
- [ ] Deploy to Firebase
- [ ] Verify rules deploy successfully
- [ ] Test rules in Firebase console

**Testing:**
- Sample queries respect tenant boundaries
- Admin operations work as expected

---

### P7.3: Run Migration Script
- [ ] Execute migration script:
  ```bash
  npm run migrate:multi-tenant
  ```
- [ ] Verify:
  - DEFAULT_TENANT created
  - Current user assigned to DEFAULT_TENANT
  - All time_slots have tenant_id
  - All appointments have tenant_id
  - All settings have tenant_id
- [ ] Check Firestore for data integrity

**Testing:**
- All documents have tenant_id
- No data missing
- Queries work with new structure

---

### P7.4: Test Single-Tenant Scenario (Day 1)
- [ ] Start fresh as existing user:
  - Login as original user
  - Verify tenantId loaded from user doc
  - Verify DEFAULT_TENANT context set
  - Verify all appointments visible
  - Verify all slots visible
  - Verify all settings accessible
- [ ] Test all admin pages:
  - Slots management ✓
  - Appointments ✓
  - Settings ✓
  - Users/team ✓
- [ ] Test booking:
  - Navigate to `/book/{tenantId}`
  - Create appointment ✓
  - Verify appointment visible to admin ✓

**Testing:**
- Single tenant scenario works identically to before
- No data loss
- No performance regression

---

### P7.5: Test Multi-Tenant Scenario (Day 2)
- [ ] Create second organization:
  - Signup as new user
  - Create organization
  - Verify user assigned as owner
  - Verify new tenantId created
- [ ] Test tenant isolation:
  - Create appointment in org1
  - Switch to org2
  - Verify org1 appointment NOT visible
  - Create appointment in org2
  - Switch to org1
  - Verify only org1 appointment visible
- [ ] Test team features:
  - Invite user2 to org1 as admin
  - User2 should see org1 data
  - User2 cannot see org2 data
- [ ] Test team switching:
  - User1 create org1
  - User1 create org2
  - Test tenant switcher
  - Verify data updates on switch

**Testing:**
- Complete data isolation
- No cross-tenant data leakage
- Team functionality works

---

### P7.6: Performance Testing
- [ ] Measure query performance with tenant filter
- [ ] Check index usage
- [ ] Monitor for N+1 query problems
- [ ] Load test with multiple tenants
- [ ] Check Firestore billing impact

**Testing:**
- Queries still performant
- No unnecessary index scans
- Billing within expectations

---

### P7.7: Security Audit
- [ ] Review all Firestore rules
- [ ] Verify users cannot query cross-tenant
- [ ] Verify public endpoints are secure
- [ ] Test as unauthenticated user
- [ ] Test as user from different tenant
- [ ] Verify role-based access working

**Testing:**
- No security vulnerabilities
- All access controls working

---

### P7.8: Documentation & Cleanup
- [ ] Update README.md with multi-tenant features
- [ ] Document admin workflows
- [ ] Document user invitation flow
- [ ] Document public booking link creation
- [ ] Clean up temporary/staging files
- [ ] Update comments in code

**Testing:**
- Codebase clean and documented
- New users understand multi-tenancy

---

## Dependency Graph

```
Phase 1 (Types & Rules)
    ↓
Phase 2 (Backend API)
    ↓
Phase 3 (AuthContext)
    ↓
Phase 4 (Components)
    ↓
Phase 5 (Features)
    ↓
Phase 6 (Calendar)
    ↓
Phase 7 (Deployment)
```

**NOTE:** Phases must be completed in order. Do not skip phases.

---

## Testing Strategy

### Unit Tests (After each phase)
- API functions return correct data
- Functions validate tenantId
- No cross-tenant data access

### Integration Tests (Phase 4-5)
- Components load correct tenant data
- Auth flow works end-to-end
- Tenant switching works

### E2E Tests (Phase 7)
- Full user workflows
- Cypress tests for:
  - Single tenant admin tasks
  - Multi-tenant user tasks
  - Public booking

### Manual Testing (Phase 7)
- Browser testing
- Mobile testing
- Calendar integration
- Email notifications

---

## Rollback Plan

If issues occur:

1. **Before P7.3 (Migration):** Simply revert code changes
2. **After P7.3:** Restore from Firestore backup, revert Firestore rules, redeploy old code
3. **After going live:** Keep DEFAULT_TENANT, gradually migrate new organizations

---

## Success Criteria

✅ Phase complete when:
- All tasks checked off
- Code compiles/runs without errors
- Tests pass (manual or automated)
- No data lost from previous phase
- Single-tenant scenario still works
- Ready to move to next phase

---

## Quick Reference: What Gets Changed Each Phase

| Phase | Files Changed | Breaking Changes? | Can Rollback? |
|-------|---------------|-------------------|---------------|
| 1 | Types, Rules (staged) | No | Yes |
| 2 | firebaseApi.ts | Requires tenantId | Yes |
| 3 | AuthContext.tsx | Added fields (backward compat) | Yes |
| 4 | All components | Refactored queries | Yes |
| 5 | New pages, routes | New features | Yes |
| 6 | Calendar API, OAuth | Token storage moved | Yes (backup tokens) |
| 7 | Database, Rules live | ⚠️ Live data migration | Backup restore |

