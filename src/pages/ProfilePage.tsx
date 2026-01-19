import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { user, organization } = useAuth();

  const plan = organization?.subscription_tier || "free";
  const orgName = organization?.name || "Your organization";
  const email = user?.email || "";
  const role = user?.role || "user";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <section style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 8, background: "white" }}>
        <h2 style={{ margin: "0 0 12px 0" }}>Account</h2>
        <div style={{ display: "grid", gap: 8 }}>
          <div><strong>Email:</strong> {email}</div>
          <div><strong>Role:</strong> {role}</div>
          <div><strong>Organization:</strong> {orgName}</div>
          <div><strong>Plan:</strong> {plan}</div>
        </div>
      </section>

      <section style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 8, background: "white" }}>
        <h2 style={{ margin: "0 0 12px 0" }}>Billing</h2>
        <p style={{ margin: 0, color: "#475569" }}>
          Billing history and invoices will appear here. (Placeholder)
        </p>
      </section>

      <section style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 8, background: "white" }}>
        <h2 style={{ margin: "0 0 12px 0" }}>Plan Actions</h2>
        <p style={{ margin: 0, color: "#475569" }}>
          Upgrade/downgrade controls to be added. (Placeholder)
        </p>
      </section>
    </div>
  );
}
