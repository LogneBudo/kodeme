import type { Invitation } from './_types/invitation';
import { getFirestore } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';

const db = getFirestore();
const INVITATIONS_COLLECTION = 'invitations';

// Create a new invitation code
export async function createInvitation(org_id: string, created_by: string, expires: number): Promise<Invitation> {
  const code = uuidv4().slice(0, 8); // short unique code
  const invitation: Invitation = {
    code,
    org_id,
    expires,
    created_by,
    created_at: Date.now(),
  };
  await db.collection(INVITATIONS_COLLECTION).doc(code).set(invitation);
  return invitation;
}

// Validate an invitation code
export async function validateInvitation(code: string): Promise<Invitation | null> {
  const doc = await db.collection(INVITATIONS_COLLECTION).doc(code).get();
  if (!doc.exists) return null;
  const invitation = doc.data() as Invitation;
  if (invitation.expires < Date.now()) return null;
  if (invitation.used_by) return null;
  return invitation;
}

// Redeem an invitation code
export async function redeemInvitation(code: string, user_id: string): Promise<boolean> {
  const docRef = db.collection(INVITATIONS_COLLECTION).doc(code);
  const doc = await docRef.get();
  if (!doc.exists) return false;
  const invitation = doc.data() as Invitation;
  if (invitation.expires < Date.now() || invitation.used_by) return false;
  await docRef.update({ used_by: user_id, redeemed_at: Date.now() });
  // Update user's org_id (pseudo-code, replace with actual user update logic)
  // await db.collection('users').doc(user_id).update({ org_id: invitation.org_id });
  return true;
}
