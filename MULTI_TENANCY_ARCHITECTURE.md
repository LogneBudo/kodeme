# Multi-Tenancy Architecture Recommendations

## Current State Analysis

Your application currently:
- Single-tenant Firestore database (no data isolation between users)
- Firebase Auth for user authentication
- Role-based access (admin/user) but shared global data
- Single global settings, time slots, and appointments collection
- Calendar integration stored per-user (not per-tenant)
- All users see and manage the same data

## Proposed Multi-Tenancy Architecture

### 1. **Data Isolation Strategy: Document-Level Isolation (Recommended)**

This is the most practical approach for your scale and Firebase limitations.

**Structure:**
```
organizations/
├── {tenantId}/
│   ├── name: string
│   ├── subscription_tier: "starter" | "professional" | "enterprise"
│   ├── status: "active" | "suspended"
│   ├── created_at: timestamp
│   ├── owner_uid: string
│   └── settings: {
│       max_admins: number
│       max_users: number
│       features: [...] // feature flags per tier
│     }

users/
├── {uid}/
│   ├── email: string
│   ├── tenant_id: string  // KEY: Every user belongs to exactly one tenant
│   ├── role: "owner" | "admin" | "user"
│   ├── status: "active" | "inactive"
│   ├── created_at: timestamp

settings/
├── {tenantId}_{setting_type}  // Scoped by tenant
│   ├── tenant_id: string
│   ├── working_hours: {...}
│   ├── working_days: [...]
│   ├── calendar_integration: {...}
│   └── ...

time_slots/
├── {tenantId}_{slotId}  // Scoped by tenant
│   ├── tenant_id: string
│   ├── date: string
│   ├── time: string
│   └── ...

appointments/
├── {tenantId}_{appointmentId}  // Scoped by tenant
│   ├── tenant_id: string
│   ├── customer_email: string
│   └── ...

calendar_tokens/
├── {tenantId}_{uid}  // Scoped by tenant AND user
│   ├── tenant_id: string
│   ├── user_uid: string
│   ├── provider: "google" | "outlook"
│   ├── access_token: string (encrypted)
│   ├── refresh_token: string (encrypted)
│   └── token_expires_at: timestamp
```

**Key Principle:** Every document includes `tenant_id` AND all queries filter by it.

---

### 2. **Firestore Rules - Multi-Tenant Security**

```typescript
// firestore.rules (updated for multi-tenancy)
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper: Get user's tenant_id from users collection
    function getUserTenant() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.tenant_id;
    }
    
    // Helper: Check if user belongs to this tenant
    function belongsToTenant(tenantId) {
      return request.auth != null && getUserTenant() == tenantId;
    }
    
    // Helper: Check if user is admin in this tenant
    function isAdminInTenant(tenantId) {
      let userDoc = get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
      return belongsToTenant(tenantId) && 
             (userDoc.role == 'admin' || userDoc.role == 'owner');
    }
    
    // Helper: Check if user is owner
    function isOwner(tenantId) {
      let userDoc = get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
      return belongsToTenant(tenantId) && userDoc.role == 'owner';
    }

    // Organizations - only owner can read/write, owner is initial creator
    match /organizations/{tenantId} {
      allow read: if isOwner(tenantId);
      allow create: if request.auth != null; // Anyone can create org (sets owner to uid)
      allow update, delete: if isOwner(tenantId);
    }

    // Users collection
    match /users/{uid} {
      // Users can read their own doc, admins can read their tenant members
      allow read: if request.auth.uid == uid || 
                     isAdminInTenant(resource.data.tenant_id);
      allow create: if request.auth.uid == uid && 
                       request.resource.data.tenant_id != null;
      allow update: if request.auth.uid == uid || 
                       isAdminInTenant(resource.data.tenant_id);
      allow delete: if isOwner(resource.data.tenant_id);
    }

    // Settings - scoped by tenant
    match /settings/{settingId} {
      allow read: if belongsToTenant(resource.data.tenant_id);
      allow create, update: if isAdminInTenant(request.resource.data.tenant_id);
      allow delete: if isAdminInTenant(resource.data.tenant_id);
    }

    // Time slots - scoped by tenant
    match /time_slots/{slotId} {
      allow read: if belongsToTenant(resource.data.tenant_id);
      allow create, update: if isAdminInTenant(resource.data.tenant_id);
      allow delete: if isAdminInTenant(resource.data.tenant_id);
    }

    // Appointments - scoped by tenant
    match /appointments/{appointmentId} {
      allow read: if resource.data.tenant_id == null || 
                     belongsToTenant(resource.data.tenant_id);
      allow create: if true; // Public booking (can set tenant_id in request)
      allow update, delete: if isAdminInTenant(resource.data.tenant_id);
    }

    // Calendar tokens - sensitive, scoped by tenant
    match /calendar_tokens/{tokenId} {
      allow read, write: if isAdminInTenant(resource.data.tenant_id);
    }
  }
}
```

