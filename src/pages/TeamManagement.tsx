import { useState, useMemo } from "react";
import { Users, Plus, Trash2, Shield, UserPlus } from "lucide-react";
import AdminPageHeader from "../components/admin/AdminPageHeader";
import AdminToolbar from "../components/admin/AdminToolbar";
import AdminTable, { type Column } from "../components/admin/AdminTable";
import { useFirestoreQuery } from "../hooks/useFirestoreQuery";
import { useAuth } from "../context/useAuth";
import { listTenantUsers, updateUserRole, removeUserFromTenant } from "../api/firebaseApi/users";
import { listTenantCalendars } from "../api/firebaseApi/calendars";
import type { User } from "../api/firebaseApi/users";
import { toast } from "sonner";
import tableStyles from "../components/admin/AdminTable.module.css";
import baseStyles from "./AdminBase.module.css";
import styles from "./TeamManagement.module.css";

export default function TeamManagement() {
  const { orgId } = useAuth();

  // Fetch users and calendars
  const { data: users = [], loading: usersLoading, refetch: refetchUsers } = useFirestoreQuery(
    async () => {
      if (!orgId) return [];
      return listTenantUsers(orgId);
    },
    [orgId]
  );

  const { data: calendars = [], loading: calendarsLoading } = useFirestoreQuery(
    async () => {
      if (!orgId) return [];
      return listTenantCalendars(orgId);
    },
    [orgId]
  );

  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "user">("user");
  const [inviteCalendar, setInviteCalendar] = useState<string>("");

  const filteredUsers = useMemo(() => {
    if (!users || !Array.isArray(users)) return [];
    return users.filter((user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  async function handleToggleRole(userId: string, currentRole: "admin" | "user") {
    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      const success = await updateUserRole(userId, newRole);
      if (success) {
        await refetchUsers();
        toast.success(`User role changed to ${newRole}`);
      } else {
        toast.error("Failed to update user role");
      }
    } catch (error) {
      toast.error("Error updating user role");
      console.error(error);
    }
    setActionLoading((prev) => ({ ...prev, [userId]: false }));
  }

  async function handleRemoveUser(userId: string) {
    if (!window.confirm("Remove this user from the organization?")) return;
    
    setActionLoading((prev) => ({ ...prev, [`remove-${userId}`]: true }));
    try {
      const success = await removeUserFromTenant(userId);
      if (success) {
        await refetchUsers();
        toast.success("User removed from organization");
      } else {
        toast.error("Failed to remove user");
      }
    } catch (error) {
      toast.error("Error removing user");
      console.error(error);
    }
    setActionLoading((prev) => ({ ...prev, [`remove-${userId}`]: false }));
  }

  async function handleSendInvite() {
    if (!inviteEmail.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!inviteCalendar) {
      toast.error("Please select a calendar");
      return;
    }

    // TODO: Implement invite functionality
    toast.info("Invite functionality coming in next update");
    setShowInviteForm(false);
    setInviteEmail("");
    setInviteCalendar("");
  }

  const columns: Column<User>[] = [
    {
      key: "email",
      label: "Email",
      render: (_, user) => (
        <div className={styles.emailCell}>
          <div className={styles.userIcon}>
            <Users size={16} />
          </div>
          <div>
            <strong>{user.email}</strong>
            <div className={styles.createdDate}>
              {new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (_, user) => (
        <div className={styles.roleCell}>
          <span className={`${styles.role} ${styles[user.role]}`}>
            <Shield size={14} />
            {user.role === "admin" ? "Admin" : "User"}
          </span>
        </div>
      ),
    },
  ];

  const loading = usersLoading || calendarsLoading;

  return (
    <div className={baseStyles.container}>
      <AdminPageHeader title="Team Management" icon={Users} subtitle="Manage organization members" />

      {/* Toolbar with search and invite button */}
      <AdminToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search team members by email..."
      />

      {/* Invite Form */}
      {showInviteForm && (
        <div className={styles.inviteCard}>
          <h3>Invite Team Member</h3>
          <div className={styles.formGroup}>
            <label>Email Address *</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="user@example.com"
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Assign to Calendar *</label>
            <select
              value={inviteCalendar}
              onChange={(e) => setInviteCalendar(e.target.value)}
              disabled={loading || !calendars || calendars.length === 0}
            >
              <option value="">-- Select a calendar --</option>
              {calendars && calendars.map((cal) => (
                <option key={cal.id} value={cal.id}>
                  {cal.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Role *</label>
            <div className={styles.roleOptions}>
              <label className={styles.roleOption}>
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={inviteRole === "user"}
                  onChange={(e) => setInviteRole(e.target.value as "user" | "admin")}
                  disabled={loading}
                />
                <span>User</span>
                <span className={styles.roleDesc}>Can manage slots and appointments</span>
              </label>
              <label className={styles.roleOption}>
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={inviteRole === "admin"}
                  onChange={(e) => setInviteRole(e.target.value as "user" | "admin")}
                  disabled={loading}
                />
                <span>Admin</span>
                <span className={styles.roleDesc}>Full access including settings</span>
              </label>
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              className={styles.submitBtn}
              onClick={handleSendInvite}
              disabled={loading}
            >
              <UserPlus size={16} />
              Send Invite
            </button>
            <button
              className={styles.cancelBtn}
              onClick={() => {
                setShowInviteForm(false);
                setInviteEmail("");
                setInviteCalendar("");
              }}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Create Invite Button */}
      {!showInviteForm && (
        <div className={styles.inviteButtonContainer}>
          <button
            className={styles.inviteButton}
            onClick={() => setShowInviteForm(true)}
            disabled={!calendars || calendars.length === 0}
          >
            <Plus size={16} />
            Invite Team Member
          </button>
          {(!calendars || calendars.length === 0) && (
            <p className={styles.warning}>Create a calendar first before inviting team members</p>
          )}
        </div>
      )}

      {/* Users Table */}
      <AdminTable
        columns={columns}
        data={filteredUsers}
        loading={loading}
        emptyMessage="No team members yet. Invite someone to get started!"
        renderActions={(user) => (
          <div className={tableStyles.actions}>
            <button
              className={tableStyles.actionBtn}
              onClick={() => handleToggleRole(user.id, user.role)}
              disabled={actionLoading[user.id]}
              title={`Change to ${user.role === "admin" ? "user" : "admin"}`}
            >
              {actionLoading[user.id] ? "..." : <Shield size={14} />}
            </button>
            <button
              className={tableStyles.deleteBtn}
              onClick={() => handleRemoveUser(user.id)}
              disabled={actionLoading[`remove-${user.id}`]}
              title="Remove from organization"
            >
              {actionLoading[`remove-${user.id}`] ? "..." : <Trash2 size={14} />}
            </button>
          </div>
        )}
      />
    </div>
  );
}
