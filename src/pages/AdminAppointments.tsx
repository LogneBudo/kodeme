
import { useState, useMemo } from "react";
import { listAppointments, updateAppointment, deleteAppointment } from "../api/firebaseApi";
import type { Appointment } from "../types/appointment";
import { Loader2, Trash2, Edit2, Save, X, Calendar } from "lucide-react";
import { toast } from "sonner";
import AdminPageHeader from "../components/admin/AdminPageHeader";
import AdminToolbar from "../components/admin/AdminToolbar";
import AdminTable, { type Column } from "../components/admin/AdminTable";
import { useFirestoreQuery } from "../hooks/useFirestoreQuery";
import tableStyles from "../components/admin/AdminTable.module.css";
import styles from "./AdminBase.module.css";

type AppointmentStatus = "pending" | "confirmed" | "cancelled";

export default function AdminAppointments() {
  const { data: appointments = [], loading, refetch } = useFirestoreQuery(
    () => listAppointments(),
    []
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<AppointmentStatus>("pending");
  const [editNotes, setEditNotes] = useState<string>("");  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  function startEdit(apt: Appointment) {
    setEditingId(apt.id);
    setEditStatus(apt.status as AppointmentStatus);
    setEditNotes(apt.notes || "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditStatus("pending");
    setEditNotes("");
  }

  async function saveEdit(id: string) {
    setActionLoading((prev) => ({ ...prev, [`save-${id}`]: true }));
    const updated = await updateAppointment(id, { status: editStatus, notes: editNotes });
    if (updated) {
      toast.success("Appointment updated");
      await refetch();
    } else {
      toast.error("Failed to update appointment");
    }
    setActionLoading((prev) => ({ ...prev, [`save-${id}`]: false }));
    cancelEdit();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this appointment?")) return;
    setActionLoading((prev) => ({ ...prev, [`delete-${id}`]: true }));
    const ok = await deleteAppointment(id);
    if (ok) {
      toast.success("Appointment deleted");
      await refetch();
    } else {
      toast.error("Failed to delete appointment");
    }
    setActionLoading((prev) => ({ ...prev, [`delete-${id}`]: false }));
  }

  // Filter and search appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      // Status filter
      if (statusFilter !== "all" && apt.status !== statusFilter) {
        return false;
      }
      
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesEmail = apt.email?.toLowerCase().includes(query);
        const matchesLocation = apt.locationDetails?.type?.toLowerCase().includes(query) ||
                               apt.locationDetails?.details?.toLowerCase().includes(query);
        const matchesDate = apt.date?.includes(query) || apt.appointmentDate?.includes(query);
        return matchesEmail || matchesLocation || matchesDate;
      }
      
      return true;
    });
  }, [appointments, statusFilter, searchQuery]);

  // Status counts for filter options
  const statusCounts = useMemo(() => {
    const counts = { pending: 0, confirmed: 0, cancelled: 0 };
    appointments.forEach((apt) => {
      if (apt.status in counts) {
        counts[apt.status as keyof typeof counts]++;
      }
    });
    return counts;
  }, [appointments]);

  // Bulk delete handler
  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} selected appointment${selectedIds.size > 1 ? 's' : ''}?`)) return;
    
    const deletePromises = Array.from(selectedIds).map(id => deleteAppointment(id));
    const results = await Promise.all(deletePromises);
    
    const successCount = results.filter(Boolean).length;
    if (successCount > 0) {
      toast.success(`Deleted ${successCount} appointment${successCount > 1 ? 's' : ''}`);
      await refetch();
      setSelectedIds(new Set());
    }
    if (successCount < selectedIds.size) {
      toast.error(`Failed to delete ${selectedIds.size - successCount} appointment${selectedIds.size - successCount > 1 ? 's' : ''}`);
    }
  }

  // Helper to determine if appointment is in the past
  function isAppointmentPast(apt: Appointment): boolean {
    const aptDateStr = apt.date || apt.appointmentDate;
    const aptDate = aptDateStr ? new Date(aptDateStr) : null;
    const now = new Date();
    return !!(aptDate && aptDate < new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  }

  // Column definitions for AdminTable
  const columns: Column<Appointment>[] = [
    {
      key: "appointmentDate",
      label: "Date",
      render: (value, apt) => apt.date || apt.appointmentDate,
    },
    {
      key: "time",
      label: "Time",
      render: (value) => value || "-",
    },
    {
      key: "email",
      label: "Email",
    },
    {
      key: "locationDetails",
      label: "Location",
      render: (value, apt) => `${apt.locationDetails?.type}${apt.locationDetails?.details ? `: ${apt.locationDetails.details}` : ""}`,
    },
    {
      key: "status",
      label: "Status",
      render: (value, apt) => {
        const isPast = isAppointmentPast(apt);
        if (editingId === apt.id && !isPast) {
          return (
            <select value={editStatus} onChange={e => setEditStatus(e.target.value as AppointmentStatus)}>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          );
        }
        return value;
      },
    },
    {
      key: "notes",
      label: "Notes",
      render: (value, apt) => {
        const isPast = isAppointmentPast(apt);
        if (editingId === apt.id && !isPast) {
          return <input value={editNotes} onChange={e => setEditNotes(e.target.value)} style={{ width: 120 }} />;
        }
        return value || "";
      },
    },
  ];

  // Render action buttons for each row
  function renderActions(apt: Appointment) {
    const isPast = isAppointmentPast(apt);
    const isSaveLoading = actionLoading[`save-${apt.id}`];
    const isDeleteLoading = actionLoading[`delete-${apt.id}`];
    const isAnyLoading = isSaveLoading || isDeleteLoading;

    if (editingId === apt.id && !isPast) {
      return (
        <div style={{ display: "flex", gap: 8 }}>
          <button 
            onClick={() => saveEdit(apt.id)} 
            className={tableStyles.actionButtonSuccess}
            disabled={isAnyLoading}
          >
            <Save size={16} />
            {isSaveLoading && " Saving..."}
          </button>
          <button 
            onClick={cancelEdit} 
            className={tableStyles.actionButtonCancel}
            disabled={isAnyLoading}
          >
            <X size={16} />
          </button>
        </div>
      );
    }
    return (
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          disabled={isPast || isAnyLoading}
          onClick={() => startEdit(apt)}
          className={tableStyles.actionButton}
          style={{ background: "#2563eb", color: "white", border: "none" }}
        >
          <Edit2 size={16} />
        </button>
        <button
          disabled={isPast || isAnyLoading}
          onClick={() => handleDelete(apt.id)}
          className={tableStyles.actionButton}
          style={{ background: "#e11d48", color: "white", border: "none" }}
        >
          <Trash2 size={16} />
          {isDeleteLoading && " Deleting..."}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <AdminPageHeader 
          icon={Calendar}
          title="Appointments"
          subtitle="View and manage all bookings"
        />

        <AdminToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search by email, location, or date..."
          filterValue={statusFilter}
          onFilterChange={setStatusFilter}
          filterLabel="Status"
          filterOptions={[
            { value: "pending", label: "Pending", count: statusCounts.pending },
            { value: "confirmed", label: "Confirmed", count: statusCounts.confirmed },
            { value: "cancelled", label: "Cancelled", count: statusCounts.cancelled },
          ]}
          selectedCount={selectedIds.size}
          onBulkDelete={handleBulkDelete}
          onRefresh={refetch}
          showBulkActions={true}
        />

        <AdminTable
          columns={columns}
          data={filteredAppointments}
          loading={loading}
          emptyMessage="No appointments found."
          renderActions={renderActions}
          isRowDisabled={isAppointmentPast}
        />
      </div>
    </div>
  );
}
