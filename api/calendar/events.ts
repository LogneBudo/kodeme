import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";
import { getGoogleTokens } from "../auth/google/callback";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const tokens = getGoogleTokens();
    if (!tokens) return res.status(401).json({ error: "Google not connected yet" });

    const { startDate, endDate } = req.body || {};
    if (!startDate || !endDate) return res.status(400).json({ error: "startDate and endDate are required" });

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oauth2Client.setCredentials(tokens);

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date(startDate).toISOString(),
      timeMax: new Date(endDate).toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = (response.data.items || []).map((evt) => {
      const startTime = (evt.start as any)?.dateTime || (evt.start as any)?.date;
      const endTime = (evt.end as any)?.dateTime || (evt.end as any)?.date;
      return {
        id: evt.id,
        title: evt.summary || "Busy",
        startTime,
        endTime,
        provider: "google",
        isAllDay: !(evt.start as any)?.dateTime,
      };
    });

    return res.json({ events });
  } catch (error: any) {
    console.error("/api/calendar/events error", error);
    return res.status(500).json({ error: error?.message || "Failed to fetch calendar events" });
  }
}
