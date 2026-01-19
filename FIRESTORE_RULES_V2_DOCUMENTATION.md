# Firestore Rules v2 - Multi-Tenant Architecture Documentation

**Status:** STAGING (DO NOT DEPLOY) - Testing in Firebase Console  
**Created:** January 17, 2026  
**Backup Location:** `firestore.rules.backup`

---

## Overview

Firestore Rules v2 transforms the single-tenant booking system into a **multi-tenant, multi-branch architecture** with subscription tier-based feature access. 

### Key Changes from v1 → v2

| Aspect | v1 (Single-Tenant) | v2 (Multi-Tenant) |
|--------|-------------------|-------------------|
| **Scoping** | Global (all data together) | org_id + branch_id (isolated) |
| **Admin Model** | Global admin role | Org admin (manages only their org) |
| **Data Isolation** | None (single company) | Complete (separate orgs cannot see each other's data) |
| **Branch Support** | Not supported | Full multi-branch per organization |
| **Feature Access** | Not restricted | Tier-based (FREE, STARTER, PROFESSIONAL, ENTERPRISE) |
| **User Assignment** | Not scoped | Per-branch role assignments |
| **Public Booking** | Enabled | Enabled + org/branch scoped |

---

## Authentication & Authorization Model

### Helper Functions (Reference)

```
isAuthenticated()              → User has Firebase Auth token
getUserDoc()                   → Fetch user's Firestore document
isOrgAdmin(orgId)             → User is admin in organization
userBelongsToOrg(orgId)       → User's org_id matches
userBelongsToBranch(orgId, branchId) → User assigned to branch
userHasRoleInBranch(orgId, branchId, role) → User role in branch
getOrgDoc(orgId)              → Fetch organization document
getOrgTier(orgId)             → Get subscription tier (FREE/STARTER/PROFESSIONAL/ENTERPRISE)
hasTierFeature(orgId, feature) → Check if tier has feature enabled
```

---

## Collections & Security Rules

### 1. ORGANIZATIONS

**Document ID:** `{orgId}`  
**Structure:** `{ org_id, name, subscription_tier, subscription_status, current_user_count, stripe_customer_id, ... }`

**Read Access:**
- ✅ Organization admins can read their own organization

**Write Access:**
- ✅ Organization admins can update (except created_by, created_at, org_id)
- ❌ Users cannot create/delete organizations

**Notes:**
- Organization creation happens server-side only (backend API)
- Subscription tier is immutable (updated via billing system)

---

### 2. USERS

**Document ID:** `{userId}` (Firebase UID)  
**Structure:** `{ uid, email, name, role, org_id, branch_assignments, ... }`

**Read Access:**
- ✅ User can read their own profile
- ✅ Org admins can read users in their organization

**Write Access:**
- ✅ User can create their own profile during signup
- ✅ User can update their own basic info
- ✅ Org admins can update any user in their organization
- ❌ Deletion restricted (use deactivation instead)

**Branch Assignments Format:**
```javascript
branch_assignments: {
  "branch-id-1": "admin",      // User is admin in this branch
  "branch-id-2": "staff",      // User is staff in this branch
}
```

**Notes:**
- Role field: 'admin' (org admin) or other role (team member)
- branch_assignments controls per-branch access
- org_id ties user to organization

---

### 3. BRANCHES

**Document ID:** `{branchId}` (generated UUID)  
**Structure:** `{ org_id, branch_id, name, address, location, timezone, created_at, created_by, ... }`

**Read Access:**
- ✅ Any user in the organization can read branches
- ❌ Users outside the organization cannot see branches

**Write Access:**
- ✅ Org admins can update branch (except org_id, created_at, created_by)
- ❌ Users cannot create/delete branches

**Notes:**
- Branch creation/deletion is server-side only
- Each branch is an independent calendar instance
- Timezone stored for correct time calculations

---

### 4. SETTINGS

**Document ID:** `{orgId}_{branchId}` (composite key)  
**Structure:** `{ org_id, branch_id, working_hours, booking_settings, calendar_settings, ... }`

**Read Access:**
- ✅ Anyone can read settings (needed for public booking page)

**Write Access:**
- ✅ Org admins can update settings for their branches
- ❌ Other users cannot modify settings

**Notes:**
- Settings are branch-specific (each branch has own settings)
- Document ID enforces org+branch isolation
- Public read allows booking page to load settings without auth

---

### 5. TIME_SLOTS

**Document ID:** `{slotId}` (generated UUID)  
**Structure:** `{ org_id, branch_id, date, start_time, end_time, status, created_by, ... }`

**Read Access:**
- ✅ Anyone can read (needed for public booking)

**Write Access:**
- ✅ Authenticated users assigned to the branch can create/update slots
- ✅ Org admins can delete slots
- ❌ Unauthenticated users cannot create slots

**Key Validation:**
- Required fields: org_id, branch_id, date, start_time, end_time
- All slot operations must include org_id and branch_id

**Notes:**
- org_id and branch_id filter enforcement prevents cross-organization access
- Public read enables availability display on booking page

---

### 6. APPOINTMENTS

**Document ID:** `{appointmentId}` (generated UUID)  
**Structure:** `{ org_id, branch_id, customerName, customerEmail, date, time, status, notes, ... }`

**Read Access:**
- ✅ Anyone can read appointments (for confirmations and admin dashboard)

**Write Access:**
- ✅ Public booking: Anyone can create appointments (public form)
- ✅ Branch users can update appointments in their branch
- ✅ Org admins can delete appointments
- ❌ Unauthenticated users cannot update

**Public Booking Requirements:**
- Required fields: org_id, branch_id, customerName, customerEmail, date, time
- date must be timestamp
- time must be string

**Authenticated Update Rules:**
- User must belong to the organization
- User must be assigned to the branch
- User cannot modify org_id, branch_id, or created_at

**Notes:**
- org_id and branch_id are mandatory (no single-tenant fallback)
- Public creation enables booking without login
- Branch scoping prevents users from seeing/editing other branches' appointments

---

### 7. CALENDAR_TOKENS

**Document ID:** `{orgId}_{branchId}_{userId}` (composite key)  
**Structure:** `{ org_id, branch_id, user_uid, provider, access_token, refresh_token, expires_at, ... }`

**Read Access:**
- ✅ Token owner can read their own token
- ✅ Org admins can read tokens (for troubleshooting)

**Write Access:**
- ✅ User can create their own token for their assigned branch
- ✅ User can update their own token (refreshes)
- ✅ User can delete their own token
- ✅ Org admin can delete any token
- ❌ User cannot create tokens for other users

**Key Validation:**
- Required fields: org_id, branch_id, user_uid, provider
- Token ownership verified via userId matching

**Notes:**
- Document ID format prevents key collisions
- Tokens are branch-specific (each branch can have separate calendar)
- Provider: 'google' or 'outlook'

---

### 8. CALENDAR_EVENTS

**Document ID:** `{orgId}_{branchId}_{externalEventId}` (composite key)  
**Structure:** `{ org_id, branch_id, external_event_id, title, start, end, last_synced, ... }`

**Read Access:**
- ✅ Branch users can read events in their branch only
- ❌ Other users/branches cannot see events

**Write Access:**
- ❌ Frontend cannot write events (backend/cloud function only)
- ✅ Backend syncs events from external calendars

**Notes:**
- No frontend writes (events are read-only from external calendars)
- Backend cloud function handles sync
- Enables feature flags: FREE has 24hr sync, ENTERPRISE has real-time

---

### 9. ORGANIZATIONS_USAGE

**Document ID:** `{orgId}`  
**Structure:** `{ org_id, current_user_count, current_admin_count, current_branch_count, api_calls_today, ... }`

**Read Access:**
- ✅ Org admins can read their organization's usage

**Write Access:**
- ❌ Frontend cannot write (backend only)
- ✅ Backend updates usage counters

**Notes:**
- Tracks current usage against tier limits
- Updated by backend functions (Phase 2.4)
- Used for tier limit enforcement (e.g., can't add user if at limit)

---

## Data Isolation & Security Model

### Organization Isolation

Every document includes `org_id`. Firestore rules enforce:
```
- Users can only query/access documents where org_id matches their org_id
- Org admins cannot see other organizations' data
- Cross-org queries are impossible
```

### Branch Isolation (Within Organization)

Branch-scoped collections include both `org_id` AND `branch_id`. Rules enforce:
```
- Users must be assigned to the branch (via branch_assignments)
- Users can only access data for branches they're assigned to
- Org admin can access all branches in their organization
```

### Public Data

Some collections are public (no auth required):
- `settings` - Needed for public booking page
- `time_slots` - Needed to show availability
- `appointments` - Needed for booking confirmation

**Important:** Public collections still have org_id + branch_id, so public access is still isolated by organization/branch.

---

## Tier-Based Feature Access

The `hasTierFeature()` function checks subscription tier before allowing certain operations:

### FREE Tier
- Calendar: Read-only (24-hour sync frequency)
- API Access: ❌ Not allowed
- White-Label: ❌ Not allowed
- Users: 1 maximum
- Branches: 1 maximum

### STARTER Tier
- Calendar: Read/write (4-hour sync frequency)
- API Access: ❌ Not allowed
- White-Label: ❌ Not allowed
- Users: 10 maximum
- Branches: 3 maximum

### PROFESSIONAL Tier
- Calendar: Read/write (1-hour sync frequency)
- API Access: ✅ Allowed (1000 req/day)
- White-Label: ❌ Not allowed
- Users: 50 maximum
- Branches: 10 maximum

### ENTERPRISE Tier
- Calendar: Real-time sync
- API Access: ✅ Allowed (unlimited)
- White-Label: ✅ Allowed
- Users: Unlimited
- Branches: Unlimited

---

## Testing Checklist (Before Deployment)

### Setup in Firebase Console

1. **Create test organizations:**
   - Test-Org-1 (FREE tier, 1 user)
   - Test-Org-2 (PROFESSIONAL tier, 2 users)

2. **Create test branches:**
   - Test-Org-1 has 1 branch
   - Test-Org-2 has 3 branches

3. **Create test users:**
   - admin1@test.com (admin in Test-Org-1)
   - staff1@test.com (staff in Test-Org-1, branch-1)
   - admin2@test.com (admin in Test-Org-2)
   - staff2@test.com (staff in Test-Org-2, branch-1 and branch-2)

### Test Cases

**Org Isolation:**
- [ ] admin1 cannot read admin2's organization
- [ ] admin1 cannot read Test-Org-2 branches
- [ ] Query for another org's appointments returns nothing

**Branch Isolation:**
- [ ] staff1 cannot access Test-Org-1 branch-2 (if not assigned)
- [ ] staff2 can access branch-1 and branch-2, not branch-3
- [ ] Appointment in branch-2 not visible to staff1

**Admin Permissions:**
- [ ] admin1 can read all of Test-Org-1 data
- [ ] admin1 can update settings for any branch
- [ ] admin1 can delete appointments in any branch

**Public Access:**
- [ ] Unauthenticated user can read settings
- [ ] Unauthenticated user can read time_slots
- [ ] Unauthenticated user can create appointment (with org_id, branch_id)
- [ ] Unauthenticated user cannot create appointment without org_id

**Calendar Tokens:**
- [ ] staff1 can create token for themselves
- [ ] staff1 cannot create token for staff2
- [ ] admin1 can read staff1's token
- [ ] staff1 cannot read staff2's token

**User Management:**
- [ ] New user creates their own profile
- [ ] Org admin can update user's branch_assignments
- [ ] User cannot modify their own org_id

---

## Deployment Procedure

**WHEN READY (Phase 7.2):**

1. Backup current rules:
   ```
   Already done: firestore.rules.backup
   ```

2. Test v2 rules in Firebase Console:
   - Use "Rules Simulator" in Firebase Console
   - Run all test cases above

3. Deploy to production:
   ```bash
   # After testing confirms all rules work:
   firebase deploy --only firestore:rules
   ```

4. Verify deployment:
   - Check Firebase Console confirms new rules active
   - Run test queries from admin app
   - Monitor Firestore access logs

5. Rollback procedure (if needed):
   ```bash
   # Copy rules from firestore.rules.backup back to firestore.rules
   firebase deploy --only firestore:rules
   ```

---

## Important Notes

### Tier Limits Enforcement

**⚠️ CRITICAL:** Tier limits (max users, max branches) are enforced in:
- **Phase 2.4 (Firestore Rules):** NOT enforced in rules (too complex)
- **Phase 2.4 (API Layer):** YES, enforced via backend functions

This is intentional. Firestore rules check tier features, API layer enforces tier limits.

### No Breaking Changes

These rules are designed to work with Phase 1.3 Migration Script:
- Optional org_id, branch_id during Phase 1 (default values)
- Rules work with both old and new data
- Migration script adds org_id, branch_id to existing documents

### Backend Responsibilities

Backend (Phase 2+) must:
1. Create organizations and users
2. Assign users to branches
3. Track tier limits (user count, branch count)
4. Enforce tier limits before operations
5. Sync calendar events (cloud functions)
6. Update usage counters

### Frontend Responsibilities

Frontend must:
1. Include org_id and branch_id in all operations
2. Display current org/branch to user
3. Prevent cross-organization queries
4. Handle tier-specific UI (hide API/white-label for free tier)

---

## Troubleshooting

### "Permission Denied" Errors

1. Check user's org_id matches resource
2. Check user's branch_assignments includes branch
3. Verify org_id and branch_id included in write request
4. Check user's role (admin vs staff)

### Cross-Organization Visibility

1. Ensure org_id in all queries
2. Verify branch_id in branch-scoped collections
3. Check getUserDoc() returns correct org_id

### Public Booking Not Working

1. Verify org_id and branch_id in POST request
2. Check settings collection has matching document
3. Ensure required fields: customerName, customerEmail, date, time

---

## Summary

Firestore Rules v2 establishes:
- ✅ Complete organization-level data isolation
- ✅ Branch-level access control and role-based assignment
- ✅ Tier-based feature gating
- ✅ Public booking endpoints (org/branch scoped)
- ✅ Admin and staff role differentiation
- ✅ Safe multi-tenant architecture

**Status:** Ready for Firebase Console testing. **Do not deploy until all test cases pass.**

