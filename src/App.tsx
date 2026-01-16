import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import Layout from "./layout";
import BookAppointment from "./pages/BookAppointment";
import AdminSlots from "../src/pages/AdminSlots";
import UserManagement from "../src/pages/UserManagement";
import AdminSettings from "../src/pages/AdminSettings";
import Login from "../src/pages/Login";
import AdminPage from "./components/admin/AdminPage";
import AdminAppointments from "../src/pages/AdminAppointments";
import GoogleOAuthCallback from "../src/pages/GoogleOAuthCallback";
import OutlookOAuthCallback from "../src/pages/OutlookOAuthCallback";

export default function App() {
  return (
    <>
      <Toaster position="bottom-right" />
      <Routes>
      <Route path="/admin/login" element={<Login />} />
      
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
        path="/admin/slots"
        element={
          <AdminPage title="Slot Management" pageName="AdminSlots">
            <AdminSlots />
          </AdminPage>
        }
      />

      <Route
        path="/admin/users"
        element={
          <AdminPage title="User Management" pageName="UserManagement">
            <UserManagement />
          </AdminPage>
        }
      />

      <Route
        path="/admin/settings"
        element={
          <AdminPage title="Settings" pageName="AdminSettings">
            <AdminSettings />
          </AdminPage>
        }
      />

      <Route
        path="/admin/appointments"
        element={
          <AdminPage title="Appointments" pageName="AdminAppointments">
            <AdminAppointments />
          </AdminPage>
        }
      />
    </Routes>
    </>
  );
}