
import { useState } from "react";
import { useAuth } from "../context/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import styles from "./UserProfile.module.css";

type AdminNavItem = {
  name: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
};

type UserProfileProps = {
  adminNavItems?: AdminNavItem[];
  currentPageName?: string;
};

export default function UserProfile({ adminNavItems = [], currentPageName }: UserProfileProps) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    navigate("/BookAppointment", { replace: true });
  };

  const getUserInitials = () => {
    const email = user.email || "";
    const parts = email.split("@");
    if (parts[0]) {
      return parts[0].charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <div className={styles.profileContainer}>
      <button
        className={styles.profileButton}
        onClick={() => setDropdownOpen(!dropdownOpen)}
        title={user.email}
      >
        <div className={styles.profileIcon}>{getUserInitials()}</div>
        <span className={styles.profileEmail}>{user.email}</span>
      </button>

      {dropdownOpen && (
        <div className={styles.profileDropdown}>
          <div className={styles.profileInfo}>
            <div className={styles.infoIcon}>{getUserInitials()}</div>
            <div className={styles.infoDetails}>
              <p className={styles.infoEmail}>{user.email}</p>
              <p className={styles.infoRole}>{user.role === "admin" ? "👑 Admin" : "👤 User"}</p>
            </div>
          </div>
          {/* Admin menu items */}
          {adminNavItems.length > 0 && (
            <div className={styles.adminMenuSection}>
              {adminNavItems.map(item => {
                const Icon = item.icon;
                const isActive = currentPageName === item.name;
                return (
                  <Link
                    key={item.name}
                    to={`/${item.name}`}
                    className={`${styles.linkButton} ${isActive ? styles.active : ""}`}
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
              <hr className={styles.menuDivider} />
            </div>
          )}
          <button
            onClick={() => { navigate("/admin/profile"); setDropdownOpen(false); }}
            className={styles.linkButton}
          >
            <User size={16} />
            My Account
          </button>
          <button
            onClick={handleLogout}
            className={styles.logoutButton}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
