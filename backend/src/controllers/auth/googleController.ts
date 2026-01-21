import { Request, Response } from 'express';
import { google } from 'googleapis';
import { saveCalendarToken } from '../../services/calendarTokensService';
import { getAuthContext } from '../../services/apiUtilsService';

function getRedirectUri(req: Request) {
  const envUri = process.env.GOOGLE_REDIRECT_URI;
  if (envUri) return envUri;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  return `${proto}://${host}/auth/google/callback`;
}

export const init = (req: Request, res: Response) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'Missing Google client credentials in environment' });
    }
    const redirectUri = getRedirectUri(req);
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events',
      ],
    });
    return res.json({ url });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to start Google OAuth' });
  }
};

/**
 * @openapi
 * /api/auth/google/init:
 *   get:
 *     summary: Start Google OAuth flow (returns redirect URL)
 *     tags:
 *       - auth
 *     responses:
 *       '200':
 *         description: URL to redirect the user to
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UrlResponse'
 */

export const callback = async (req: Request, res: Response) => {
  try {
    const { code, error: oauthError } = req.query as { code?: string; error?: string };
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
    const adminSettingsUrl = `${proto}://${host}/admin/settings`;
    if (oauthError) {
      return res.redirect(`${adminSettingsUrl}?error=${encodeURIComponent(oauthError)}&provider=google`);
    }
    if (!code) {
      return res.redirect(`${adminSettingsUrl}?error=missing_code&provider=google`);
    }
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error('Missing Google client credentials');
    }
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, getRedirectUri(req));
    const { tokens } = await oauth2Client.getToken(code as string);
    const { orgId, branchId, userId } = getAuthContext(req);
    const orgIdStr = Array.isArray(orgId)
      ? String(orgId[0])
      : typeof orgId === 'string'
      ? orgId
      : orgId
      ? String(orgId)
      : '';
    const branchIdStr = branchId
      ? Array.isArray(branchId)
        ? String(branchId[0])
        : typeof branchId === 'string'
        ? branchId
        : String(branchId)
      : undefined;
    const userIdStr = Array.isArray(userId)
      ? String(userId[0])
      : typeof userId === 'string'
      ? userId
      : userId
      ? String(userId)
      : '';
    if (!orgId || !userId) {
      return res.redirect(`${adminSettingsUrl}?error=missing_context&provider=google`);
    }
    await saveCalendarToken({
      provider: 'google',
      orgId: orgIdStr,
      branchId: branchIdStr,
      userId: userIdStr,
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token ?? undefined,
      expiresAt: tokens.expiry_date ?? undefined,
      scope: tokens.scope ?? undefined,
      tokenType: tokens.token_type ?? undefined,
    });
    return res.redirect(`${adminSettingsUrl}?calendar=connected&provider=google`);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to handle Google OAuth callback' });
  }
};

/**
 * @openapi
 * /api/auth/google/callback:
 *   get:
 *     summary: OAuth callback for Google (redirects to admin settings)
 *     tags:
 *       - auth
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *       - in: query
 *         name: error
 *         schema:
 *           type: string
 *     responses:
 *       '302':
 *         description: Redirects to admin settings on success or error
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 */
