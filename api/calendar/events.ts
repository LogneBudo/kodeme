import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Token storage is ephemeral in serverless - return empty events
    // This is a known limitation. Calendar integration requires persistent token storage (e.g., Firestore, Vercel KV)
    return res.json({ events: [] });
  } catch (error: any) {
    console.error("/api/calendar/events error", error);
    return res.status(500).json({ error: error?.message || "Failed to fetch calendar events" });
  }
}