---

### 3. **Authentication & Tenant Context**

**Enhanced AuthContext:**
```typescript
type AuthContextValue = {
  user: AuthUser;
  tenantId: string | null;      // NEW: Current tenant context
  tenants: Tenant[];             // NEW: Tenants user belongs to
  switchTenant: (tenantId: string) => Promise<void>; // NEW
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

type AuthUser = {
  uid: string;
  email: string;
  role: "owner" | "admin" | "user";
  tenant_id: string;
} | null;

type Tenant = {
  id: string;
  name: string;
  role: "owner" | "admin" | "user"; // User's role in this tenant
};
```

**Login Flow:**
1. Firebase Auth login (email/password or OAuth)
2. Fetch user document → get `tenant_id`
3. Load tenant info and set as active tenant
4. Store tenant context in AuthContext and localStorage for persistence

---

### 4. **Application Layer Changes**

#### A. Custom Hooks for Tenant-Scoped Queries
```typescript
// useFirestoreTenantQuery.ts - NEW
export function useFirestoreTenantQuery<T>(
  queryFn: (tenantId: string) => Promise<T>,
  deps: any[] = []
) {
  const { tenantId } = useAuth();
  
  return useFirestoreQuery(
    () => (tenantId ? queryFn(tenantId) : Promise.resolve(null)),
    [tenantId, ...deps]
  );
}
```

#### B. Query Helpers
```typescript
// src/api/firebaseApi.ts - UPDATED for multi-tenancy

export async function listTimeSlots(tenantId: string): Promise<TimeSlot[]> {
  const slotsRef = collection(db, "time_slots");
  const q = query(
    slotsRef,
    where("tenant_id", "==", tenantId),  // KEY: Filter by tenant
    orderBy("date", "asc")
  );
  const snapshot = await getDocs(q);
  // ... rest of function
}

export async function createTimeSlot(
  tenantId: string,  // NEW: Required parameter
  data: Omit<TimeSlot, "id" | "createdAt" | "updatedAt">
): Promise<TimeSlot> {
  const slotsRef = collection(db, "time_slots");
  const now = Timestamp.now();
  
  const docRef = await addDoc(slotsRef, {
    tenant_id: tenantId,  // KEY: Always include tenant_id
    date: data.date,
    time: data.time,
    status: data.status || "available",
    createdAt: now,
    updatedAt: now,
  });
  // ...
}
```

#### C. Component Layer
```typescript
// Components must use tenant context

function AdminSlots() {
  const { tenantId } = useAuth();
  const { data: slots } = useFirestoreTenantQuery(
    (tid) => listTimeSlots(tid),
    []
  );
  
  // Now 'slots' are automatically filtered to this tenant
  // ...
}
```

---

### 5. **User & Team Management**

**New Pages/Components:**

1. **Organization Setup** (`/admin/organization`)
   - Create organization during initial signup
   - Set business name, type, etc.
   - Initialize first admin user

2. **Team Management** (`/admin/team`)
   - Invite users to tenant
   - Assign roles (admin/user)
   - Manage permissions
   - Remove members

