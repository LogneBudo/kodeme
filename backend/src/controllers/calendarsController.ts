import { Request, Response } from 'express';
import { db } from '../services/firebase';

type CalendarDoc = {
  org_id: string;
  name: string;
  address?: string;
  location?: string;
  timezone?: string;
  created_at?: FirebaseFirestore.Timestamp | Date;
  created_by: string;
};

function mapCalendarDoc(doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>) {
  if (!doc.exists) return null;
  const data = doc.data() as CalendarDoc;
  return {
    id: doc.id,
    org_id: data.org_id,
    name: data.name,
    address: data.address,
    location: data.location,
    timezone: data.timezone,
    created_at: data.created_at && (data.created_at instanceof Date ? data.created_at : (data.created_at as FirebaseFirestore.Timestamp).toDate()),
    created_by: data.created_by,
  };
}

/**
 * @openapi
 * /calendars:
 *   get:
 *     summary: List tenant calendars
 *     tags:
 *       - Calendars
 *     parameters:
 *       - name: orgId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: A list of calendars
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 calendars:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Calendar'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 */
export const listTenantCalendars = async (req: Request, res: Response) => {
  const { orgId } = req.query as Record<string, string>;
    const queryParams = req.query as Record<string, string>;
    const orgId = queryParams.orgId || queryParams.org_id;
    if (!orgId) return res.status(400).json({ error: 'orgId required' });

  try {
    const snapshot = await db
      .collection('calendars')
      .where('org_id', '==', orgId)
      .orderBy('created_at', 'desc')
      .get();

    const items = snapshot.docs.map(mapCalendarDoc).filter(Boolean);
    res.json({ calendars: items });
  } catch (err) {
    // Fallback handled on client; return error here
    console.error('Error listing tenant calendars:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @openapi
 * /calendars/{id}:
 *   get:
 *     summary: Get a tenant calendar (authorized)
 *     tags:
 *       - Calendars
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
 *     responses:
 *       '200':
 *         description: Calendar found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 calendar:
 *                   $ref: '#/components/schemas/Calendar'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 */
export const getTenantCalendar = async (req: Request, res: Response) => {
  const { orgId } = req.query as Record<string, string>;
  const { id } = req.params;
    const queryParams2 = req.query as Record<string, string>;
    const orgId2 = queryParams2.orgId || queryParams2.org_id;
    if (!orgId2 || !id) return res.status(400).json({ error: 'org_id and calendarId required' });

  try {
    const docRef = db.collection('calendars').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ error: 'Calendar not found' });
    const data = snap.data();
    if (data?.org_id !== orgId) return res.status(403).json({ error: 'Unauthorized' });
    res.json({ calendar: mapCalendarDoc(snap) });
  } catch (err) {
    console.error('Error fetching tenant calendar:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @openapi
 * /calendars/{id}/unsafe:
 *   get:
 *     summary: Get a calendar without org ownership checks (unsafe)
 *     tags:
 *       - Calendars
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Calendar or null when not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 calendar:
 *                   $ref: '#/components/schemas/Calendar'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 */
export const getCalendarUnsafe = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'calendarId required' });
  try {
    const snap = await db.collection('calendars').doc(id).get();
    if (!snap.exists) return res.status(404).json({ calendar: null });
    res.json({ calendar: mapCalendarDoc(snap) });
  } catch (err) {
    console.error('Error in getCalendarUnsafe:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

type CreateCalendarData = {
  name: string;
  address?: string;
  location?: string;
  timezone?: string;
};

type UpdateCalendarData = Partial<Pick<CalendarDoc, 'name' | 'address' | 'location' | 'timezone'>>;

/**
 * @openapi
 * /calendars:
 *   post:
 *     summary: Create a tenant calendar
 *     tags:
 *       - Calendars
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orgId
 *               - userId
 *               - data
 *             properties:
 *               orgId:
 *                 type: string
 *               userId:
 *                 type: string
 *               data:
 *                 $ref: '#/components/schemas/CalendarInput'
 *     responses:
 *       '200':
 *         description: Created calendar
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 calendar:
 *                   $ref: '#/components/schemas/Calendar'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 */
export const postCreateTenantCalendar = async (req: Request, res: Response) => {
  const { orgId, userId, data } = req.body as { orgId?: string; userId?: string; data?: CreateCalendarData };
    const body = req.body as Record<string, unknown>;
    const orgIdBody = (body.orgId as string) || (body.org_id as string) || undefined;
    const userId = body.userId as string | undefined;
    const data = body.data as CreateCalendarData | undefined;
    if (!orgIdBody || !userId || !data) return res.status(400).json({ error: 'org_id, userId and data required' });

  try {
    const docRef = await db.collection('calendars').add({
      org_id: orgId,
      name: data.name,
      address: data.address,
      location: data.location,
      timezone: data.timezone,
      created_at: new Date(),
      created_by: userId,
    });
    const created = await docRef.get();
    res.json({ calendar: mapCalendarDoc(created) });
  } catch (err) {
    console.error('Error creating tenant calendar:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @openapi
 * /calendars/{id}:
 *   put:
 *     summary: Update a tenant calendar
 *     tags:
 *       - Calendars
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
 *               - updates
 *             properties:
 *               orgId:
 *                 type: string
 *               updates:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   address:
 *                     type: string
 *                   location:
 *                     type: string
 *                   timezone:
 *                     type: string
 *     responses:
 *       '200':
 *         description: Updated calendar
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 calendar:
 *                   $ref: '#/components/schemas/Calendar'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 */
export const putUpdateTenantCalendar = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { orgId, updates } = req.body as { orgId?: string; updates?: UpdateCalendarData };
    const body2 = req.body as Record<string, unknown>;
    const orgIdBody2 = (body2.orgId as string) || (body2.org_id as string) || undefined;
    const updates = body2.updates as UpdateCalendarData | undefined;
    if (!id || !orgIdBody2 || !updates) return res.status(400).json({ error: 'id, org_id and updates required' });

  try {
    const docRef = db.collection('calendars').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ error: 'Calendar not found' });
    const data = snap.data();
    if (data?.org_id !== orgId) return res.status(403).json({ error: 'Unauthorized' });

    await docRef.update(updates);
    const updated = await docRef.get();
    res.json({ calendar: mapCalendarDoc(updated) });
  } catch (err) {
    console.error('Error updating tenant calendar:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @openapi
 * /calendars/{id}:
 *   delete:
 *     summary: Delete a tenant calendar
 *     tags:
 *       - Calendars
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
export const deleteTenantCalendar = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { orgId } = req.query as Record<string, string>;
    const queryParams3 = req.query as Record<string, string>;
    const orgId3 = queryParams3.orgId || queryParams3.org_id;
    if (!id || !orgId3) return res.status(400).json({ error: 'id and org_id required' });

  try {
    const docRef = db.collection('calendars').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ error: 'Calendar not found' });
    const data = snap.data();
    if (data?.org_id !== orgId) return res.status(403).json({ error: 'Unauthorized' });

    // Note: client code may expect deletion despite active references; ensure caller checks
    await docRef.delete();
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting tenant calendar:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
