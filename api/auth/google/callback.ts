
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";
import { saveCalendarToken } from "../../../src/api/calendarTokensApi";
import { getAuthContext } from "../../apiUtils";

function getRedirectUri(req: VercelRequest) {
  const envUri = process.env.GOOGLE_REDIRECT_URI;
  if (envUri) return envUri;
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = (req.headers["x-forwarded-proto"] as string) || "https";
  return `${proto}://${host}/auth/google/callback`;
}


export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { code, error: oauthError } = req.query as { code?: string; error?: string };
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const proto = (req.headers["x-forwarded-proto"] as string) || "https";
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
      throw new Error("Missing Google client credentials");
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, getRedirectUri(req));
    const { tokens } = await oauth2Client.getToken(code);

    // Extract multi-tenant context (orgId, branchId, userId)
    const { orgId, branchId, userId } = getAuthContext(req);
    if (!orgId || !userId) {
      return res.redirect(`${adminSettingsUrl}?error=missing_context&provider=google`);
    }

    // Save tokens to Firestore
    await saveCalendarToken({
      provider: "google",
      orgId,
      branchId,
      userId,
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expiry_date,
      scope: tokens.scope,
      tokenType: tokens.token_type,
    });

    return res.redirect(`${adminSettingsUrl}?calendar=connected&provider=google`);
  } catch (error: any) {
    console.error("/api/auth/google/callback error", error);
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const proto = (req.headers["x-forwarded-proto"] as string) || "https";
    const adminSettingsUrl = `${proto}://${host}/admin/settings`;
    return res.redirect(`${adminSettingsUrl}?error=callback_failed&message=${encodeURIComponent(error?.message || "unknown")}&provider=google`);
  }
}
