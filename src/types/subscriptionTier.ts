/**
 * Subscription Tier Types
 * MULTI-TENANCY: Defines limits and features per tier
 * Tiers determine: max branches, max users, features available
 */

export type SubscriptionTierName = "free" | "starter" | "professional" | "enterprise" | (string & {});

export type SubscriptionTierLimits = {
  max_branches: number; // 1, 3, 10, 999999
  max_users: number; // 1, 10, 50, 999999
  max_admins: number; // 1, 3, 999999, 999999
};

export type SubscriptionTierFeatures = {
  // Calendar integration
  calendar_integration: boolean;
  calendar_write_events: boolean; // FREE can only read events
  calendar_max_calendars: number; // 1 for FREE, unlimited for others
  calendar_sync_interval_hours: number; // 24 for FREE, 4 for STARTER, 1 for PROFESSIONAL, 0 for ENTERPRISE (real-time)

  // API
  api_access: boolean;
  api_rate_limit_per_day: number; // 0 = no API access

  // Customization
  white_label: boolean;

  // Support
  support_level: "community" | "email" | "priority" | "dedicated";
};

export type SubscriptionTier = {
  id: string; // "free", "starter", "professional", "enterprise"
  name: SubscriptionTierName;
  display_name: string; // "Starter Plan", "Professional Plan", etc.

  // Pricing
  price_cents: number; // 0 for free, 2999 = $29.99/month, etc.
  billing_interval: "month" | "year" | "lifetime";

  // Hard limits (enforced at API layer)
  limits: SubscriptionTierLimits;

  // Feature flags (checked by API before allowing feature use)
  features: SubscriptionTierFeatures;

  created_at?: Date;
  updated_at?: Date;
};

/**
 * Tier Definitions (for reference in code)
 * These will be stored in Firestore and loaded at runtime
 */
export const TIER_DEFINITIONS: Record<SubscriptionTierName, SubscriptionTier> = {
  free: {
    id: "free",
    name: "free",
    display_name: "Free",
    price_cents: 0,
    billing_interval: "lifetime",
    limits: {
      max_branches: 1,
      max_users: 1,
      max_admins: 1,
    },
    features: {
      calendar_integration: true,
      calendar_write_events: false, // FREE: read-only
      calendar_max_calendars: 1,
      calendar_sync_interval_hours: 24,
      api_access: false,
      api_rate_limit_per_day: 0,
      white_label: false,
      support_level: "community",
    },
  },
  starter: {
    id: "starter",
    name: "starter",
    display_name: "Starter",
    price_cents: 2999, // $29.99/month
    billing_interval: "month",
    limits: {
      max_branches: 3,
      max_users: 10,
      max_admins: 3,
    },
    features: {
      calendar_integration: true,
      calendar_write_events: true,
      calendar_max_calendars: 1,
      calendar_sync_interval_hours: 4,
      api_access: false,
      api_rate_limit_per_day: 0,
      white_label: false,
      support_level: "email",
    },
  },
  professional: {
    id: "professional",
    name: "professional",
    display_name: "Professional",
    price_cents: 7999, // $79.99/month
    billing_interval: "month",
    limits: {
      max_branches: 10,
      max_users: 50,
      max_admins: 999999,
    },
    features: {
      calendar_integration: true,
      calendar_write_events: true,
      calendar_max_calendars: 999999,
      calendar_sync_interval_hours: 1,
      api_access: true,
      api_rate_limit_per_day: 1000,
      white_label: false,
      support_level: "priority",
    },
  },
  enterprise: {
    id: "enterprise",
    name: "enterprise",
    display_name: "Enterprise",
    price_cents: 0, // Custom pricing
    billing_interval: "month",
    limits: {
      max_branches: 999999,
      max_users: 999999,
      max_admins: 999999,
    },
    features: {
      calendar_integration: true,
      calendar_write_events: true,
      calendar_max_calendars: 999999,
      calendar_sync_interval_hours: 0, // Real-time
      api_access: true,
      api_rate_limit_per_day: 999999,
      white_label: true,
      support_level: "dedicated",
    },
  },
};
