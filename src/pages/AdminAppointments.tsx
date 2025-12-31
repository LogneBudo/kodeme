
import { useEffect, useState } from "react";
import { listAppointments, updateAppointment, deleteAppointment } from "../api/firebaseApi";
import type { Appointment } from "../types/appointment";
import { Loader2, Trash2, Edit2, Save, X } from "lucide-react";
import { toast } from "sonner";

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

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.07)", padding: 32 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Appointments</h1>
      {loading ? (
        <div style={{ textAlign: "center", color: "#666" }}><Loader2 className="spin" /> Loading...</div>
      ) : appointments.length === 0 ? (
        <div style={{ textAlign: "center", color: "#666" }}>No appointments found.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f5f5f5" }}>
              <th style={{ padding: 8, textAlign: "left" }}>Date</th>
              <th style={{ padding: 8, textAlign: "left" }}>Time</th>
              <th style={{ padding: 8, textAlign: "left" }}>Email</th>
              <th style={{ padding: 8, textAlign: "left" }}>Location</th>
              <th style={{ padding: 8, textAlign: "left" }}>Status</th>
              <th style={{ padding: 8, textAlign: "left" }}>Notes</th>
              <th style={{ padding: 8 }}></th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((apt) => {
              // Determine if appointment is in the past
              const aptDateStr = apt.date || apt.appointmentDate;
              const aptDate = aptDateStr ? new Date(aptDateStr) : null;
              const now = new Date();
              const isPast = aptDate && aptDate < new Date(now.getFullYear(), now.getMonth(), now.getDate());

              return (
                <tr
                  key={apt.id}
                  style={{
                    borderBottom: "1px solid #eee",
                    background: isPast ? "#f3f4f6" : undefined,
                    color: isPast ? "#999" : undefined,
                    pointerEvents: isPast ? "none" : undefined,
                    opacity: isPast ? 0.6 : 1,
                  }}
                >
                  <td style={{ padding: 8 }}>{aptDateStr}</td>
                  <td style={{ padding: 8 }}>{apt.time || "-"}</td>
                  <td style={{ padding: 8 }}>{apt.email}</td>
                  <td style={{ padding: 8 }}>{apt.locationDetails?.type}{apt.locationDetails?.details ? `: ${apt.locationDetails.details}` : ""}</td>
                  <td style={{ padding: 8 }}>
                    {editingId === apt.id && !isPast ? (
                      <select value={editStatus} onChange={e => setEditStatus(e.target.value as AppointmentStatus)}>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    ) : (
                      apt.status
                    )}
                  </td>
                  <td style={{ padding: 8 }}>
                    {editingId === apt.id && !isPast ? (
                      <input value={editNotes} onChange={e => setEditNotes(e.target.value)} style={{ width: 120 }} />
                    ) : (
                      apt.notes || ""
                    )}
                  </td>
                  <td style={{ padding: 8, display: "flex", gap: 8 }}>
                    {editingId === apt.id && !isPast ? (
                      <>
                        <button onClick={() => saveEdit(apt.id)} style={{ background: "#22c55e", color: "white", border: "none", borderRadius: 4, padding: "4px 10px", cursor: "pointer" }}><Save size={16} /></button>
                        <button onClick={cancelEdit} style={{ background: "#e11d48", color: "white", border: "none", borderRadius: 4, padding: "4px 10px", cursor: "pointer" }}><X size={16} /></button>
                      </>
                    ) : (
                      <>
                        <button disabled={!!isPast} onClick={() => startEdit(apt)} style={{ background: "#2563eb", color: "white", border: "none", borderRadius: 4, padding: "4px 10px", cursor: isPast ? "not-allowed" : "pointer", opacity: isPast ? 0.5 : 1 }}><Edit2 size={16} /></button>
                        <button disabled={!!isPast} onClick={() => handleDelete(apt.id)} style={{ background: "#e11d48", color: "white", border: "none", borderRadius: 4, padding: "4px 10px", cursor: isPast ? "not-allowed" : "pointer", opacity: isPast ? 0.5 : 1 }}><Trash2 size={16} /></button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
