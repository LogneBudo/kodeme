import { Link } from "react-router-dom";
import { Calendar, Settings, Users, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { getCurrentUser } from "../src/api/authApi";
type LayoutProps = {
  children: React.ReactNode;
  currentPageName: string;
};

type User = {
  role: string;
} | null;

export default function Layout({ children, currentPageName }: LayoutProps) {
  const [user, setUser] = useState<User>(null);
  
 useEffect(() => {
  console.log("LAYOUT EFFECT RUNNING");
  (async () => {
    const currentUser = await getCurrentUser();
    console.log("AUTH RESULT:", currentUser);
    setUser(currentUser);
  })();
}, []);

  const navItems = [
    { name: "BookAppointment", label: "Book Appointment", icon: Calendar, public: true },
    { name: "AdminSlots", label: "Slots", icon: Settings, adminOnly: true },
    { name: "UserManagement", label: "Users", icon: Users, adminOnly: true },
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
          padding: "0 20px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              background: "#222",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Calendar size={16} color="white" />
          </div>
          <span style={{ fontWeight: 600 }}>Appointments</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {navItems.map((item) => {
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
                }}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}

          {user && (
            <button
              onClick={() => console.log("logout")}
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
      </nav>

      <main style={{ paddingTop: "70px", width: "100%", boxSizing: "border-box", flex: 1 }}>{children}</main>
    </div>
  );
}
