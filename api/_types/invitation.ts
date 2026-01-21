export interface Invitation {
  code: string; // unique invitation code
  org_id: string; // organization to join
  expires: number; // timestamp (ms) when invitation expires
  used_by?: string; // user id who redeemed
  created_by: string; // user id who created
  created_at: number; // timestamp (ms)
  redeemed_at?: number; // timestamp (ms) when redeemed
}
