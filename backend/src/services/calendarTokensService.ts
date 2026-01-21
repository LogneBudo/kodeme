import { db } from './firebase';

export interface CalendarToken {
  id?: string;
  provider: 'google' | 'outlook';
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

const COLLECTION = 'calendar_tokens';

export async function saveCalendarToken(token: CalendarToken) {
  const ref = db.collection(COLLECTION).doc();
  const now = new Date();
  await ref.set({
    ...token,
    createdAt: token.createdAt || now,
    updatedAt: now,
  });
  return ref.id;
}

export async function getCalendarToken({ provider, orgId, branchId, userId }: { provider: string; orgId: string; branchId?: string; userId: string; }) {
  let query = db.collection(COLLECTION)
    .where('provider', '==', provider)
    .where('orgId', '==', orgId)
    .where('userId', '==', userId);
  if (branchId) {
    query = query.where('branchId', '==', branchId);
  }
  const snapshot = await query.get();
  if (snapshot.empty) return null;
  const docData = snapshot.docs[0].data();
  return { ...docData, id: snapshot.docs[0].id } as CalendarToken;
}

export async function deleteCalendarToken({ provider, orgId, branchId, userId }: { provider: string; orgId: string; branchId?: string; userId: string; }) {
  let query = db.collection(COLLECTION)
    .where('provider', '==', provider)
    .where('orgId', '==', orgId)
    .where('userId', '==', userId);
  if (branchId) {
    query = query.where('branchId', '==', branchId);
  }
  const snapshot = await query.get();
  if (snapshot.empty) return false;
  await db.collection(COLLECTION).doc(snapshot.docs[0].id).delete();
  return true;
}
