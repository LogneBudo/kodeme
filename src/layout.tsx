import { Link } from "react-router-dom";
import { Calendar, Settings, Users, LogOut, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { getCurrentUser, logout } from "../src/api/authApi";
type LayoutProps = {
  children: React.ReactNode;
  currentPageName: string;
};

type User = {
  role: string;
} | null;

export default function Layout({ children, currentPageName }: LayoutProps) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
 useEffect(() => {
  const initializeAuth = async () => {
    try {
      console.log("LAYOUT: Fetching current user...");
      const currentUser = await getCurrentUser();
      console.log("LAYOUT: Got user:", currentUser);
      setUser(currentUser);
    } catch (error) {
      console.error("LAYOUT: Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };
  
  initializeAuth();
}, []);

  async function handleLogout() {
    await logout();
    setUser(null);
    window.location.href = "/BookAppointment";
  }

  const navItems = [
    { name: "BookAppointment", label: "Book Appointment", icon: Calendar, public: true },
    { name: "admin/appointments", label: "Appointments", icon: Calendar, adminOnly: true },
    { name: "admin/slots", label: "Slots", icon: Settings, adminOnly: true },
    { name: "admin/users", label: "Users", icon: Users, adminOnly: true },
    { name: "admin/settings", label: "Settings", icon: Settings, adminOnly: true },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", width: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          background: "white",
          borderBottom: "1px solid #ddd",
          padding: "0 16px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 100,
        }}
      >
        <Link to="/BookAppointment" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              background: "#222",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Calendar size={16} color="white" />
          </div>
          <span style={{ fontWeight: 600, color: "#222", fontSize: "14px", display: "none" }} className="hide-on-mobile">Appointments</span>
        </Link>

        {/* Desktop Navigation */}
        <div style={{ display: "none", gap: "10px" }} className="desktop-nav">
          {!loading && user && navItems.map((item) => {
            if (item.adminOnly && user?.role !== "admin") return null;

            const Icon = item.icon;
            const isActive = currentPageName === item.name;

            return (
              <Link
                key={item.name}
                to={`/${item.name}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  textDecoration: "none",
                  background: isActive ? "#222" : "transparent",
                  color: isActive ? "white" : "#444",
                  border: isActive ? "1px solid #222" : "1px solid transparent",
                  whiteSpace: "nowrap",
                }}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}

          {!loading && user && (
            <button
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "14px",
                background: "transparent",
                border: "1px solid #ddd",
                cursor: "pointer",
              }}
            >
              <LogOut size={16} />
              Logout
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          className="mobile-menu-btn"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div style={{
          position: "fixed",
          top: "60px",
          left: 0,
          right: 0,
          background: "white",
          borderBottom: "1px solid #ddd",
          zIndex: 99,
          display: "flex",
          flexDirection: "column",
          gap: "0",
        }}>
          {!loading && user && navItems.map((item) => {
            if (item.adminOnly && user?.role !== "admin") return null;

            const Icon = item.icon;
            const isActive = currentPageName === item.name;

            return (
              <Link
                key={item.name}
                to={`/${item.name}`}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  borderRadius: "0",
                  fontSize: "14px",
                  textDecoration: "none",
                  background: isActive ? "#f0f0f0" : "white",
                  color: isActive ? "#222" : "#444",
                  border: "none",
                  borderBottom: "1px solid #eee",
                }}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}

          {!loading && user && (
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "0",
                fontSize: "14px",
                background: "white",
                border: "none",
                borderBottom: "1px solid #eee",
                cursor: "pointer",
                color: "#444",
                textAlign: "left",
              }}
            >
              <LogOut size={18} />
              Logout
            </button>
          )}
        </div>
      )}

      <main style={{ paddingTop: "60px", width: "100%", boxSizing: "border-box", flex: 1 }}>{children}</main>

      <style>{`
        @media (min-width: 768px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-menu-btn {
            display: none !important;
          }
          .hide-on-mobile {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
