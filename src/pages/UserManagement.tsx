import { useState, useEffect } from "react";
import { listUsers, updateUserRole, deleteUser, type User } from "../api/firebaseApi";
import { Users, Trash2, Shield, User as UserIcon, AlertCircle } from "lucide-react";
import AdminPageHeader from "../components/admin/AdminPageHeader";
import AdminTable, { type Column } from "../components/admin/AdminTable";
import tableStyles from "../components/admin/AdminTable.module.css";
import styles from "./AdminBase.module.css";

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
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 10px",
            borderRadius: "4px",
            fontSize: "13px",
            background: user.role === "admin" ? "#fef3c7" : "#e5e7eb",
            color: user.role === "admin" ? "#92400e" : "#374151",
          }}
        >
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
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
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
    <div className={styles.page}>
      <div className={styles.content}>
        <AdminPageHeader 
          icon={Users}
          title="User Management"
          subtitle="Manage user roles and permissions"
        />

      <div style={{
        padding: "16px",
        background: "#fef3c7",
        border: "1px solid #fbbf24",
        borderRadius: "8px",
        marginBottom: "24px",
        display: "flex",
        gap: "12px",
        alignItems: "start",
      }}>
        <AlertCircle size={20} color="#92400e" style={{ flexShrink: 0, marginTop: "2px" }} />
        <div style={{ fontSize: "14px", color: "#92400e" }}>
          <strong>Note:</strong> Users must be created in Firebase Authentication first. 
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
