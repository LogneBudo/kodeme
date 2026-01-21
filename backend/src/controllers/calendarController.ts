import { Request, Response } from 'express';
import { getCalendarToken, deleteCalendarToken } from '../services/calendarTokensService';
import { getAuthContext } from '../services/apiUtilsService';

/**
 * @openapi
 * /api/calendar/events:
 *   get:
 *     summary: Retrieve calendar events and connection status
 *     tags:
 *       - calendar
 *     responses:
 *       '200':
 *         description: Events list with connection flags
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventsResponse'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         description: No connected calendar for this user
 */
export const getEvents = async (req: Request, res: Response) => {
  try {
    const { orgId, branchId, userId } = getAuthContext(req);
    const orgIdStr = Array.isArray(orgId) ? String(orgId[0]) : typeof orgId === 'object' ? '' : String(orgId);
    const branchIdStr = Array.isArray(branchId) ? String(branchId[0]) : typeof branchId === 'object' ? '' : String(branchId);
    const userIdStr = Array.isArray(userId) ? String(userId[0]) : typeof userId === 'object' ? '' : String(userId);
    if (!orgIdStr || !userIdStr) {
      return res.status(401).json({ error: 'Missing orgId or userId in request context' });
    }
    const googleToken = await getCalendarToken({ provider: 'google', orgId: orgIdStr, branchId: branchIdStr, userId: userIdStr });
    const outlookToken = await getCalendarToken({ provider: 'outlook', orgId: orgIdStr, branchId: branchIdStr, userId: userIdStr });
    if (!googleToken && !outlookToken) {
      return res.status(403).json({ error: 'No connected calendar for this user' });
    }
    // TODO: Fetch events from Google/Outlook using tokens
    return res.json({ events: [], connected: !!googleToken, outlookConnected: !!outlookToken });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

/**
 * @openapi
 * /api/calendar/disconnect:
 *   post:
 *     summary: Disconnect calendar provider
 *     tags:
 *       - calendar
 *     parameters:
 *       - in: query
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, outlook]
 *     responses:
 *       '200':
 *         description: Success
 *       '400':
 *         description: Invalid provider
 */
export const postDisconnect = async (req: Request, res: Response) => {
  try {
    const { provider } = req.query;
    const providerStr = Array.isArray(provider) ? provider[0] : typeof provider === 'object' ? '' : provider;
    if (providerStr !== 'google' && providerStr !== 'outlook') {
      return res.status(400).json({ error: 'Invalid provider' });
    }
    const { orgId, branchId, userId } = getAuthContext(req);
    const orgIdStr = Array.isArray(orgId) ? String(orgId[0]) : typeof orgId === 'object' ? '' : String(orgId);
    const branchIdStr = Array.isArray(branchId) ? String(branchId[0]) : typeof branchId === 'object' ? '' : String(branchId);
    const userIdStr = Array.isArray(userId) ? String(userId[0]) : typeof userId === 'object' ? '' : String(userId);
    if (!orgIdStr || !userIdStr) {
      return res.status(401).json({ error: 'Missing orgId or userId in request context' });
    }
    const ok = await deleteCalendarToken({ provider: providerStr, orgId: orgIdStr, branchId: branchIdStr, userId: userIdStr });
    if (ok) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(404).json({ error: 'No token found to delete' });
    }
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

/**
 * @openapi
 * /api/calendar/status:
 *   get:
 *     summary: Get calendar connection status
 *     tags:
 *       - calendar
 *     responses:
 *       '200':
 *         description: Status object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StatusResponse'
 */
export const getStatus = async (req: Request, res: Response) => {
  try {
    const { orgId, branchId, userId } = getAuthContext(req);
    const orgIdStr = Array.isArray(orgId) ? String(orgId[0]) : typeof orgId === 'object' ? '' : String(orgId);
    const branchIdStr = Array.isArray(branchId) ? String(branchId[0]) : typeof branchId === 'object' ? '' : String(branchId);
    const userIdStr = Array.isArray(userId) ? String(userId[0]) : typeof userId === 'object' ? '' : String(userId);
    if (!orgIdStr || !userIdStr) {
      return res.status(401).json({ error: 'Missing orgId or userId in request context' });
    }
    const googleToken = await getCalendarToken({ provider: 'google', orgId: orgIdStr, branchId: branchIdStr, userId: userIdStr });
    const outlookToken = await getCalendarToken({ provider: 'outlook', orgId: orgIdStr, branchId: branchIdStr, userId: userIdStr });
    return res.json({ connected: !!googleToken, outlookConnected: !!outlookToken });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
