# Final Multi-Tenancy Architecture (Approved Design)

**Status:** Architecture Finalized - Ready for Phase 1 Implementation  
**Date:** January 17, 2026

---

## Core Decisions (LOCKED IN)

### Tier Structure

```
FREE TIER
├─ Cost: $0 forever
├─ Limits:
│  ├─ Max Branches: 1
│  ├─ Max Users: 1 (owner only)
│  ├─ User Count: Includes ALL invited/inactive users
│  └─ Max Admins: 1 (the owner)
├─ Features:
│  ├─ Calendar Integration: YES (limited - read-only for FREE, 1 calendar max)
│  ├─ API Access: NO
│  ├─ White-Label: NO
│  └─ Support: Community/Email (best effort)
│
├─ STARTER TIER
├─ Cost: $X/month (TBD)
├─ Limits:
│  ├─ Max Branches: 3
│  ├─ Max Users: 10
│  └─ Max Admins: 3
├─ Features:
│  ├─ Calendar Integration: YES (full - read/write, multiple calendars)
│  ├─ API Access: NO
│  ├─ White-Label: NO
│  └─ Support: Email (24-48hr response)
│
├─ PROFESSIONAL TIER
├─ Cost: $XX/month (TBD)
├─ Limits:
│  ├─ Max Branches: 10
│  ├─ Max Users: 50
│  └─ Max Admins: unlimited
├─ Features:
│  ├─ Calendar Integration: YES (full)
│  ├─ API Access: YES (limited rate - 1000 req/day)
│  ├─ White-Label: NO
│  └─ Support: Email + Chat (4-24hr response)
│
└─ ENTERPRISE TIER
  ├─ Cost: Custom pricing (contact sales)
  ├─ Limits:
  │  ├─ Max Branches: Unlimited
  │  ├─ Max Users: Unlimited
  │  └─ Max Admins: Unlimited
  ├─ Features:
  │  ├─ Calendar Integration: YES (full)
  │  ├─ API Access: YES (unlimited)
  │  ├─ White-Label: YES
  │  └─ Support: Dedicated account manager
```

### User Counting Rules

