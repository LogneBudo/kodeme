import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";

export interface CalendarToken {
  id?: string;
  provider: "google" | "outlook";
  orgId: string;
  branchId?: string;
  userId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  scope?: string;
  tokenType?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const COLLECTION = "calendar_tokens";

export async function saveCalendarToken(token: CalendarToken) {
  const ref = doc(collection(db, COLLECTION));
  const now = new Date();
  await setDoc(ref, {
    ...token,
    createdAt: token.createdAt || now,
    updatedAt: now,
  });
  return ref.id;
}

export async function getCalendarToken({ provider, orgId, branchId, userId }: { provider: string; orgId: string; branchId?: string; userId: string; }) {
  const q = query(
    collection(db, COLLECTION),
    where("provider", "==", provider),
    where("orgId", "==", orgId),
    where("userId", "==", userId),
    ...(branchId ? [where("branchId", "==", branchId)] : [])
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docData = snapshot.docs[0].data();
  return { ...docData, id: snapshot.docs[0].id } as CalendarToken;
}

export async function deleteCalendarToken({ provider, orgId, branchId, userId }: { provider: string; orgId: string; branchId?: string; userId: string; }) {
  const q = query(
    collection(db, COLLECTION),
    where("provider", "==", provider),
    where("orgId", "==", orgId),
    where("userId", "==", userId),
    ...(branchId ? [where("branchId", "==", branchId)] : [])
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return false;
  await deleteDoc(snapshot.docs[0].ref);
  return true;
}
