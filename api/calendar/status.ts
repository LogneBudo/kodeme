import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    // For now, return false for both calendars since tokens are ephemeral and stored per-function
    // When a user successfully connects a calendar, they will see it immediately in that session
    // On page reload or new session, calendars will show as disconnected (tokens are lost)
    // This is a known limitation of in-memory token storage in serverless
    return res.json({ connected: false, outlookConnected: false });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || "Failed to check calendar status" });
  }
}
