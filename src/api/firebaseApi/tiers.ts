import { getOrganization } from "./organizations";

// ============ TIER LIMIT CHECKING (SKELETON) ============

/**
 * Check if organization can add more users (based on tier)
 * This is a skeleton; full logic implemented in Phase 3/4 with auth context
 */
export async function canAddUserToTenant(orgId: string): Promise<boolean> {
  try {
    const org = await getOrganization(orgId);
    if (!org) throw new Error(`Organization ${orgId} not found`);

    // TODO: Implement tier-based user limit checking
    // For now, allow unlimited users
    return true;
  } catch (error) {
    console.error(`Error checking user limit for org ${orgId}:`, error);
    throw error;
  }
}

/**
 * Check if organization can add more branches (based on tier)
 * This is a skeleton; full logic implemented in Phase 3/4
 */
export async function canAddBranchToTenant(orgId: string): Promise<boolean> {
  try {
    const org = await getOrganization(orgId);
    if (!org) throw new Error(`Organization ${orgId} not found`);

    // TODO: Implement tier-based branch limit checking
    // For now, allow unlimited branches
    return true;
  } catch (error) {
    console.error(`Error checking branch limit for org ${orgId}:`, error);
    throw error;
  }
}

/**
 * Check if organization has access to a feature (based on tier)
 * This is a skeleton; full logic implemented in Phase 3/4
 */
export async function hasTierFeature(
  orgId: string,
  feature: string
): Promise<boolean> {
  try {
    const org = await getOrganization(orgId);
    if (!org) throw new Error(`Organization ${orgId} not found`);

    // TODO: Implement feature-flag checking based on subscription_tier
    // For now, allow all features
    return true;
  } catch (error) {
    console.error(
      `Error checking feature access for org ${orgId}, feature ${feature}:`,
      error
    );
    throw error;
  }
}
