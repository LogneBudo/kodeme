import { auth } from "../firebase";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

export type AuthUser = {
  uid: string;
  email: string;
  role: "owner" | "admin" | "user"; // User's role within their organization
  org_id?: string; // MULTI-TENANCY: Which organization this user belongs to
  branch_assignments?: Record<string, string>; // MULTI-TENANCY: { calendarId: role } mappings
} | null;

let cachedUser: AuthUser = null;
let authInitialized = false;

// Listen to auth state changes and update cache
onAuthStateChanged(auth, async (user) => {
  
  if (user) {
    try {
      // User is signed in, fetch their role from Firestore
      const userDocRef = doc(db, "users", user.uid);
      
      try {
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          cachedUser = {
            uid: user.uid,
            email: user.email || "",
            role: userData.role || "user",
            org_id: userData.org_id,
            branch_assignments: userData.branch_assignments,
          };

        } else {
          // User not in Firestore yet, default to user role
          cachedUser = {
            uid: user.uid,
            email: user.email || "",
            role: "user",
            org_id: undefined,
            branch_assignments: undefined,
          };

          
          // Try to create the document (but don't block if it fails)
          try {
            const now = Timestamp.now();
            await setDoc(userDocRef, {
              email: user.email,
              role: "user",
              createdAt: now,
              updatedAt: now,
            });

          } catch (createError) {

          }
        }
      } catch (firestoreError) {

        // Still set user even if Firestore fails
        cachedUser = {
          uid: user.uid,
          email: user.email || "",
          role: "user",
          org_id: undefined,
          branch_assignments: undefined,
        };
      }
    } catch (error) {
      console.error("Error in auth handler:", error);
      // Still set user even if there's an error
      cachedUser = {
        uid: user.uid,
        email: user.email || "",
        role: "user",
        org_id: undefined,
        branch_assignments: undefined,
      };
    }
  } else {

    cachedUser = null;
  }
  
  authInitialized = true;
});

export async function getCurrentUser(): Promise<AuthUser> {
  // Fast path: if a user is already cached, return it
  if (cachedUser) {
    return cachedUser;
  }

  // If auth has initialized but cache is empty, wait briefly for state to settle
  // This covers the moment right after signInWithEmailAndPassword where
  // onAuthStateChanged may not have populated cachedUser yet.
  const waitFor = async (predicate: () => boolean, tries = 60, delayMs = 50) => {
    for (let i = 0; i < tries; i++) {
      if (predicate()) return true;
      await new Promise((r) => setTimeout(r, delayMs));
    }
    return predicate();
  };

  if (!authInitialized) {
    await waitFor(() => authInitialized, 100, 50); // up to ~5s
  }

  // After init, if still no cachedUser but Firebase auth shows a current user,
  // wait a bit longer for our onAuthStateChanged to populate the cache.
  if (!cachedUser && auth.currentUser) {
    await waitFor(() => !!cachedUser, 60, 50); // up to ~3s
  }

  return cachedUser;
}

export async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: errorMessage };
  }
}

export async function logout(): Promise<void> {
  await signOut(auth);
  cachedUser = null;
}

export function redirectToLogin(path: string): void {
  window.location.href = "/admin/login?redirect=" + encodeURIComponent(path);
}
