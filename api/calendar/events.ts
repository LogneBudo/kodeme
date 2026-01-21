
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getCalendarToken } from "../_shared/calendarTokensApi";
import { getAuthContext } from "../apiUtils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { orgId, branchId, userId } = getAuthContext(req);
    if (!orgId || !userId) {
      return res.status(401).json({ error: "Missing orgId or userId in request context" });
    }

    // Try Google token
    const googleToken = await getCalendarToken({ provider: "google", orgId, branchId, userId });
    // Try Outlook token
    const outlookToken = await getCalendarToken({ provider: "outlook", orgId, branchId, userId });

    if (!googleToken && !outlookToken) {
      return res.status(403).json({ error: "No connected calendar for this user" });
    }

    // TODO: Fetch events from Google/Outlook using tokens
    // For now, just return which provider is connected
    return res.json({
      events: [],
      connected: !!googleToken,
      outlookConnected: !!outlookToken,
    });
  } catch (error: any) {
    console.error("/api/calendar/events error", error);
    return res.status(500).json({ error: error?.message || "Failed to fetch calendar events" });
  }
}
