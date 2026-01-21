import { Request, Response } from 'express';
import { db } from '../services/firebase';

// Appointment Firestore data shape
interface AppointmentData {
  org_id: string;
  calendar_id: string;
  slotId?: string;
  email: string;
  locationDetails?: { type?: string; [key: string]: unknown };
  status: string;
  appointmentDate: string;
  createdAt?: FirebaseFirestore.Timestamp | Date;
  expiresAt?: FirebaseFirestore.Timestamp | Date;
  notes?: string;
}

// Helper to map Firestore doc to API-friendly object
function mapAppointmentDoc(doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>) {
  if (!doc.exists) return null;
  const data = doc.data() as AppointmentData;
  return {
    id: doc.id,
    org_id: data.org_id,
    calendar_id: data.calendar_id,
    slotId: data.slotId,
    email: data.email,
    locationDetails: data.locationDetails,
    status: data.status,
    appointmentDate: data.appointmentDate,
    createdAt: (data.createdAt && 'toDate' in data.createdAt) ? data.createdAt.toDate() : data.createdAt,
    expiresAt: (data.expiresAt && 'toDate' in data.expiresAt) ? data.expiresAt.toDate() : data.expiresAt,
    notes: data.notes,
  };
}

/**
 * @openapi
 * /appointments:
 *   get:
 *     summary: List appointments for a tenant calendar
 *     tags:
 *       - Appointments
 *     parameters:
 *       - name: orgId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *       - name: calendarId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: A list of appointments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 appointments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Appointment'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 */