3. **Tenant Switcher** (in header)
   - If user belongs to multiple tenants
   - Switch between organizations
   - Persisted in UI state + localStorage

**API Functions:**
```typescript
// Create organization and assign owner
export async function createOrganization(
  name: string,
  ownerUid: string
): Promise<string> {
  const org = await addDoc(collection(db, "organizations"), {
    name,
    owner_uid: ownerUid,
    subscription_tier: "starter",
    status: "active",
    created_at: Timestamp.now(),
  });
  return org.id;
}

// Invite user to organization
export async function inviteUserToTenant(
  tenantId: string,
  email: string,
  role: "admin" | "user"
): Promise<void> {
  // If user exists, update their tenant_id
  // If not, create pending invitation (separate collection)
  // Send email with invitation link
}

// List users in tenant
export async function listTenantUsers(tenantId: string): Promise<AuthUser[]> {
  const usersRef = collection(db, "users");
  const q = query(
    usersRef,
    where("tenant_id", "==", tenantId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as AuthUser);
}
```

---

### 6. **Public Booking Link Strategy**

**Option A: Direct Booking (Recommended)**
- Public users access: `https://yourdomain.com/book/{tenantId}`
- No auth required
- Booking form tied to specific tenant
- Appointment created with `tenant_id`

**Option B: Custom Domain (Pro Feature)**
- Customer gets: `https://customername.yourdomain.com`
- Use Vercel environment to map subdomain → tenantId
- Or use DNS records for full custom domains

**Implementation:**
```typescript
// Route: /book/:tenantId (public)
export function PublicBooking() {
  const { tenantId } = useParams();
  
  // Load tenant settings (no auth required)
  const tenantSettings = await getSettings(tenantId);
  
  // Show booking form
  // On submit: createAppointment(tenantId, appointmentData)
}
```

---

### 7. **Calendar Integration - Multi-Tenant**

**Challenge:** OAuth tokens must be stored per-tenant, encrypted.

**Solution:**

```typescript
// calendar_tokens collection
{
  tenant_id: "org123",
  user_uid: "user456",
  provider: "google",
  access_token: "encrypted(...)",  // Use Firestore encryption
  refresh_token: "encrypted(...)",
  token_expires_at: timestamp,
  created_at: timestamp
}

// API endpoint for calendar sync
async function syncCalendarEvents(
  req: VercelRequest,
  res: VercelResponse
) {
  const { tenantId, userId } = req.body;
  
  // Fetch token from Firestore
  const tokenDoc = await getDoc(
    doc(db, "calendar_tokens", `${tenantId}_${userId}`)
  );
  
  if (!tokenDoc.exists()) {
    return res.status(401).json({ error: "Not connected" });
  }
  
  const token = decrypt(tokenDoc.data().access_token);
  
  // Fetch events for this tenant
  const events = await google.calendar("v3").events.list({
    calendarId: "primary",
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    auth: new google.auth.OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      token
    ),
  });
  
  return res.json({ events: events.data.items });
}
```

---

### 8. **Migration Path from Current State**

**Phase 1: Foundation (Week 1-2)**
1. Add `tenant_id` field to all existing documents
2. Create "DEFAULT_TENANT" and assign all current data to it
3. Migrate single authenticated user to owner of DEFAULT_TENANT
4. Update Firestore rules with new schema
5. Deploy without breaking current UI

**Phase 2: Backend Refactoring (Week 2-3)**
1. Update all API functions to accept/use `tenantId`
2. Update AuthContext with tenant switching
3. Add tenant scoping to all queries
4. Test thoroughly with single-tenant scenario

**Phase 3: UI/UX (Week 3-4)**
1. Add organization setup flow
2. Add team management pages
3. Add tenant switcher
4. Create public booking link page

**Phase 4: Features (Week 4+)**
1. Subscription tiers
2. Invitations/email
3. Advanced permissions
4. Usage analytics

---

### 9. **Data Type Updates**

