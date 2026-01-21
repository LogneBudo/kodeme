export interface Invitation {
  code: string;
  org_id: string;
  expires: number;
  used_by?: string;
  created_by: string;
  created_at: number;
  redeemed_at?: number;
}
