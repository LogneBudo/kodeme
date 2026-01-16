import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    if (!clientId) {
      console.error("Missing MICROSOFT_CLIENT_ID environment variable");
      return res.status(500).json({ error: "Missing Microsoft client credentials in environment" });
    }

    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const proto = (req.headers["x-forwarded-proto"] as string) || "https";
    const redirectUri = process.env.MICROSOFT_REDIRECT_URI || `${proto}://${host}/auth/outlook/callback`;

    const scopes = ["Calendars.ReadWrite", "offline_access"];
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: scopes.join(" "),
      response_mode: "query",
    });
    const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
    return res.json({ url });
  } catch (error: any) {
    console.error("/api/auth/outlook/init error:", error?.message, error?.stack);
    return res.status(500).json({ error: error?.message || "Failed to start Outlook OAuth" });
  }
}
