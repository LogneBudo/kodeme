import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import Layout from "./layout";
import BookAppointment from "./pages/BookAppointment";
import PublicBooking from "./pages/PublicBooking";
import AdminSlots from "../src/pages/AdminSlots";
import UserManagement from "../src/pages/UserManagement";
import AdminSettings from "../src/pages/AdminSettings";
import CalendarManagement from "../src/pages/CalendarManagement";
import TeamManagement from "../src/pages/TeamManagement";
import Login from "../src/pages/Login";
import SetupPage from "../src/pages/SetupPage";
import AdminPage from "./components/admin/AdminPage";
import AdminAppointments from "../src/pages/AdminAppointments";
import GoogleOAuthCallback from "../src/pages/GoogleOAuthCallback";
import OutlookOAuthCallback from "../src/pages/OutlookOAuthCallback";
import AdminDebug from "../src/pages/AdminDebug";
import ProfilePage from "../src/pages/ProfilePage";
import ErrorBoundary from "./components/ErrorBoundary";
import ErrorPage from "./pages/ErrorPage";
import TestTenantUsers from "./pages/tests";
import { ProtectedAdminRoute } from "./components/ProtectedAdminRoute";

export default function App() {
  return (
    <>
      <Toaster position="bottom-right" />
      <ErrorBoundary fallback={(error, reset) => <ErrorPage title="Oops! An error occurred" message={error.message} onRetry={reset} />}>
        <Routes>
        <Route path="/admin/login" element={<Login />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/tests" element={<TestTenantUsers />} />
        <Route
          path="/"
          element={<Navigate to="/BookAppointment" replace />}
        />
        <Route path="/auth/google/callback" element={<GoogleOAuthCallback />} />
        <Route path="/auth/outlook/callback" element={<OutlookOAuthCallback />} />
        <Route
          path="/BookAppointment"
          element={
            <Layout currentPageName="BookAppointment">
              <BookAppointment />
            </Layout>
          }
        />

        <Route
          path="/book/:orgId/:calendarId"
          element={
            <Layout currentPageName="BookAppointment">
              <PublicBooking />
            </Layout>
          }
        />

        <Route
          path="/admin/slots"
          element={
            <ProtectedAdminRoute>
              <AdminPage title="Slot Management" pageName="AdminSlots">
                <AdminSlots />
              </AdminPage>
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedAdminRoute>
              <AdminPage title="User Management" pageName="UserManagement">
                <UserManagement />
              </AdminPage>
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin/calendars"
          element={
            <ProtectedAdminRoute>
              <AdminPage title="Calendar Management" pageName="CalendarManagement">
                <CalendarManagement />
              </AdminPage>
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin/team"
          element={
            <ProtectedAdminRoute>
              <AdminPage title="Team Management" pageName="TeamManagement">
                <TeamManagement />
              </AdminPage>
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <ProtectedAdminRoute>
              <AdminPage title="Settings" pageName="AdminSettings">
                <AdminSettings />
              </AdminPage>
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin/appointments"
          element={
            <ProtectedAdminRoute>
              <AdminPage title="Appointments" pageName="AdminAppointments">
                <AdminAppointments />
              </AdminPage>
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin/debug"
          element={
            <ProtectedAdminRoute>
              <AdminPage title="Debug" pageName="AdminDebug">
                <AdminDebug />
              </AdminPage>
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin/profile"
          element={
            <ProtectedAdminRoute>
              <AdminPage title="My Account" pageName="ProfilePage">
                <ProfilePage />
              </AdminPage>
            </ProtectedAdminRoute>
          }
        />
      </Routes>
      </ErrorBoundary>
    </>
  );
}