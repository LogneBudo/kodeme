import type { LucideIcon } from "lucide-react";
import RequireAdmin from "./RequireAdmin";
import Layout from "../../layout";

interface AdminPageProps {
  icon?: LucideIcon;
  title: string;
  pageName: string;
  children: React.ReactNode;
}

/**
 * AdminPage wrapper component
 * 
 * Consolidates the common pattern:
 * RequireAdmin → Layout → Content
 * 
 * Usage:
 * <AdminPage title="Appointments" pageName="AdminAppointments">
 *   <AdminAppointments />
 * </AdminPage>
 */
export default function AdminPage(props: AdminPageProps) {
  return (
    <RequireAdmin>
      <Layout currentPageName={props.pageName}>
        {props.children}
      </Layout>
    </RequireAdmin>
  );
}
