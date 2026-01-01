import { useState, useEffect } from "react";
import { listUsers, updateUserRole, deleteUser, type User } from "../api/firebaseApi";
import { Users, Trash2, Shield, User as UserIcon, AlertCircle } from "lucide-react";
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

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <div className={styles.titleRow}>
              <div className={styles.titleIcon}>
                <Users size={20} color="white" />
              </div>
              <h1 className={styles.title}>User Management</h1>
            </div>
            <p className={styles.subtitle}>
              Manage user roles and permissions
            </p>
          </div>
        </div>

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

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          Loading users...
        </div>
      ) : users.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          No users found. Users will appear here once they log in for the first time.
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: "8px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f5f5f5", borderBottom: "1px solid #ddd" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "14px", fontWeight: 600 }}>Email</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "14px", fontWeight: 600 }}>Role</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "14px", fontWeight: 600 }}>Created</th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "14px", fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "12px 16px", fontSize: "14px" }}>{user.email}</td>
                  <td style={{ padding: "12px 16px" }}>
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
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "14px", color: "#666" }}>
                    {user.createdAt.toLocaleDateString()}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => handleToggleRole(user.id, user.role)}
                        style={{
                          padding: "6px 12px",
                          fontSize: "13px",
                          background: "white",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Make {user.role === "admin" ? "User" : "Admin"}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "6px 12px",
                          fontSize: "13px",
                          background: "white",
                          border: "1px solid #dc2626",
                          borderRadius: "4px",
                          cursor: "pointer",
                          color: "#dc2626",
                        }}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  );
}
