import { auth } from "../firebase";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

export type AuthUser = {
  uid: string;
  email: string;
  role: string;
} | null;

let cachedUser: AuthUser = null;
let authInitialized = false;

// Listen to auth state changes and update cache
onAuthStateChanged(auth, async (user) => {
  console.log("onAuthStateChanged fired, user:", user?.email);
  
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
          };
          console.log("User found in Firestore with role:", userData.role);
        } else {
          // User not in Firestore yet, default to user role
          cachedUser = {
            uid: user.uid,
            email: user.email || "",
            role: "user",
          };
          console.log("User not in Firestore yet, defaulting to 'user' role");
          
          // Try to create the document (but don't block if it fails)
          try {
            const now = Timestamp.now();
            await setDoc(userDocRef, {
              email: user.email,
              role: "user",
              createdAt: now,
              updatedAt: now,
            });
            console.log("User document created in Firestore");
          } catch (createError) {
            console.warn("Could not create user document (permission issue):", createError);
          }
        }
      } catch (firestoreError) {
        console.warn("Firestore access issue:", firestoreError);
        // Still set user even if Firestore fails
        cachedUser = {
          uid: user.uid,
          email: user.email || "",
          role: "user",
        };
      }
    } catch (error) {
      console.error("Error in auth handler:", error);
      // Still set user even if there's an error
      cachedUser = {
        uid: user.uid,
        email: user.email || "",
        role: "user",
      };
    }
  } else {
    console.log("User logged out");
    cachedUser = null;
  }
  
  authInitialized = true;
  console.log("authInitialized set to true, cachedUser:", cachedUser?.email);
});

export async function getCurrentUser(): Promise<AuthUser> {
  // If cache is available, return it immediately
  if (authInitialized) {
    console.log("Returning cached user:", cachedUser?.email);
    return cachedUser;
  }
  
  // Otherwise wait for initialization (max 5 seconds)
  console.log("Waiting for auth initialization...");
  let attempts = 0;
  while (!authInitialized && attempts < 100) {
    await new Promise(resolve => setTimeout(resolve, 50));
    attempts++;
  }
  
  console.log("Auth initialized, returning user:", cachedUser?.email);
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

export function redirectToLogin(path: string) {
  window.location.href = "/admin/login?redirect=" + encodeURIComponent(path);
}
