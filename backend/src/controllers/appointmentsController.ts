import { Request, Response } from 'express';
import { db } from '../services/firebase';

/**
 * POST /api/appointments
 * body: { orgId, calendarId, appointment: { slotId, email, locationDetails, status, appointmentDate, notes } }
 */
export const postCreateTenantAppointment = async (req: Request, res: Response) => {
  const { orgId, calendarId, appointment } = req.body;
  if (!orgId || !calendarId || !appointment) {
    return res.status(400).json({ error: 'Missing required fields: orgId, calendarId, appointment' });
  }

  try {
    const now = Date.now();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 90);

    // Prepare payload consistent with client-side shape
    const payload = {
      org_id: orgId,
      calendar_id: calendarId,
      slotId: appointment.slotId,
      email: appointment.email,
      locationDetails: appointment.locationDetails || { type: appointment.locationDetails?.type },
      status: appointment.status,
      appointmentDate: appointment.appointmentDate,
      createdAt: new Date(now),
      expiresAt,
      notes: appointment.notes,
    };

    // Use a batch to create appointment and optionally update the slot atomically
    const batch = db.batch();
    const aptsRef = db.collection('appointments').doc();
    batch.set(aptsRef, payload);

    if (appointment.slotId) {
      const slotRef = db.collection('time_slots').doc(appointment.slotId);
      batch.update(slotRef, { status: 'booked', updatedAt: new Date(now) });
    }

    await batch.commit();

    const created = await aptsRef.get();
    const result = created.exists ? { id: created.id, ...(created.data() as Record<string, unknown>) } : null;
    res.json({ appointment: result });
  } catch (err: unknown) {
    console.error('Error creating tenant appointment (backend):', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
