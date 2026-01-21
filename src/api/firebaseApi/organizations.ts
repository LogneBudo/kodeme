import type { Organization } from "../../types/organization";
import API_BASE_URL from '../../config/api';
// ============ PHASE 2.4: TENANT MANAGEMENT FUNCTIONS ============

/**
 * Create a new organization with primary calendar and settings
 * Called during new user setup (Phase 3)
 */
export async function createOrganization(params: {
  name: string;
  subscription_tier: string;
  created_by: string;
}): Promise<Organization | null> {
  if (!params.name || !params.created_by) {
    throw new Error("Organization name and created_by are required");
  }
  // Route through backend so admin-level writes happen server-side
  try {
    const resp = await fetch(`${API_BASE_URL}/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: params.name, subscription_tier: params.subscription_tier, created_by: params.created_by }),
    });
    if (!resp.ok) throw new Error(`Backend error: ${resp.status}`);
    const json = await resp.json();
    return json.organization as Organization;
  } catch (error) {
    console.error('[setup] Failed to create organization (client->backend):', error);
    throw error;
  }
}

/**
 * Get an organization by ID
 */
export async function getOrganization(orgId: string): Promise<Organization | null> {
  if (!orgId) {
    throw new Error("orgId is required");
  }

  try {
    const resp = await fetch(`${API_BASE_URL}/organizations/${encodeURIComponent(orgId)}`);
    if (!resp.ok) {
      if (resp.status === 404) return null;
      throw new Error(`Backend error: ${resp.status}`);
    }
    const json = await resp.json();
    return json.organization as Organization | null;
  } catch (error) {
    console.error(`Error fetching organization ${orgId} (client->backend):`, error);
    throw error;
  }
}

/**
 * Get a tenant/organization by user (the user's primary org)
 * This is typically called during login to fetch the user's org
 */
export async function getTenantByUser(userId: string): Promise<Organization | null> {
  if (!userId) {
    throw new Error("userId is required");
  }

  try {
    const resp = await fetch(`${API_BASE_URL}/organizations/by-user?userId=${encodeURIComponent(userId)}`);
    if (!resp.ok) {
      if (resp.status === 404) return null;
      throw new Error(`Backend error: ${resp.status}`);
    }
    const json = await resp.json();
    return json.organization as Organization | null;
  } catch (error) {
    console.error(`Error fetching tenant for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Update an organization
 */
export async function updateOrganization(
  orgId: string,
  updates: Partial<Organization>
): Promise<Organization | null> {
  if (!orgId) {
    throw new Error("orgId is required");
  }

  try {
    const resp = await fetch(`${API_BASE_URL}/organizations/${encodeURIComponent(orgId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!resp.ok) throw new Error(`Backend error: ${resp.status}`);
    const json = await resp.json();
    return json.organization as Organization | null;
  } catch (error) {
    console.error(`Error updating organization ${orgId} (client->backend):`, error);
    throw error;
  }
}
