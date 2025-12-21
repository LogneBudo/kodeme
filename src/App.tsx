import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./layout";
import BookAppointment from "./pages/BookAppointment";
import AdminSlots from "../src/pages/AdminSlots";

export default function App() {
  return (
    <Routes>
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
    </Routes>
  );
}