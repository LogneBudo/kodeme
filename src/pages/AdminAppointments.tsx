
import { useEffect, useState } from "react";
import { listAppointments, updateAppointment, deleteAppointment } from "../api/firebaseApi";
import type { Appointment } from "../types/appointment";
import { Loader2, Trash2, Edit2, Save, X, Calendar } from "lucide-react";
import { toast } from "sonner";
import AdminPageHeader from "../components/admin/AdminPageHeader";
import AdminTable, { type Column } from "../components/admin/AdminTable";
import tableStyles from "../components/admin/AdminTable.module.css";
import styles from "./AdminBase.module.css";

type AppointmentStatus = "pending" | "confirmed" | "cancelled";

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<AppointmentStatus>("pending");
  const [editNotes, setEditNotes] = useState<string>("");

  const loadAppointments = async () => {
    setLoading(true);
    const data = await listAppointments();
    setAppointments(data);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      await loadAppointments();
    })();
  }, []);

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
    const updated = await updateAppointment(id, { status: editStatus, notes: editNotes });
    if (updated) {
      toast.success("Appointment updated");
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: editStatus, notes: editNotes } : a)));
    } else {
      toast.error("Failed to update appointment");
    }
    cancelEdit();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this appointment?")) return;
    const ok = await deleteAppointment(id);
    if (ok) {
      toast.success("Appointment deleted");
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } else {
      toast.error("Failed to delete appointment");
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
    if (editingId === apt.id && !isPast) {
      return (
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => saveEdit(apt.id)} className={tableStyles.actionButtonSuccess}>
            <Save size={16} />
          </button>
          <button onClick={cancelEdit} className={tableStyles.actionButtonCancel}>
            <X size={16} />
          </button>
        </div>
      );
    }
    return (
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          disabled={isPast}
          onClick={() => startEdit(apt)}
          className={tableStyles.actionButton}
          style={{ background: "#2563eb", color: "white", border: "none" }}
        >
          <Edit2 size={16} />
        </button>
        <button
          disabled={isPast}
          onClick={() => handleDelete(apt.id)}
          className={tableStyles.actionButton}
          style={{ background: "#e11d48", color: "white", border: "none" }}
        >
          <Trash2 size={16} />
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

        <AdminTable
          columns={columns}
          data={appointments}
          loading={loading}
          emptyMessage="No appointments found."
          renderActions={renderActions}
          isRowDisabled={isAppointmentPast}
        />
      </div>
    </div>
  );
}