- **Counts toward limit:** ALL users (active, invited, inactive, paused)
- **Goal:** Prevent abuse by inviting 100 people then deleting
- **Check point:** At creation time (can't create if at limit)

### Calendar Integration Specifics

| Tier | Read Events | Write Events | # Calendars | Sync Rate | Blocked Slots |
|------|-------------|--------------|------------|-----------|---------------|
| FREE | ✅ YES | ❌ NO | 1 | Every 24h | Basic |
| STARTER | ✅ YES | ✅ YES | 1 | Every 4h | Full |
| PROFESSIONAL | ✅ YES | ✅ YES | Unlimited | Every 1h | Full |
| ENTERPRISE | ✅ YES | ✅ YES | Unlimited | Real-time | Full |

---

## Data Model (FINAL)

### 1. Organizations Collection

```typescript
// organizations/{orgId}
{
  id: string;                          // Firestore doc ID
  name: string;                         // "Acme Medical Group"
  owner_uid: string;                    // Firebase Auth UID
  subscription_tier: "free" | "starter" | "professional" | "enterprise";
  subscription_status: "active" | "trial" | "canceled" | "paused";
  
  // Counters for enforcing tier limits
  current_branch_count: number;         // How many branches exist
  current_user_count: number;           // ALL users (active + invited + inactive)
  current_admin_count: number;          // Users with admin role
  
  // Subscription/Billing
  stripe_customer_id?: string;          // Stripe customer (empty for FREE)
  stripe_subscription_id?: string;      // Stripe subscription (empty for FREE)
  billing_email?: string;
  billing_period_start?: Date;
  billing_period_end?: Date;
  
  // Metadata
  created_at: Date;
  created_by: string;                   // owner_uid
  updated_at: Date;
}
```

### 2. Branches Collection (Calendar Instances)

```typescript
// branches/{orgId}/{branchId}
{
  id: string;
  org_id: string;
  name: string;                         // "NYC Office"
  address?: string;
  location?: { lat: number; lng: number };
  timezone: string;                     // "America/New_York"
  
  created_at: Date;
  created_by: string;                   // uid of person who created
}
```

### 3. Users Collection

```typescript
// users/{uid}
{
  uid: string;                          // Firebase Auth UID
  email: string;
  org_id: string;
  
  // Global role in organization
  global_role: "owner" | "admin" | "user";
  
  // Branch assignments (can work at multiple branches)
  branch_assignments: Array<{
    branch_id: string;
    role: "admin" | "user";             // Role specific to this branch
  }>;
  
  // Status
  status: "active" | "invited" | "inactive" | "paused";
  
  // Metadata
  created_at: Date;
  invited_by?: string;                  // uid of person who invited
  activated_at?: Date;                  // When user first logged in
  last_login?: Date;
}
```

### 4. Time Slots Collection

```typescript
// time_slots/{slotId}
{
  id: string;
  org_id: string;
  branch_id: string;
  
  date: string;                         // "2025-01-15"
  time: string;                         // "09:00"
  status: "available" | "booked";
  
  created_at: Date;
  updated_at: Date;
}
```

### 5. Appointments Collection

```typescript
// appointments/{apptId}
{
  id: string;
  org_id: string;
  branch_id: string;
  
  customer_name: string;
  customer_email: string;
  
  date: string;                         // "2025-01-15"
  time: string;                         // "09:00"
  
  locationDetails: {
    type: "zoom" | "your_premises" | "restaurant" | "other";
    details?: string;
  };
  
  status: "pending" | "confirmed" | "cancelled";
  
  notes?: string;
  
  created_at: Date;
  expiresAt: Date;                      // 90 days from creation
}
```

### 6. Settings Collection (Per Branch)

```typescript
// settings/{orgId}_{branchId}
{
  id: string;
  org_id: string;
  branch_id: string;
  
  working_hours?: {
    [day: string]: {
      startTime: string;
      endTime: string;
      enabled: boolean;
    };
  };
  
  working_days?: string[];              // ["Monday", "Tuesday", ...]
  
  blocked_slots?: Array<{
    _key: string;
    startTime: string;
    endTime: string;
    label: string;
  }>;
  
  calendar_integration?: {
    google?: {
      connected: boolean;
      calendar_id?: string;
      sync_enabled: boolean;
    };
    outlook?: {
      connected: boolean;
      calendar_id?: string;
      sync_enabled: boolean;
    };
  };
  
  restaurants?: {
    city: string;
    perimeter_km: number;
    list: Array<{
      name: string;
      address: string;
      lat: number;
      lng: number;
      website?: string;
    }>;
  };
}
```

### 7. Calendar Tokens Collection (Per Branch + User)

```typescript
// calendar_tokens/{orgId}_{branchId}_{uid}
{
  id: string;
  org_id: string;
  branch_id: string;
  user_uid: string;
  
  provider: "google" | "outlook";
  
  // Encrypted before storage
  access_token: string;                 // ENCRYPTED
  refresh_token?: string;               // ENCRYPTED
  
  token_expires_at?: Date;
  
  created_at: Date;
  updated_at?: Date;
}
```

### 8. Subscription Tiers Reference Collection

```typescript
// subscription_tiers/{tierId}
{
  id: string;
  name: "free" | "starter" | "professional" | "enterprise";
  display_name: string;                 // "Starter Plan"
  
  price_cents: number;                  // 2999 = $29.99/month (0 for free)
  billing_interval: "month" | "year" | "lifetime";
  
  // Hard limits
  limits: {
    max_branches: number;               // 1, 3, 10, 999999
    max_users: number;                  // 1, 10, 50, 999999
    max_admins: number;                 // 1, 3, 999999, 999999
  };
  
  // Feature flags
  features: {
    calendar_integration: boolean;
    calendar_write_events: boolean;      // FREE can only read
    calendar_max_calendars: number;      // 1 for FREE, unlimited for others
    calendar_sync_interval_hours: number; // 24 for FREE, 4 for STARTER, 1 for PROFESSIONAL, 0 for ENTERPRISE (real-time)
    
    api_access: boolean;
    api_rate_limit_per_day: number;     // 0 = no API, 1000 for PROFESSIONAL
    
    white_label: boolean;
    
    support_level: "community" | "email" | "priority" | "dedicated";
  };
  
  created_at: Date;
}
```

---

## Firestore Rules (Updated for Tiers)

```plaintext
// Key rules:
1. User can only access org_id they belong to
2. User can only access branches they're assigned to
3. Feature access depends on org subscription_tier
4. Tier limits enforced at API layer (not in rules)
5. Public booking endpoint doesn't require auth
```

---

## API Layer Responsibilities (Phase 2+)

### Tier Limit Enforcement

```typescript
// Before creating new user/branch:
async function canAddUser(orgId: string): Promise<boolean> {
  const org = await getOrganization(orgId);
  const tier = await getSubscriptionTier(org.subscription_tier);
  
  return org.current_user_count < tier.limits.max_users;
}

async function canAddBranch(orgId: string): Promise<boolean> {
  const org = await getOrganization(orgId);
  const tier = await getSubscriptionTier(org.subscription_tier);
  
  return org.current_branch_count < tier.limits.max_branches;
}
```

### Feature Access Control

```typescript
// Check if org can use calendar integration:
async function canUseCalendarIntegration(orgId: string): Promise<boolean> {
  const org = await getOrganization(orgId);
  const tier = await getSubscriptionTier(org.subscription_tier);
  
  return tier.features.calendar_integration;
}

// Check if org can write to calendar:
async function canWriteCalendarEvents(orgId: string): Promise<boolean> {
  const org = await getOrganization(orgId);
  const tier = await getSubscriptionTier(org.subscription_tier);
  
  return tier.features.calendar_write_events;
}
```

---

## Phase 1 Updates Required

Now that we have the complete model locked in, here's what Phase 1.1 needs:

### NEW Type Files to Create:

1. **`src/types/branch.ts`**
   - Branch type

2. **`src/types/subscriptionTier.ts`**
   - SubscriptionTier type
   - Tier feature flags
   - Tier limits

### Type Files to UPDATE:

1. **`src/types/organization.ts`**
   - Add: subscription_tier, subscription_status
   - Add: current_branch_count, current_user_count, current_admin_count
   - Add: stripe_customer_id, billing details

2. **`src/types/calendarToken.ts`**
   - Update: Add branch_id to token storage key structure

3. **`src/api/authApi.ts`** (AuthUser type)
   - Already done in Phase 1.1 ✅

---

## Key Architectural Principles

### ✅ Single Responsibility
- Organization = Company/Clinic
- Branch = Calendar Instance (independent)
- Users = People who work at branches

### ✅ Future-Proof
- Schema supports multi-branch (but UI limited to 1 for now)
- Tier system extensible (easy to add new tiers)
- Feature flags allow quick enable/disable

### ✅ Scalable
- Each branch completely isolated
- Can sync 1000s of branches independently
- Per-user quota tracking prevents abuse

### ✅ Simple for Phase 1-4
- Start with assumption: 1 branch per org
- UI only shows 1 branch at a time
- Multi-branch UI added in Phase 5

---

## Implementation Order for Phase 1.1 (UPDATED)

1. ✅ Update `src/types/appointment.ts` (already done)
2. ✅ Update `src/types/timeSlot.ts` (already done)
3. ✅ Update `src/api/authApi.ts` (already done)
4. ✅ Create `src/types/organization.ts` (already done - needs update)
5. ✅ Create `src/types/calendarToken.ts` (already done)
6. 🆕 **Create `src/types/branch.ts`** (NEW)
7. 🆕 **Create `src/types/subscriptionTier.ts`** (NEW)
8. 🆕 **Update `src/types/organization.ts`** (add tier/billing)

---

## Ready to Code?

We have:
- ✅ Tier structure finalized
- ✅ User counting rules defined
- ✅ Feature matrix created
- ✅ Data model documented
- ✅ Firestore structure planned
- ✅ API layer responsibilities defined

**Next Step:** Update Phase 1.1 to include Branch and SubscriptionTier types, then recompile to verify.

Shall we proceed? 🚀
