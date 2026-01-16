import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";

function getRedirectUri(req: VercelRequest) {
  const envUri = process.env.GOOGLE_REDIRECT_URI;
  if (envUri) return envUri;
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = (req.headers["x-forwarded-proto"] as string) || "https";
  return `${proto}://${host}/auth/google/callback`;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: "Missing Google client credentials" });
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, getRedirectUri(req));
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/calendar.events",
      ],
    });
    return res.json({ url });
  } catch (error: any) {
    console.error("/api/auth/google/init error", error);
    return res.status(500).json({ error: error?.message || "Failed to start Google OAuth" });
  }
}
