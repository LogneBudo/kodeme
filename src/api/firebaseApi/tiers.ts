import API_BASE_URL from '../../config/api';

export async function canAddUserToTenant(orgId: string): Promise<boolean> {
  const resp = await fetch(`${API_BASE_URL}/tiers/can-add-user/${encodeURIComponent(orgId)}`);
  if (!resp.ok) throw new Error('Failed to check user limit');
  const data = await resp.json();
  return !!data.allowed;
}

export async function canAddBranchToTenant(orgId: string): Promise<boolean> {
  const resp = await fetch(`${API_BASE_URL}/tiers/can-add-branch/${encodeURIComponent(orgId)}`);
  if (!resp.ok) throw new Error('Failed to check branch limit');
  const data = await resp.json();
  return !!data.allowed;
}

export async function hasTierFeature(orgId: string, feature: string): Promise<boolean> {
  const resp = await fetch(`${API_BASE_URL}/tiers/has-feature/${encodeURIComponent(orgId)}/${encodeURIComponent(feature)}`);
  if (!resp.ok) throw new Error('Failed to check feature access');
  const data = await resp.json();
  return !!data.allowed;
}
