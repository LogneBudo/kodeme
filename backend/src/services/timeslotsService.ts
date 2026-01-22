import { db } from './firebase';
import { Timestamp } from 'firebase-admin/firestore';

export async function listTimeSlots() {
  const slotsRef = db.collection('time_slots');
  const snapshot = await slotsRef.orderBy('date', 'asc').get();
  const slots = snapshot.docs.map(d => {
    const data = d.data();
    return { id: d.id, ...data, createdAt: data.createdAt?.toDate?.() ?? new Date(), updatedAt: data.updatedAt?.toDate?.() ?? new Date() };
  });
  slots.sort((a,b)=>{
    const d = String(a.date).localeCompare(String(b.date));
    if (d !== 0) return d;
    return String(a.time).localeCompare(String(b.time));
  });
  return slots;
}

export async function getTimeSlot(id: string) {
  const docRef = db.collection('time_slots').doc(id);
  const snap = await docRef.get();
  if (!snap.exists) return null;
  const data = snap.data();
  return { id: snap.id, ...data, createdAt: data.createdAt?.toDate?.() ?? new Date(), updatedAt: data.updatedAt?.toDate?.() ?? new Date() };
}

export async function createTimeSlot(data: any) {
  const slotsRef = db.collection('time_slots');
  const now = Timestamp.now();
  const docRef = await slotsRef.add({
    date: data.date,
    time: data.time,
    status: data.status || 'available',
    createdAt: now,
    updatedAt: now,
  });
  return { id: docRef.id, ...data, createdAt: now.toDate(), updatedAt: now.toDate() };
}

export async function updateTimeSlot(id: string, patch: any) {
  const docRef = db.collection('time_slots').doc(id);
  const updateData = { ...patch, updatedAt: Timestamp.now() };
  delete updateData.id; delete updateData.createdAt; delete updateData.org_id; delete updateData.calendar_id;
  await docRef.update(updateData);
  return getTimeSlot(id);
}

export async function deleteTimeSlot(id: string) {
  await db.collection('time_slots').doc(id).delete();
  return true;
}

export async function bulkCreateTimeSlots(items: any[]) {
  const slotsRef = db.collection('time_slots');
  const now = Timestamp.now();
  const created: any[] = [];
  for (const item of items) {
    const docRef = await slotsRef.add({ date: item.date, time: item.time, status: item.status || 'available', createdAt: now, updatedAt: now });
    created.push({ id: docRef.id, ...item, createdAt: now.toDate(), updatedAt: now.toDate() });
  }
  return created;
}

// Tenant-aware
export async function listTenantTimeSlots(orgId: string, calendarId: string) {
  const slotsRef = db.collection('time_slots');
  const q = slotsRef.where('org_id', '==', orgId).where('calendar_id', '==', calendarId).orderBy('date', 'asc');
  const snapshot = await q.get();
  if (!snapshot.empty) {
    const slots = snapshot.docs.map(d => {
      const data = d.data();
      return { id: d.id, ...data, createdAt: data.createdAt?.toDate?.() ?? new Date(), updatedAt: data.updatedAt?.toDate?.() ?? new Date() };
    });
    return slots;
  }
  // fallback legacy
  const all = await slotsRef.orderBy('date','asc').get();
  return all.docs.map(d=>{ const data=d.data(); return { id: d.id, ...data, createdAt: data.createdAt?.toDate?.() ?? new Date(), updatedAt: data.updatedAt?.toDate?.() ?? new Date() }; });
}

export async function getTenantTimeSlot(orgId: string, calendarId: string, id: string) {
  const docRef = db.collection('time_slots').doc(id);
  const snap = await docRef.get();
  if (!snap.exists) return null;
  const data = snap.data();
  if (data.org_id !== orgId || data.calendar_id !== calendarId) throw new Error('Time slot does not belong to this org/branch');
  return { id: snap.id, ...data, createdAt: data.createdAt?.toDate?.() ?? new Date(), updatedAt: data.updatedAt?.toDate?.() ?? new Date() };
}

export async function createTenantTimeSlot(orgId: string, calendarId: string, item: any) {
  const now = Timestamp.now();
  const docRef = await db.collection('time_slots').add({ org_id: orgId, calendar_id: calendarId, date: item.date, time: item.time, status: item.status || 'available', createdAt: now, updatedAt: now });
  return { id: docRef.id, org_id: orgId, calendar_id: calendarId, ...item, createdAt: now.toDate(), updatedAt: now.toDate() };
}

export async function updateTenantTimeSlot(orgId: string, calendarId: string, id: string, patch: any) {
  await getTenantTimeSlot(orgId, calendarId, id);
  const updateData = { ...patch, updatedAt: Timestamp.now() };
  delete updateData.id; delete updateData.org_id; delete updateData.calendar_id; delete updateData.createdAt;
  await db.collection('time_slots').doc(id).update(updateData);
  return getTenantTimeSlot(orgId, calendarId, id);
}

export async function deleteTenantTimeSlot(orgId: string, calendarId: string, id: string) {
  await getTenantTimeSlot(orgId, calendarId, id);
  await db.collection('time_slots').doc(id).delete();
  return true;
}
