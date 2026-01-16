import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getOutlookTokens } from "../auth/outlook/callback";
import { getGoogleTokens } from "../auth/google/callback";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const connected = !!getGoogleTokens();
  const outlookConnected = !!getOutlookTokens();
  return res.json({ connected, outlookConnected });
}
