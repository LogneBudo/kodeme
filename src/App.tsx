import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./layout";
import BookAppointment from "./pages/BookAppointment";
import AdminSlots from "../src/pages/AdminSlots";
import UserManagement from "../src/pages/UserManagement";
import AdminSettings from "../src/pages/AdminSettings";
import Login from "../src/pages/Login";
import RequireAdmin from "./components/admin/RequireAdmin";
import AdminAppointments from "../src/pages/AdminAppointments";

export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<Login />} />
      
      <Route
        path="/"
        element={<Navigate to="/BookAppointment" replace />}
      />
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
          <RequireAdmin>
            <Layout currentPageName="AdminSlots">
              <AdminSlots />
            </Layout>
          </RequireAdmin>
        }
      />

      <Route
        path="/admin/users"
        element={
          <RequireAdmin>
            <Layout currentPageName="UserManagement">
              <UserManagement />
            </Layout>
          </RequireAdmin>
        }
      />

      <Route
        path="/admin/settings"
        element={
          <RequireAdmin>
            <Layout currentPageName="AdminSettings">
              <AdminSettings />
            </Layout>
          </RequireAdmin>
        }
      />
      // Add AdminAppointments route
      <Route
        path="/admin/appointments"
        element={
          <RequireAdmin>
            <Layout currentPageName="AdminAppointments">
              <AdminAppointments />
            </Layout>
          </RequireAdmin>
        }
      />
    </Routes>
  );
}