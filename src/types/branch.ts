/**
 * Calendar Types
 * MULTI-TENANCY: Each calendar is an independent booking calendar instance
 * A company can have multiple calendars (NYC Office, Boston Office, etc.)
 */

export type Calendar = {
  id: string; // Firestore document ID
  org_id: string; // Which organization owns this branch
  name: string; // "NYC Office"
  address?: string;
  location?: {
    lat: number;
    lng: number;
  };
  timezone: string; // "America/New_York"
  
  created_at: Date;
  created_by: string; // uid of person who created this calendar
};
