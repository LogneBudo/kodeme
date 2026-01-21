import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { createOrganization } from "../api/firebaseApi/organizations";
import { toast } from "sonner";
import type { SubscriptionTierName } from "../types/subscriptionTier";
import styles from "./SetupPage.module.css";

const TIER_OPTIONS: { id: SubscriptionTierName; name: string; description: string }[] = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for getting started. 1 calendar, 1 user, community support",
  },
  {
    id: "starter",
    name: "Starter",
    description: "Growing business. 3 calendars, 10 users, email support",
  },
  {
    id: "professional",
    name: "Professional",
    description: "Established business. 10 calendars, 50 users, priority support",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Large organization. Unlimited calendars, users, dedicated support",
  },
];

export default function SetupPage() {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const [organizationName, setOrganizationName] = useState("");
  const [selectedTier, setSelectedTier] = useState<SubscriptionTierName>("free");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  if (!user) {
    // Redirect to login if not authenticated
    navigate("/admin/login", { replace: true });
    return null;
  }

  // If user has no org_id, offer join via invitation
  // (Assume user.org_id is available in context)
  // If org_id is null, show join option
  // You may need to adjust this logic based on your actual user object
  const showJoinOption = !user.org_id;

  async function handleCreateOrganization() {
    if (!user || !organizationName.trim()) {
      setError("Organization name is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const org = await createOrganization({
        name: organizationName,
        subscription_tier: selectedTier,
        created_by: user.uid,
      });

      if (org) {
        toast.success(`Organization "${organizationName}" created successfully!`);
        
        // Wait a moment for Firestore to propagate the changes
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Refresh auth context to pick up new org_id
        console.log("[setup] Calling refresh to load organization...");
        await refresh();
        console.log("[setup] Refresh completed, attempting navigate");
        
        // Give state a moment to update after refresh
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Redirect to admin dashboard
        navigate("/admin/appointments", { replace: true });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create organization";
      setError(message);
      toast.error(message);
      console.error("[setup] Organization creation failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.setupContainer}>
      <div className={styles.setupCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome to CodeMe</h1>
          <p className={styles.subtitle}>
            Let's get your booking calendar set up
          </p>
        </div>

        <div className={styles.content}>
          {/* Organization Name */}
          {showJoinOption && (
            <div style={{ marginBottom: 24, textAlign: 'center' }}>
              <p>Already have an organization? Join with an invitation code:</p>
              <button
                type="button"
                style={{ padding: '8px 16px', marginTop: 8 }}
                onClick={() => navigate('/admin/organization/join')}
              >
                Join Organization
              </button>
              <hr style={{ margin: '24px 0' }} />
              <p>Or create a new organization below:</p>
            </div>
          )}
          <div className={styles.formGroup}>
            <label htmlFor="orgName" className={styles.label}>
              Organization Name
            </label>
            <input
              id="orgName"
              type="text"
              placeholder="e.g., My Restaurant, John's Salon"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              className={styles.input}
              disabled={loading}
            />
            <p className={styles.hint}>
              This is the name of your business or organization
            </p>
          </div>

          {/* Subscription Tier Selection */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Select a Plan</label>
            <div className={styles.tierOptions}>
              {TIER_OPTIONS.map((tier) => (
                <div
                  key={tier.id}
                  className={`${styles.tierOption} ${
                    selectedTier === tier.id ? styles.tierOptionSelected : ""
                  }`}
                  onClick={() => setSelectedTier(tier.id)}
                >
                  <div className={styles.tierRadio}>
                    <input
                      type="radio"
                      id={`tier-${tier.id}`}
                      name="tier"
                      value={tier.id}
                      checked={selectedTier === tier.id}
                      onChange={() => setSelectedTier(tier.id)}
                      disabled={loading}
                    />
                  </div>
                  <div className={styles.tierInfo}>
                    <h3 className={styles.tierName}>{tier.name}</h3>
                    <p className={styles.tierDescription}>{tier.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className={styles.hint}>
              You can upgrade or downgrade your plan anytime
            </p>
          </div>

          {/* Error Message */}
          {error && <div className={styles.errorMessage}>{error}</div>}

          {/* Action Buttons */}
          <div className={styles.actions}>
            <button
              onClick={handleCreateOrganization}
              disabled={loading || !organizationName.trim()}
              className={styles.createButton}
            >
              {loading ? "Creating..." : "Create Organization"}
            </button>
          </div>

          {/* Info Section */}
          <div className={styles.infoSection}>
            <h4 className={styles.infoTitle}>What happens next?</h4>
            <ul className={styles.infoList}>
              <li>Your organization will be created with a primary calendar</li>
              <li>Default settings will be configured for your calendar</li>
              <li>You'll be set as the organization owner</li>
              <li>You can start managing bookings right away</li>
              <li>Invite team members from the Users page</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
