// Frontend-safe Google OAuth config (no secrets here). Client secret must live only on the backend/.env (not bundled).
export const GOOGLE_OAUTH_CONFIG = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "",
  redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI ?? "http://localhost:4000/auth/google/callback",
  scopes: [
    "https://www.googleapis.com/auth/calendar.readonly", // Read calendar events
    "https://www.googleapis.com/auth/calendar.events", // Create/modify events
  ],
};