import { db } from './firebase';
import { Timestamp } from 'firebase-admin/firestore';

export async function listUsers() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(d => {
    const data = d.data();
    return { id: d.id, ...data, createdAt: data.createdAt?.toDate?.() ?? new Date(), updatedAt: data.updatedAt?.toDate?.() ?? new Date() };
  });
}

export async function addUser(payload: { uid: string; email: string; role: string; subscription_tier?: string; created_by?: string }) {
  const { uid, email, role, subscription_tier, created_by } = payload;
  const selectedTier = subscription_tier || 'free';
  if (selectedTier === 'free' && created_by) {
    const userRef = db.collection('users').doc(created_by);
    const userSnap = await userRef.get();
    const existingOrgId = userSnap.exists ? (userSnap.data()?.org_id || null) : null;
    if (existingOrgId) throw new Error('Free plan allows a single organization per user.');
    const orgsOwned = await db.collection('organizations').where('owner_uid', '==', created_by).get();
    if (!orgsOwned.empty) throw new Error('Free plan allows a single organization per user.');
  }

  const now = Timestamp.now();
  const userRef = db.collection('users').doc(uid);
  await userRef.set({ email, role, createdAt: now, updatedAt: now });
  return { id: uid, email, role, createdAt: now.toDate(), updatedAt: now.toDate() };
}

export async function updateUserRole(userId: string, role: string) {
  const userRef = db.collection('users').doc(userId);
  await userRef.update({ role, updatedAt: Timestamp.now() });
  return true;
}

export async function deleteUser(userId: string) {
  await db.collection('users').doc(userId).delete();
  return true;
}

export async function listTenantUsers(orgId: string) {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('org_id', '==', orgId).orderBy('createdAt', 'desc').get();
  if (!snapshot.empty) return snapshot.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.() ?? new Date(), updatedAt: d.data().updatedAt?.toDate?.() ?? new Date() }));
  // fallback
  const q = await usersRef.where('org_id', '==', orgId).get();
  return q.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.() ?? new Date(), updatedAt: d.data().updatedAt?.toDate?.() ?? new Date() }));
}

export async function inviteUserToTenant(userId: string, orgId: string, branchAssignments: Record<string, string>) {
  const userRef = db.collection('users').doc(userId);
  const now = Timestamp.now();
  await userRef.set({ org_id: orgId, branch_assignments: branchAssignments, invited_at: now, updated_at: now }, { merge: true });
  return true;
}

export async function removeUserFromTenant(userId: string) {
  const userRef = db.collection('users').doc(userId);
  await userRef.update({ org_id: null, branch_assignments: {}, updated_at: Timestamp.now() });
  return true;
}
