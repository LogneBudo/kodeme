import { Request, Response } from 'express';
import { db } from '../services/firebase';

function mapOrgDoc(doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>) {
  if (!doc.exists) return null;
  const data = doc.data() as Record<string, unknown>;
  return {
    org_id: doc.id,
    ...data,
  };
}

export const postCreateOrganization = async (req: Request, res: Response) => {
/**
 * @openapi
 * /organizations:
 *   post:
 *     summary: Create a new organization and seed default calendar/settings
 *     tags:
 *       - Organizations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - created_by
 *             properties:
 *               name:
 *                 type: string
 *               subscription_tier:
 *                 type: string
 *               created_by:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Created organization
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 organization:
 *                   $ref: '#/components/schemas/Organization'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 */
  const { name, subscription_tier, created_by } = req.body as { name?: string; subscription_tier?: string; created_by?: string };
  if (!name || !created_by) return res.status(400).json({ error: 'name and created_by required' });

  try {
    const now = new Date();

    // Generate org doc with client-specified id
    const orgRef = db.collection('organizations').doc();
    const orgId = orgRef.id;

    const orgData = {
      org_id: orgId,
      name,
      subscription_tier: subscription_tier || 'free',
      owner_uid: created_by,
      created_at: now,
      updated_at: now,
    };

    await orgRef.set(orgData);

    // Create default calendar
    const defaultCalendarId = `${orgId}-primary`;
    const calendar = {
      org_id: orgId,
      name: 'Primary Calendar',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      created_at: now,
      created_by,
    };
    await db.collection('calendars').doc(defaultCalendarId).set(calendar);

    // Seed settings
    const settingsId = `${orgId}_${defaultCalendarId}`;
    const rootSettings = {
      org_id: orgId,
      calendar_id: defaultCalendarId,
      workingHours: { startTime: '09:00', endTime: '17:00' },
      workingDays: [1, 2, 3, 4, 5],
      blockedSlots: [],
      oneOffUnavailableSlots: [],
      calendarSync: { autoCreateEvents: true, showBusyTimes: false, syncCancellations: true },
      restaurantCity: '',
      restaurantCountry: '',
      restaurantPerimeterKm: 5,
      restaurants: [],
      curatedList: '',
      updatedAt: now,
    };
    try {
      await db.collection('settings').doc(settingsId).set(rootSettings);
    } catch (e) {
      // Non-fatal: may fail if account is not allowed to seed
      console.warn('[setup] Root settings seed failed', e);
    }

    // Update user with org_id and branch assignment
    const userRef = db.collection('users').doc(created_by);
    const userSnap = await userRef.get();
    const branch_assignments = userSnap.exists ? (userSnap.data()?.branch_assignments || {}) : {};
    branch_assignments[defaultCalendarId] = 'owner';
    await userRef.set({ org_id: orgId, branch_assignments, role: 'owner', updated_at: now }, { merge: true });

    const created = await orgRef.get();
    res.json({ organization: mapOrgDoc(created) });
  } catch (err) {
    console.error('Error creating organization (backend):', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getOrganization = async (req: Request, res: Response) => {
/**
 * @openapi
 * /organizations/{id}:
 *   get:
 *     summary: Get organization by id
 *     tags:
 *       - Organizations
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Organization
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 organization:
 *                   $ref: '#/components/schemas/Organization'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 */
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'orgId required' });
  try {
    const snap = await db.collection('organizations').doc(id).get();
    if (!snap.exists) return res.status(404).json({ organization: null });
    res.json({ organization: mapOrgDoc(snap) });
  } catch (err) {
    console.error('Error fetching organization:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTenantByUser = async (req: Request, res: Response) => {
/**
 * @openapi
 * /organizations/by-user:
 *   get:
 *     summary: Get organization for a user
 *     tags:
 *       - Organizations
 *     parameters:
 *       - name: userId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Organization
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 organization:
 *                   $ref: '#/components/schemas/Organization'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 */
  const { userId } = req.query as Record<string, string>;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  try {
    const userSnap = await db.collection('users').doc(userId).get();
    if (!userSnap.exists) return res.status(404).json({ organization: null });
    const orgId = userSnap.data()?.org_id;
    if (!orgId) return res.status(404).json({ organization: null });
    const orgSnap = await db.collection('organizations').doc(orgId).get();
    if (!orgSnap.exists) return res.status(404).json({ organization: null });
    res.json({ organization: mapOrgDoc(orgSnap) });
  } catch (err) {
    console.error('Error fetching tenant by user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const putUpdateOrganization = async (req: Request, res: Response) => {
/**
 * @openapi
 * /organizations/{id}:
 *   put:
 *     summary: Update organization
 *     tags:
 *       - Organizations
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
 *             properties:
 *               updates:
 *                 type: object
 *     responses:
 *       '200':
 *         description: Updated organization
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 organization:
 *                   $ref: '#/components/schemas/Organization'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 */
  const { id } = req.params;
  const updates = req.body as Record<string, unknown>;
  if (!id || !updates) return res.status(400).json({ error: 'id and updates required' });
  try {
    const orgRef = db.collection('organizations').doc(id);
    await orgRef.update({ ...updates, updated_at: new Date() });
    const updated = await orgRef.get();
    res.json({ organization: mapOrgDoc(updated) });
  } catch (err) {
    console.error('Error updating organization:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
