import { useState, useEffect } from "react";
import { listUsers, updateUserRole, deleteUser, type User } from "../api/firebaseApi";
import { Users, Trash2, Shield, User as UserIcon, AlertCircle } from "lucide-react";
import AdminPageHeader from "../components/admin/AdminPageHeader";
import AdminTable, { type Column } from "../components/admin/AdminTable";
import tableStyles from "../components/admin/AdminTable.module.css";
import baseStyles from "./AdminBase.module.css";
import styles from "./UserManagement.module.css";

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const data = await listUsers();
    setUsers(data);
    setLoading(false);
  }

  async function handleToggleRole(userId: string, currentRole: "admin" | "user") {
    const newRole = currentRole === "admin" ? "user" : "admin";
    const success = await updateUserRole(userId, newRole);
    if (success) {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm("Are you sure you want to delete this user's role record?")) return;
    
    const success = await deleteUser(userId);
    if (success) {
      setUsers(users.filter(u => u.id !== userId));
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
      render: (value, user) => (
        <div className={`${styles.roleBadge} ${user.role === "admin" ? styles.roleBadgeAdmin : styles.roleBadgeUser}`}>
          {user.role === "admin" ? <Shield size={14} /> : <UserIcon size={14} />}
          {user.role}
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (value) => value.toLocaleDateString(),
    },
  ];

  // Render action buttons for each row
  function renderActions(user: User) {
    return (
      <div className={styles.actionContainer}>
        <button
          onClick={() => handleToggleRole(user.id, user.role)}
          className={tableStyles.actionButton}
        >
          Make {user.role === "admin" ? "User" : "Admin"}
        </button>
        <button
          onClick={() => handleDeleteUser(user.id)}
          className={`${tableStyles.actionButton} ${tableStyles.actionButtonDanger}`}
        >
          <Trash2 size={14} />
          Delete
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
        data={users}
        loading={loading}
        emptyMessage="No users found. Users will appear here once they log in for the first time."
        renderActions={renderActions}
      />
      </div>
    </div>
  );
}
