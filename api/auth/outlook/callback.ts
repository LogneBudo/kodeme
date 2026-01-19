
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { saveCalendarToken } from "../../../src/api/calendarTokensApi";
import { getAuthContext } from "../../apiUtils";


export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { code, error: oauthError } = req.query as { code?: string; error?: string };
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const proto = (req.headers["x-forwarded-proto"] as string) || "https";
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
    if (!clientId || !clientSecret) throw new Error("Missing Microsoft client credentials");

    const tokenUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error(tokens.error_description || "Failed to get tokens");

    // Extract multi-tenant context (orgId, branchId, userId)
    const { orgId, branchId, userId } = getAuthContext(req);
    if (!orgId || !userId) {
      return res.redirect(`${adminSettingsUrl}?error=missing_context&provider=outlook`);
    }

    // Save tokens to Firestore
    await saveCalendarToken({
      provider: "outlook",
      orgId,
      branchId,
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : undefined,
      scope: tokens.scope,
      tokenType: tokens.token_type,
    });

    return res.redirect(`${adminSettingsUrl}?calendar=connected&provider=outlook`);
  } catch (error: any) {
    console.error("/api/auth/outlook/callback error", error);
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const proto = (req.headers["x-forwarded-proto"] as string) || "https";
    const adminSettingsUrl = `${proto}://${host}/admin/settings`;
    return res.redirect(`${adminSettingsUrl}?error=callback_failed&message=${encodeURIComponent(error?.message || "unknown")}&provider=outlook`);
  }
}
