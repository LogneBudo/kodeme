import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  // For debugging only - shows which env vars are set
  return res.json({
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasGoogleRedirectUri: !!process.env.GOOGLE_REDIRECT_URI,
    hasMicrosoftClientId: !!process.env.MICROSOFT_CLIENT_ID,
    hasMicrosoftClientSecret: !!process.env.MICROSOFT_CLIENT_SECRET,
    hasMicrosoftRedirectUri: !!process.env.MICROSOFT_REDIRECT_URI,
    // Show first few chars for debugging (safely)
    googleClientIdStart: process.env.GOOGLE_CLIENT_ID?.substring(0, 5) || "NOT SET",
  });
}
