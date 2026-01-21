
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getCalendarToken } from "../_shared/calendarTokensApi";
import { getAuthContext } from "../apiUtils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { orgId, branchId, userId } = getAuthContext(req);
    if (!orgId || !userId) {
      return res.status(401).json({ error: "Missing orgId or userId in request context" });
    }

    const googleToken = await getCalendarToken({ provider: "google", orgId, branchId, userId });
    const outlookToken = await getCalendarToken({ provider: "outlook", orgId, branchId, userId });

    return res.json({
      connected: !!googleToken,
      outlookConnected: !!outlookToken,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || "Failed to check calendar status" });
  }
}
