import { Request, Response } from 'express';
import { createInvitation, validateInvitation, redeemInvitation } from '../services/invitationsService';

/**
 * @openapi
 * /api/invitations:
 *   post:
 *     summary: Create an invitation
 *     tags:
 *       - invitations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [org_id, created_by, expires]
 *             properties:
 *               org_id:
 *                 type: string
 *               created_by:
 *                 type: string
 *               expires:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       '200':
 *         description: Invitation created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Invitation'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 */
export const postCreateInvitation = async (req: Request, res: Response) => {
  const { org_id, created_by, expires } = req.body;
  if (!org_id || !created_by || !expires) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const invitation = await createInvitation(org_id, created_by, expires);
    res.json(invitation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @openapi
 * /api/invitations/validate/{code}:
 *   get:
 *     summary: Validate an invitation code
 *     tags:
 *       - invitations
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Invitation object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Invitation'
 *       '404':
 *         description: Invalid or expired invitation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getValidateInvitation = async (req: Request, res: Response) => {
  const { code } = req.params;
  if (!code) return res.status(400).json({ error: 'Missing code' });
  try {
    const invitation = await validateInvitation(code);
    if (!invitation) return res.status(404).json({ error: 'Invalid or expired invitation' });
    res.json(invitation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @openapi
 * /api/invitations/redeem:
 *   post:
 *     summary: Redeem an invitation
 *     tags:
 *       - invitations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, user_id]
 *             properties:
 *               code:
 *                 type: string
 *               user_id:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Redeemed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 */
export const postRedeemInvitation = async (req: Request, res: Response) => {
  const { code, user_id } = req.body;
  if (!code || !user_id) return res.status(400).json({ error: 'Missing code or user_id' });
  try {
    const success = await redeemInvitation(code, user_id);
    if (!success) return res.status(400).json({ error: 'Invalid or expired invitation' });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
