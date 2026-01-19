import type { VercelRequest, VercelResponse } from "@vercel/node";
import { deleteCalendarToken } from "../../../src/api/calendarTokensApi";
import { getAuthContext } from "../../apiUtils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { provider } = req.query;
  if (provider !== "google" && provider !== "outlook") {
    return res.status(400).json({ error: "Invalid provider" });
  }
  const { orgId, branchId, userId } = getAuthContext(req);
  if (!orgId || !userId) {
    return res.status(401).json({ error: "Missing orgId or userId in request context" });
  }
  try {
    const ok = await deleteCalendarToken({ provider, orgId, branchId, userId });
    if (ok) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(404).json({ error: "No token found to delete" });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || "Failed to disconnect calendar" });
  }
}
