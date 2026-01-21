import { Request, Response } from 'express';
import { saveCalendarToken } from '../../services/calendarTokensService';
import { getAuthContext } from '../../services/apiUtilsService';

export const init = (req: Request, res: Response) => {
  try {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: 'Missing Microsoft client credentials in environment' });
    }
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
    const redirectUri = process.env.MICROSOFT_REDIRECT_URI || `${proto}://${host}/auth/outlook/callback`;
    const scopes = ['Calendars.ReadWrite', 'offline_access'];
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: scopes.join(' '),
      response_mode: 'query',
    });
    const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
    return res.json({ url });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to start Outlook OAuth' });
  }
};

/**
 * @openapi
 * /api/auth/outlook/init:
 *   get:
 *     summary: Start Microsoft OAuth flow (returns redirect URL)
 *     tags:
 *       - auth
 *     responses:
 *       '200':
 *         description: URL to redirect the user to
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UrlResponse'
 *       '500':
 *         $ref: '#/components/responses/InternalError'
 */

export const callback = async (req: Request, res: Response) => {
  try {
    const { code, error: oauthError } = req.query as { code?: string; error?: string };
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
    const adminSettingsUrl = `${proto}://${host}/admin/settings`;
    if (oauthError) {
      return res.redirect(`${adminSettingsUrl}?error=${encodeURIComponent(oauthError)}&provider=outlook`);
    }
    if (!code) {
      return res.redirect(`${adminSettingsUrl}?error=missing_code&provider=outlook`);
    }
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    const redirectUri = process.env.MICROSOFT_REDIRECT_URI || `${proto}://${host}/auth/outlook/callback`;
    if (!clientId || !clientSecret) throw new Error('Missing Microsoft client credentials');
    const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: code as string,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error(tokens.error_description || 'Failed to get tokens');
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
    if (!orgIdStr || !userIdStr) {
      return res.redirect(`${adminSettingsUrl}?error=missing_context&provider=outlook`);
    }
    await saveCalendarToken({
      provider: 'outlook',
      orgId: orgIdStr,
      branchId: branchIdStr,
      userId: userIdStr,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : undefined,
      scope: tokens.scope,
      tokenType: tokens.token_type,
    });
    return res.redirect(`${adminSettingsUrl}?calendar=connected&provider=outlook`);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to handle Outlook OAuth callback' });
  }
};

/**
 * @openapi
 * /api/auth/outlook/callback:
 *   get:
 *     summary: OAuth callback for Microsoft Outlook (redirects to admin settings)
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
