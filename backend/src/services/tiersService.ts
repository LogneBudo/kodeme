import { db } from './firebase';

export async function getOrganization(orgId: string) {
  const docRef = db.collection('organizations').doc(orgId);
  const docSnap = await docRef.get();
  if (!docSnap.exists) return null;
  return { id: docSnap.id, ...(docSnap.data() || {}) };
}

export async function canAddUserToTenant(orgId: string): Promise<boolean> {
  const org = await getOrganization(orgId);
  if (!org) throw new Error(`Organization ${orgId} not found`);
  // TODO: implement tier logic
  return true;
}

export async function canAddBranchToTenant(orgId: string): Promise<boolean> {
  const org = await getOrganization(orgId);
  if (!org) throw new Error(`Organization ${orgId} not found`);
  // TODO: implement tier logic
  return true;
}

export async function hasTierFeature(orgId: string, feature: string): Promise<boolean> {
  const org = await getOrganization(orgId);
  if (!org) throw new Error(`Organization ${orgId} not found`);
  // TODO: implement tier feature checks
  void feature;
  return true;
}
