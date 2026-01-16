import { Link } from "react-router-dom";
import { Calendar, Settings, Users, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import layoutStyles from "./layout.module.css";
type LayoutProps = {
  children: React.ReactNode;
  currentPageName: string;
};

export default function Layout({ children, currentPageName }: LayoutProps) {
  const { user, loading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
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
    <div className={layoutStyles.layoutWrapper}>
      <nav className={layoutStyles.navbar}>
        <Link to="/BookAppointment" className={layoutStyles.logoLink}>
          <div className={layoutStyles.logoBox}>
            <Calendar size={16} color="white" />
          </div>
        </Link>

        {/* Centered Title/Sub for all users */}
        {!loading && (
          <div className={layoutStyles.navTitle}>
            <span className={layoutStyles.navTitleMain}>Book an Appointment</span>
            <span className={layoutStyles.navTitleSub}>Schedule your visit in just a few steps</span>
          </div>
        )}

        {/* Desktop Navigation for admin only, as dropdown */}
        {!loading && user && user.role === "admin" && (
          <div className={layoutStyles.desktopNav}>
            <div className={layoutStyles.adminDropdownContainer}>
              <button className={layoutStyles.adminDropdownButton} onClick={() => setMobileMenuOpen((open) => !open)}>
                <Menu size={16} />
                Admin Menu
              </button>
              {mobileMenuOpen && (
                <div className={layoutStyles.adminDropdownMenu}>
                  {navItems.filter(item => item.adminOnly).map(item => {
                    const Icon = item.icon;
                    const isActive = currentPageName === item.name;
                    return (
                      <Link
                        key={item.name}
                        to={`/${item.name}`}
                        className={`${layoutStyles.navLink} ${isActive ? layoutStyles.active : ""}`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon size={16} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className={layoutStyles.logoutButton}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={layoutStyles.mobileMenuButton}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className={layoutStyles.mobileMenu}>
          {!loading && user && navItems.map((item) => {
            if (item.adminOnly && user?.role !== "admin") return null;

            const Icon = item.icon;
            const isActive = currentPageName === item.name;

            return (
              <Link
                key={item.name}
                to={`/${item.name}`}
                onClick={() => setMobileMenuOpen(false)}
                className={`${layoutStyles.mobileNavLink} ${isActive ? layoutStyles.active : ""}`}
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
              className={layoutStyles.mobileLogoutButton}
            >
              <LogOut size={18} />
              Logout
            </button>
          )}
        </div>
      )}

      <main className={layoutStyles.mainContent}>{children}</main>
    </div>
  );
}