export const getListTenantAppointments = async (req: Request, res: Response) => {
  const { orgId, calendarId } = req.query as Record<string, string>;
  if (!orgId || !calendarId) return res.status(400).json({ error: 'orgId and calendarId required' });

  try {
    const snapshot = await db
      .collection('appointments')
      .where('org_id', '==', orgId)
      .where('calendar_id', '==', calendarId)
      .orderBy('createdAt', 'desc')
      .get();

    const items = snapshot.docs.map(mapAppointmentDoc).filter(Boolean);
    res.json({ appointments: items });
  } catch (err) {
    console.error('Error listing tenant appointments:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @openapi
 * /appointments/by-date:
 *   get:
 *     summary: Get appointments for a specific date
 *     tags:
 *       - Appointments
 *     parameters:
 *       - name: date
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - name: orgId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *       - name: calendarId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Appointments for the requested date
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 appointments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Appointment'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 */
export const getAppointmentsByDate = async (req: Request, res: Response) => {
  const { date, orgId, calendarId } = req.query as Record<string, string>;
  if (!date || !orgId || !calendarId) return res.status(400).json({ error: 'date, orgId and calendarId required' });

  try {
    const snapshot = await db
      .collection('appointments')
      .where('org_id', '==', orgId)
      .where('calendar_id', '==', calendarId)
      .where('appointmentDate', '==', date)
      .orderBy('createdAt', 'desc')
      .get();

    const items = snapshot.docs.map(mapAppointmentDoc).filter(Boolean);
    res.json({ appointments: items });
  } catch (err) {
    console.error('Error getting appointments by date:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @openapi
 * /appointments/{id}:
 *   get:
 *     summary: Get a single appointment by id
 *     tags:
 *       - Appointments
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: orgId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *       - name: calendarId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Appointment found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 appointment:
 *                   $ref: '#/components/schemas/Appointment'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 */
export const getTenantAppointment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { orgId, calendarId } = req.query as Record<string, string>;
  if (!id || !orgId || !calendarId) return res.status(400).json({ error: 'id, orgId and calendarId required' });

  try {
    const docRef = db.collection('appointments').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ error: 'Appointment not found' });
    const data = snap.data();
    if (data?.org_id !== orgId || data.calendar_id !== calendarId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    res.json({ appointment: mapAppointmentDoc(snap) });
  } catch (err) {
    console.error('Error fetching tenant appointment:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @openapi
 * /appointments:
 *   post:
 *     summary: Create a new tenant appointment
 *     tags:
 *       - Appointments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orgId
 *               - calendarId
 *               - appointment
 *             properties:
 *               orgId:
 *                 type: string
 *               calendarId:
 *                 type: string
 *               appointment:
 *                 $ref: '#/components/schemas/AppointmentInput'
 *     responses:
 *       '200':
 *         description: Created appointment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 appointment:
 *                   $ref: '#/components/schemas/Appointment'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '500':
 *         $ref: '#/components/responses/InternalError'
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

    const batch = db.batch();
    const aptsRef = db.collection('appointments').doc();
    batch.set(aptsRef, payload);

    if (appointment.slotId) {
      const slotRef = db.collection('time_slots').doc(appointment.slotId);
      batch.update(slotRef, { status: 'booked', updatedAt: new Date(now) });
    }

    await batch.commit();

    const created = await aptsRef.get();
    const result = created.exists ? mapAppointmentDoc(created) : null;
    res.json({ appointment: result });
  } catch (err: unknown) {
    console.error('Error creating tenant appointment (backend):', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @openapi
 * /appointments/with-slot:
 *   post:
 *     summary: Create a new appointment (compatibility) with slotId in body
 *     tags:
 *       - Appointments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orgId
 *               - calendarId
 *               - appointment
 *             properties:
 *               orgId:
 *                 type: string
 *               calendarId:
 *                 type: string
 *               appointment:
 *                 $ref: '#/components/schemas/AppointmentInput'
 *               slotId:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Created appointment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 appointment:
 *                   $ref: '#/components/schemas/Appointment'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 */
export const postCreateTenantAppointmentWithSlot = async (req: Request, res: Response) => {
  // For compatibility: body may include slotId separately
  const { orgId, calendarId, appointment, slotId } = req.body;
  if (!orgId || !calendarId || !appointment) {
    return res.status(400).json({ error: 'Missing required fields: orgId, calendarId, appointment' });
  }

  try {
    const now = Date.now();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 90);

    const appointmentPayload = {
      org_id: orgId,
      calendar_id: calendarId,
      slotId: appointment.slotId || slotId,
      email: appointment.email,
      locationDetails: appointment.locationDetails || { type: appointment.locationDetails?.type },
      status: appointment.status,
      appointmentDate: appointment.appointmentDate,
      createdAt: new Date(now),
      expiresAt,
      notes: appointment.notes,
    };

    const batch = db.batch();
    const appointmentRef = db.collection('appointments').doc();
    batch.set(appointmentRef, appointmentPayload);

    const targetSlotId = appointment.slotId || slotId;
    if (targetSlotId) {
      const slotRef = db.collection('time_slots').doc(targetSlotId);
      batch.update(slotRef, { status: 'booked', updatedAt: new Date(now) });
    }

    await batch.commit();

    const created = await appointmentRef.get();
    res.json({ appointment: created.exists ? mapAppointmentDoc(created) : null });
  } catch (err) {
    console.error('Error creating tenant appointment with slot:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @openapi
 * /appointments/{id}:
 *   put:
 *     summary: Update an existing appointment
 *     tags:
 *       - Appointments
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orgId
 *               - calendarId
 *               - patch
 *             properties:
 *               orgId:
 *                 type: string
 *               calendarId:
 *                 type: string
 *               patch:
 *                 type: object
 *                 properties:
 *                   slotId:
 *                     type: string
 *                   email:
 *                     type: string
 *                   status:
 *                     type: string
 *                   appointmentDate:
 *                     type: string
 *                   notes:
 *                     type: string
 *     responses:
 *       '200':
 *         description: Updated appointment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 appointment:
 *                   $ref: '#/components/schemas/Appointment'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 */
export const putUpdateTenantAppointment = async (req: Request, res: Response) => {
  const { id } = req.params;
  type AppointmentPatch = {
    slotId?: string;
    email?: string;
    status?: string;
    appointmentDate?: string;
    notes?: string;
  };
  const { orgId, calendarId, patch } = req.body as { orgId?: string; calendarId?: string; patch?: AppointmentPatch };
  if (!id || !orgId || !calendarId || !patch) return res.status(400).json({ error: 'id, orgId, calendarId and patch required' });

  try {
    const docRef = db.collection('appointments').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ error: 'Appointment not found' });
    const data = snap.data();
    if (data?.org_id !== orgId || data.calendar_id !== calendarId) return res.status(403).json({ error: 'Unauthorized' });

    const updateData: Partial<{
      slotId: string;
      email: string;
      status: string;
      appointmentDate: string;
      notes: string;
      updatedAt: Date;
    }> = { updatedAt: new Date() };
    if (patch.slotId !== undefined) updateData.slotId = patch.slotId;
    if (patch.email !== undefined) updateData.email = patch.email;
    if (patch.status !== undefined) updateData.status = patch.status;
    if (patch.appointmentDate !== undefined) updateData.appointmentDate = patch.appointmentDate;
    if (patch.notes !== undefined) updateData.notes = patch.notes;

    await docRef.update(updateData);
    const updated = await docRef.get();
    res.json({ appointment: mapAppointmentDoc(updated) });
  } catch (err) {
    console.error('Error updating tenant appointment:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @openapi
 * /appointments/{id}:
 *   delete:
 *     summary: Delete a tenant appointment
 *     tags:
 *       - Appointments
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: orgId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *       - name: calendarId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Deletion result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 */
export const deleteTenantAppointment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { orgId, calendarId } = req.query as Record<string, string>;
  if (!id || !orgId || !calendarId) return res.status(400).json({ error: 'id, orgId and calendarId required' });

  try {
    const docRef = db.collection('appointments').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ error: 'Appointment not found' });
    const data = snap.data();
    if (data?.org_id !== orgId || data.calendar_id !== calendarId) return res.status(403).json({ error: 'Unauthorized' });

    await docRef.delete();
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting tenant appointment:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
