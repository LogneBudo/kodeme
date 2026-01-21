import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { getOrganization } from "../api/firebaseApi/organizations";
import { listTenantCalendars, getCalendarUnsafe } from "../api/firebaseApi/calendars";
import type { Organization } from "../types/organization";
import type { Calendar } from "../types/branch";
import AdminPageHeader from "../components/admin/AdminPageHeader";
import { Info } from "lucide-react";
import AdminPage from "../components/admin/AdminPage";
import { toast } from "sonner";

export default function AdminDebug() {
  const { user, orgId, calendarId, loading } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [attemptedIds, setAttemptedIds] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      if (!orgId) return;
      try {
        setBusy(true);
        const nextErrors: string[] = [];
        const tried: string[] = [];
        const o = await getOrganization(orgId);
        setOrg(o);
        const cals = await listTenantCalendars(orgId);
        let finalCals = cals;

        // Fallback: if no calendars returned but user has branch assignments, fetch by IDs directly
        if (finalCals.length === 0 && user?.branch_assignments) {
          const ids = Object.keys(user.branch_assignments);
          tried.push(...ids);
          const fetched = await Promise.all(ids.map((id) => getCalendarUnsafe(id)));
          finalCals = fetched.filter(Boolean) as Calendar[];
        }

        // Additional fallback: try `${orgId}-primary` directly
        if (finalCals.length === 0) {
          const primaryId = `${orgId}-primary`;
          tried.push(primaryId);
          const primaryCal = await getCalendarUnsafe(primaryId);
          if (primaryCal) {
            finalCals = [primaryCal];
          }
        }

        if (finalCals.length === 0) {
          nextErrors.push("No calendars found via branch_assignments fallback");
        }

        setCalendars(finalCals);
        setErrors(nextErrors);
        setAttemptedIds(tried);
      } catch (err) {
        console.error("debug load failed", err);
        toast.error("Failed to load org/calendars");
      } finally {
        setBusy(false);
      }
    })();
  }, [orgId, user?.branch_assignments]);

  return (
    <AdminPage title="Debug" pageName="AdminDebug">
      <AdminPageHeader title="Debug" subtitle="Auth, Org, Calendars" icon={Info} />
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <Card title="Auth User">
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify({ user, orgId, calendarId, loading }, null, 2)}</pre>
        </Card>
        <Card title="Organization">
          {org ? (
            <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(org, null, 2)}</pre>
          ) : (
            <div>No org loaded</div>
          )}
        </Card>
        <Card title="Calendars">
          {busy ? (
            <div>Loading...</div>
          ) : calendars.length === 0 ? (
            <div>No calendars</div>
          ) : (
            <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(calendars, null, 2)}</pre>
          )}
          {errors.length > 0 && (
            <div style={{ marginTop: 8, color: "#b91c1c" }}>
              {errors.map((e, idx) => (
                <div key={idx}>{e}</div>
              ))}
            </div>
          )}
          {attemptedIds.length > 0 && (
            <div style={{ marginTop: 8, color: "#334155" }}>
              <div style={{ fontWeight: 600 }}>Tried IDs:</div>
              <div>{attemptedIds.join(", ")}</div>
            </div>
          )}
        </Card>
      </div>
    </AdminPage>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, background: "white" }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </div>
  );
}
