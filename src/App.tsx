import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./layout";
import BookAppointment from "./pages/BookAppointment";
import AdminSlots from "../src/pages/AdminSlots";
import UserManagement from "../src/pages/UserManagement";
import Login from "../src/pages/Login";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
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
        path="/AdminSlots"
        element={
          <Layout currentPageName="AdminSlots">
            <AdminSlots />
          </Layout>
        }
      />

      <Route
        path="/UserManagement"
        element={
          <Layout currentPageName="UserManagement">
            <UserManagement />
          </Layout>
        }
      />
    </Routes>
  );
}