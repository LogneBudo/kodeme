import { useState, useMemo } from "react";
import { listTenantUsers, updateUserRole, deleteUser, type User } from "../api/firebaseApi";
import { useAuth } from "../context/AuthContext";
import { Users, Trash2, Shield, User as UserIcon, AlertCircle } from "lucide-react";
import AdminPageHeader from "../components/admin/AdminPageHeader";
import AdminToolbar from "../components/admin/AdminToolbar";
import AdminTable, { type Column } from "../components/admin/AdminTable";
import { useFirestoreQuery } from "../hooks/useFirestoreQuery";
import tableStyles from "../components/admin/AdminTable.module.css";
import baseStyles from "./AdminBase.module.css";
import styles from "./UserManagement.module.css";

export default function UserManagement() {
  const { orgId } = useAuth();
  const { data: users = [], loading, refetch } = useFirestoreQuery(
    async () => {
      if (!orgId) return [];
      return listTenantUsers(orgId);
    },
    [orgId]
  );
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  async function handleToggleRole(userId: string, currentRole: "admin" | "user") {
    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    const newRole = currentRole === "admin" ? "user" : "admin";
    const success = await updateUserRole(userId, newRole);
    if (success) {
      await refetch();
    }
    setActionLoading((prev) => ({ ...prev, [userId]: false }));
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm("Are you sure you want to delete this user's role record?")) return;
    
    setActionLoading((prev) => ({ ...prev, [`delete-${userId}`]: true }));
    const success = await deleteUser(userId);
    if (success) {
      await refetch();
    }
    setActionLoading((prev) => ({ ...prev, [`delete-${userId}`]: false }));
  }

  // Filter and search users
  const filteredUsers = useMemo(() => {
    if (!users || !Array.isArray(users)) return [];
    return users.filter((user) => {
      // Role filter
      if (roleFilter !== "all" && user.role !== roleFilter) {
        return false;
      }
      
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return user.email.toLowerCase().includes(query);
      }
      
      return true;
    });
  }, [users, roleFilter, searchQuery]);

  // Role counts for filter options
  const roleCounts = useMemo(() => {
    const counts = { admin: 0, user: 0 };
    if (!users || !Array.isArray(users)) return counts;
    users.forEach((user) => {
      if (user.role in counts) {
        counts[user.role as keyof typeof counts]++;
      }
    });
    return counts;
  }, [users]);

  // Bulk delete handler
  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected user${selectedIds.size > 1 ? 's' : ''}?`)) return;
    
    const deletePromises = Array.from(selectedIds).map(id => deleteUser(id));
    const results = await Promise.all(deletePromises);
    
    const successCount = results.filter(Boolean).length;
    if (successCount > 0) {
      await refetch();
      setSelectedIds(new Set());
    }
  }

  // Column definitions for AdminTable
  const columns: Column<User>[] = [
    {
      key: "email",
      label: "Email",
    },
    {
      key: "role",
      label: "Role",
      render: (value, user) => {
        void value; // mark parameter as used to satisfy noUnusedParameters
        return (
        <div className={`${styles.roleBadge} ${user.role === "admin" ? styles.roleBadgeAdmin : styles.roleBadgeUser}`}>
          {user.role === "admin" ? <Shield size={14} /> : <UserIcon size={14} />}
          {user.role}
        </div>
        );
      },
    },
    {
      key: "createdAt",
      label: "Created",
      render: (value) => {
        if (value instanceof Date) return value.toLocaleDateString();
        const d = new Date(value as unknown as string);
        return isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
      },
    },
  ];

  // Render action buttons for each row
  function renderActions(user: User) {
    const isToggleLoading = actionLoading[user.id];
    const isDeleteLoading = actionLoading[`delete-${user.id}`];
    const isAnyLoading = isToggleLoading || isDeleteLoading;

    return (
      <div className={styles.actionContainer}>
        <button
          onClick={() => handleToggleRole(user.id, user.role)}
          className={tableStyles.actionButton}
          disabled={isAnyLoading}
        >
          {isToggleLoading ? "Updating..." : `Make ${user.role === "admin" ? "User" : "Admin"}`}
        </button>
        <button
          onClick={() => handleDeleteUser(user.id)}
          className={`${tableStyles.actionButton} ${tableStyles.actionButtonDanger}`}
          disabled={isAnyLoading}
        >
          <Trash2 size={14} />
          {isDeleteLoading ? "Deleting..." : "Delete"}
        </button>
      </div>
    );
  }

  return (
    <div className={baseStyles.page}>
      <div className={baseStyles.content}>
        <AdminPageHeader 
          icon={Users}
          title="User Management"
          subtitle="Manage user roles and permissions"
        />

        <AdminToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search by email..."
          filterValue={roleFilter}
          onFilterChange={setRoleFilter}
          filterLabel="Role"
          filterOptions={[
            { value: "admin", label: "Admin", count: roleCounts.admin },
            { value: "user", label: "User", count: roleCounts.user },
          ]}
          selectedCount={selectedIds.size}
          onBulkDelete={handleBulkDelete}
          onRefresh={refetch}
          showBulkActions={true}
        />

      <div className={styles.infoBox}>
        <AlertCircle size={20} color="#92400e" className={styles.infoIcon} />
        <div className={styles.infoText}>
          <strong>Note:</strong>
          Users must be created in Firebase Authentication first. 
          After creating a user in Firebase Auth, they will appear here automatically when they first log in. 
          You can then manage their roles.
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={filteredUsers}
        loading={loading}
        emptyMessage="No users found. Users will appear here once they log in for the first time."
        renderActions={renderActions}
      />
      </div>
    </div>
  );
}
