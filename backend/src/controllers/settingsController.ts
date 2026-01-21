import * as settingsService from '../services/settingsService';
import { Request, Response } from 'express';

export async function getSettings(req: Request, res: Response) {
  try {
    const data = await settingsService.getSettings();
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
}

/**
 * @openapi
 * /settings:
 *   get:
 *     summary: Get global settings
 *     tags:
 *       - Settings
 *     responses:
 *       '200':
 *         description: Settings object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Settings'
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 */

export async function updateSettings(req: Request, res: Response) {
  try {
    await settingsService.updateSettings(req.body);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to update settings' });
  }
}

/**
 * @openapi
 * /settings:
 *   put:
 *     summary: Update global settings
 *     tags:
 *       - Settings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Settings'
 *     responses:
 *       '200':
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 */

export async function getTenantSettings(req: Request, res: Response) {
  const { orgId, calendarId } = req.params;
  try {
    const data = await settingsService.getTenantSettings(orgId, calendarId);
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch tenant settings' });
  }
}

/**
 * @openapi
 * /settings/{orgId}/{calendarId}:
 *   get:
 *     summary: Get tenant settings for a calendar
 *     tags:
 *       - Settings
 *     parameters:
 *       - name: orgId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: calendarId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Tenant settings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Settings'
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 */

export async function updateTenantSettings(req: Request, res: Response) {
  const { orgId, calendarId } = req.params;
  try {
    await settingsService.updateTenantSettings(orgId, calendarId, req.body);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to update tenant settings' });
  }
}

/**
 * @openapi
 * /settings/{orgId}/{calendarId}:
 *   put:
 *     summary: Update tenant settings for a calendar
 *     tags:
 *       - Settings
 *     parameters:
 *       - name: orgId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: calendarId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Settings'
 *     responses:
 *       '200':
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 */
