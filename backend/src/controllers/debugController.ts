import { Request, Response } from 'express';

export const getEnv = (_req: Request, res: Response) => {
  return res.json({
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasGoogleRedirectUri: !!process.env.GOOGLE_REDIRECT_URI,
    hasMicrosoftClientId: !!process.env.MICROSOFT_CLIENT_ID,
    hasMicrosoftClientSecret: !!process.env.MICROSOFT_CLIENT_SECRET,
    hasMicrosoftRedirectUri: !!process.env.MICROSOFT_REDIRECT_URI,
    googleClientIdStart: process.env.GOOGLE_CLIENT_ID?.substring(0, 5) || 'NOT SET',
  });
};

/**
 * @openapi
 * /api/debug:
 *   get:
 *     summary: Debug environment flags (non-sensitive)
 *     tags:
 *       - debug
 *     responses:
 *       '200':
 *         description: Environment status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasGoogleClientId:
 *                   type: boolean
 *                 hasGoogleClientSecret:
 *                   type: boolean
 *                 hasGoogleRedirectUri:
 *                   type: boolean
 *                 hasMicrosoftClientId:
 *                   type: boolean
 *                 hasMicrosoftClientSecret:
 *                   type: boolean
 *                 hasMicrosoftRedirectUri:
 *                   type: boolean
 *                 googleClientIdStart:
 *                   type: string
 */