```typescript
// src/types/appointment.ts
export type Appointment = {
  id: string;
  tenant_id: string;  // NEW
  slotId: string;
  email: string;
  locationDetails: { ... };
  status: "pending" | "confirmed" | "cancelled";
  appointmentDate: string;
  createdAt: Date;
  expiresAt: Date;
  notes?: string;
  time?: string;
  date?: string;
};

// src/types/timeSlot.ts
export type TimeSlot = {
  id: string;
  tenant_id: string;  // NEW
  date: string;
  time: string;
  status: "available" | "booked";
  createdAt: Date;
  updatedAt: Date;
};

// src/types/settings.ts (new)
export type Settings = {
  id: string;
  tenant_id: string;  // NEW
  working_hours: [...];
  working_days: [...];
  blocked_slots: [...];
  calendar_integration: {...};
};
```

---

### 10. **Subscription Tiers (Optional)**

```typescript
type SubscriptionTier = {
  id: string;
  name: "starter" | "professional" | "enterprise";
  features: {
    max_admins: number;
    max_users: number;
    calendar_integrations: number; // Can connect multiple calendars?
    custom_domain: boolean;
    white_label: boolean;
    api_access: boolean;
    priority_support: boolean;
  };
  price_monthly_cents: number;
};

// Enforce in Firestore rules
function canAccessFeature(feature: string) {
  let org = get(/databases/$(database)/documents/organizations/$(getTenantId())).data;
  let tierFeatures = getTierFeatures(org.subscription_tier);
  return tierFeatures[feature] == true;
}
```

---

## Summary: Key Changes Required

| Component | Change | Priority |
|-----------|--------|----------|
| **Firestore Rules** | Add tenant_id filtering to all rules | P0 |
| **Data Models** | Add tenant_id to all types | P0 |
| **AuthContext** | Add tenantId and switchTenant | P0 |
| **API Functions** | Accept tenantId parameter, filter queries | P0 |
| **Components** | Use useAuth().tenantId in all queries | P0 |
| **Routes** | Add public /book/:tenantId endpoint | P1 |
| **Pages** | Add Organization & Team Management | P1 |
| **Backend API** | Update calendar integration for multi-tenant tokens | P1 |
| **Email** | Update confirmation emails with tenant branding | P2 |
| **Subscriptions** | Add billing & tier management | P3 |

---

## Database Migration Script (Pseudo-code)

```typescript
// Script to run after deploying rules
async function migrateToMultiTenant() {
  const DEFAULT_TENANT_ID = "default";
  
  // Create default organization
  await setDoc(doc(db, "organizations", DEFAULT_TENANT_ID), {
    name: "Default Organization",
    owner_uid: currentUser.uid,
    subscription_tier: "starter",
    status: "active",
    created_at: Timestamp.now(),
  });
  
  // Migrate current user
  await updateDoc(doc(db, "users", currentUser.uid), {
    tenant_id: DEFAULT_TENANT_ID,
  });
  
  // Migrate all time slots
  const slotsSnapshot = await getDocs(collection(db, "time_slots"));
  const batch = writeBatch(db);
  slotsSnapshot.docs.forEach(doc => {
    batch.update(doc.ref, { tenant_id: DEFAULT_TENANT_ID });
  });
  await batch.commit();
  
  // Migrate all appointments
  const apptsSnapshot = await getDocs(collection(db, "appointments"));
  const batch2 = writeBatch(db);
  apptsSnapshot.docs.forEach(doc => {
    batch2.update(doc.ref, { tenant_id: DEFAULT_TENANT_ID });
  });
  await batch2.commit();
  
  console.log("✅ Migration complete");
}
```

---

## Recommended Tech Stack Additions

- **Stripe/Paddle**: Subscription billing
- **SendGrid/Resend**: Multi-tenant email with branding
- **Firebase Extensions**: Custom tokens or Stripe integration
- **Clerk/Auth0** (Optional): Better multi-tenant auth (alternative to Firebase Auth)

