import { useState, useMemo } from "react";
import { Calendar as CalendarIcon, Plus, Trash2, Clock } from "lucide-react";
import AdminPageHeader from "../components/admin/AdminPageHeader";
import AdminToolbar from "../components/admin/AdminToolbar";
import AdminTable, { type Column } from "../components/admin/AdminTable";
import { useFirestoreQuery } from "../hooks/useFirestoreQuery";
import { useAuth } from "../context/AuthContext";
import { listTenantCalendars, deleteTenantCalendar, createTenantCalendar } from "../api/firebaseApi";
import { toast } from "sonner";
import tableStyles from "../components/admin/AdminTable.module.css";
import baseStyles from "./AdminBase.module.css";
import styles from "./CalendarManagement.module.css";
import type { Calendar } from "../types/branch";
import { TIER_DEFINITIONS } from "../types/subscriptionTier";

export default function CalendarManagement() {
  const { orgId, user, organization } = useAuth();
  const { data: calendars = [], loading, refetch } = useFirestoreQuery(
    async () => {
      if (!orgId) return [];
      return listTenantCalendars(orgId);
    },
    [orgId]
  );

  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    timezone: "America/New_York",
  });

  const filteredCalendars = useMemo(() => {
    if (!calendars || !Array.isArray(calendars)) return [];
    return calendars.filter((cal) =>
      cal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cal.address?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    );
  }, [calendars, searchQuery]);

  async function handleSeedPrimary() {
    if (!orgId || !user) return;
    setActionLoading((prev) => ({ ...prev, seed: true }));
    try {
      await createTenantCalendar(orgId, user.uid, {
        name: "Primary Calendar",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      });
      await refetch();
      toast.success("Primary calendar created");
    } catch (err) {
      console.error("Seed calendar failed", err);
      toast.error("Failed to create primary calendar");
    } finally {
      setActionLoading((prev) => ({ ...prev, seed: false }));
    }
  }

  async function handleDelete(id: string) {
    if (!orgId) return;
    if (!window.confirm("Delete this calendar? This action cannot be undone.")) return;

    setActionLoading((prev) => ({ ...prev, [`delete-${id}`]: true }));
    try {
      const success = await deleteTenantCalendar(orgId, id);
      if (success) {
        toast.success("Calendar deleted");
        await refetch();
      } else {
        toast.error("Failed to delete calendar");
      }
    } catch (error) {
      toast.error("Error deleting calendar");
      console.error(error);
    }
    setActionLoading((prev) => ({ ...prev, [`delete-${id}`]: false }));
  }

  async function handleCreateOrUpdate() {
    if (!orgId || !user) return;
    const name = formData.name.trim();
    if (!name) {
      toast.error("Calendar name is required");
      return;
    }

    // Enforce plan limits: max calendars per organization
    const tier = organization?.subscription_tier ?? "free";
    const maxCalendars = TIER_DEFINITIONS[tier].features.calendar_max_calendars;
    const currentCount = Array.isArray(calendars) ? calendars.length : 0;
    if (!editingId && currentCount >= maxCalendars) {
      toast.error(`Your plan allows up to ${maxCalendars} calendar${maxCalendars > 1 ? 's' : ''}.`);
      return;
    }

    setActionLoading((prev) => ({ ...prev, submit: true }));
    try {
      if (!editingId) {
        await createTenantCalendar(orgId, user.uid, {
          name,
          address: formData.address || undefined,
          timezone: formData.timezone,
        });
        toast.success("Calendar created");
      } else {
        // Future: implement update flow
        toast.info("Edit calendar not implemented yet");
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: "", address: "", timezone: "America/New_York" });
      await refetch();
    } catch (err) {
      console.error("Calendar save error:", err);
      toast.error("Failed to save calendar");
    } finally {
      setActionLoading((prev) => ({ ...prev, submit: false }));
    }
  }

  const columns: Column<Calendar>[] = [
    {
      key: "name",
      label: "Calendar Name",
      render: (_, calendar) => (
        <div className={styles.nameCell}>
          <CalendarIcon size={16} />
          <div>
            <strong>{calendar.name}</strong>
            {calendar.address && <div className={styles.address}>{calendar.address}</div>}
          </div>
        </div>
      ),
    },
    {
      key: "timezone",
      label: "Timezone",
      render: (_, calendar) => (
        <div className={styles.timezoneCell}>
          <Clock size={14} />
          {calendar.timezone}
        </div>
      ),
    },
    {
      key: "created_at",
      label: "Created",
      render: (_, calendar) => new Date(calendar.created_at).toLocaleDateString(),
    },
  ];

  return (
    <div className={baseStyles.container}>
      <AdminPageHeader
        title="Calendar Management"
        subtitle="Create and manage multiple booking calendars for your organization"
        icon={CalendarIcon}
      />

      {/* Toolbar with search */}
      <AdminToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search calendars by name or address..."
      />

      {/* Create Button */}
      <div className={styles.toolbarRight}>
        <button
          className={styles.createBtn}
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({ name: "", address: "", timezone: "America/New_York" });
          }}
        >
          <Plus size={16} /> Create Calendar
        </button>
        {(!calendars || calendars.length === 0) && (
          <button
            className={styles.createBtn}
            onClick={handleSeedPrimary}
            disabled={!!actionLoading["seed"]}
            style={{ background: "#0f172a" }}
          >
            {actionLoading["seed"] ? "Seeding..." : "Seed Primary"}
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className={styles.formCard}>
          <h3>{editingId ? "Edit Calendar" : "Create New Calendar"}</h3>
          <div className={styles.formGroup}>
            <label>Calendar Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., NYC Office, Boston Location"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Address (Optional)</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g., 123 Main St, New York, NY"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Timezone *</label>
            <select
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            >
              <option value="America/New_York">Eastern (America/New_York)</option>
              <option value="America/Chicago">Central (America/Chicago)</option>
              <option value="America/Denver">Mountain (America/Denver)</option>
              <option value="America/Los_Angeles">Pacific (America/Los_Angeles)</option>
              <option value="UTC">UTC</option>
              <option value="Europe/London">London (Europe/London)</option>
              <option value="Europe/Paris">Paris (Europe/Paris)</option>
              <option value="Asia/Tokyo">Tokyo (Asia/Tokyo)</option>
            </select>
          </div>

          <div className={styles.formActions}>
            <button
              className={styles.submitBtn}
              onClick={handleCreateOrUpdate}
              disabled={!!actionLoading["submit"]}
            >
              {actionLoading["submit"] ? "Saving..." : (editingId ? "Update Calendar" : "Create Calendar")}
            </button>
            <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Calendars Table */}
      <AdminTable
        columns={columns}
        data={filteredCalendars}
        loading={loading}
        emptyMessage="No calendars found. Create one to get started!"
        renderActions={(calendar) => (
          <div className={tableStyles.actions}>
            <button
              className={tableStyles.deleteBtn}
              onClick={() => handleDelete(calendar.id)}
              disabled={actionLoading[`delete-${calendar.id}`]}
              title="Delete calendar"
            >
              {actionLoading[`delete-${calendar.id}`] ? "..." : <Trash2 size={14} />}
            </button>
          </div>
        )}
      />
    </div>
  );
}
