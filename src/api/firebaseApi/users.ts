import {
  collection,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./../../firebase";

// ============ USERS ============

export type User = {
  id: string;
  email: string;
  role: "admin" | "user";
  createdAt: Date;
  updatedAt: Date;
};

export async function listUsers(): Promise<User[]> {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        role: data.role,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as User;
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export async function addUser(
  uid: string,
  email: string,
  role: "admin" | "user",
  subscription_tier: string = "free",
  created_by?: string
): Promise<User | null> {
  try {
    // Enforce free plan: one organization per user
    const selectedTier = subscription_tier || "free";
    if (selectedTier === "free" && created_by) {
      // If the user already has an org_id or owns any organization, block creation
      const userRef = doc(db, "users", created_by);
      const userSnap = await getDoc(userRef);
      const existingOrgId = userSnap.exists() ? (userSnap.data().org_id || null) : null;
      if (existingOrgId) {
        throw new Error("Free plan allows a single organization per user.");
      }
      const orgsOwnedQ = query(collection(db, "organizations"), where("owner_uid", "==", created_by));
      const orgsOwnedSnap = await getDocs(orgsOwnedQ);
      if (!orgsOwnedSnap.empty) {
        throw new Error("Free plan allows a single organization per user.");
      }
    }

    const now = Timestamp.now();
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      email,
      role,
      createdAt: now,
      updatedAt: now,
    });

    return {
      id: uid,
      email,
      role,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    };
  } catch (error) {
    console.error("Error adding user:", error);
    return null;
  }
}

export async function updateUserRole(userId: string, role: "admin" | "user"): Promise<boolean> {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      role,
      updatedAt: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error("Error updating user role:", error);
    return false;
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  try {
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    return false;
  }
}
// ============ END USERS ============

/**
 * List all users in an organization (all branches)
 */
export async function listTenantUsers(orgId: string): Promise<User[]> {
  if (!orgId) {
    throw new Error("orgId is required");
  }

  try {
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("org_id", "==", orgId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        role: data.role,
        org_id: data.org_id,
        branch_assignments: data.branch_assignments || {},
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as User & { org_id: string; branch_assignments: Record<string, string> };
    });
  } catch (error) {
    // Fallback if composite index missing or still building
    const err = error as unknown;
    const message =
      typeof err === "object" && err !== null && "message" in err
        ? String((err as { message?: unknown }).message)
        : "";
    const code =
      typeof err === "object" && err !== null && "code" in err
        ? (err as { code?: unknown }).code
        : undefined;
    if (code === "failed-precondition" || message.includes("requires an index")) {
      try {
        const usersRef = collection(db, "users");
        const q2 = query(usersRef, where("org_id", "==", orgId));
        const snapshot2 = await getDocs(q2);
        const items = snapshot2.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              email: data.email,
              role: data.role,
              org_id: data.org_id,
              branch_assignments: data.branch_assignments || {},
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            } as User & { org_id: string; branch_assignments: Record<string, string> };
          })
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        console.warn(`[users] Using fallback query while index builds for org=${orgId}`);
        return items;
      } catch (fallbackErr) {
        console.error(`Fallback users query failed for org=${orgId}:`, fallbackErr);
        throw fallbackErr;
      }
    }
    console.error(`Error fetching users for org ${orgId}:`, error);
    throw error;
  }
}

/**
 * Invite a user to an organization and assign to branch(es)
 * This creates/updates the user doc with org_id and calendar_assignments
 */
export async function inviteUserToTenant(
  userId: string,
  orgId: string,
  branchAssignments: Record<string, string> // { calendarId: role }
): Promise<boolean> {
  if (!userId || !orgId || !branchAssignments || Object.keys(branchAssignments).length === 0) {
    throw new Error("userId, orgId, and branchAssignments are required");
  }

  try {
    const userRef = doc(db, "users", userId);
    const now = Timestamp.now();

    await setDoc(
      userRef,
      {
        org_id: orgId,
        branch_assignments: branchAssignments,
        invited_at: now,
        updated_at: now,
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error(
      `Error inviting user ${userId} to org ${orgId}:`,
      error
    );
    throw error;
  }
}

/**
 * Remove a user from an organization
 * This clears their org_id and calendar_assignments
 */
export async function removeUserFromTenant(userId: string): Promise<boolean> {
  if (!userId) {
    throw new Error("userId is required");
  }

  try {
    const userRef = doc(db, "users", userId);

    await updateDoc(userRef, {
      org_id: null,
      branch_assignments: {},
      updated_at: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error(`Error removing user ${userId} from tenant:`, error);
    throw error;
  }
}
// ============ END TENANT USERS ============
