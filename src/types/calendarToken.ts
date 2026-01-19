/**
 * Calendar Token Types
 * MULTI-TENANCY: OAuth tokens stored per org + branch + user
 */

export type CalendarToken = {
  id?: string; // Document ID (usually {orgId}_{calendarId}_{userId})
  org_id: string; // MULTI-TENANCY: Which organization owns this token
  calendar_id: string; // MULTI-TENANCY: Which calendar this token applies to
  user_uid: string; // Firebase Auth UID of the user who authorized
  
  provider: "google" | "outlook";
  
  // Encrypted before storage
  access_token: string; // ENCRYPTED
  refresh_token?: string; // ENCRYPTED
  
  token_expires_at?: Date;
  
  created_at: Date;
  updated_at?: Date;
};

/**
 * OAuth token response from Google/Microsoft
 */
export type OAuthTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
};
