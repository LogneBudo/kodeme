import { Loader2 } from "lucide-react";

export interface Column<T> {
  key: Extract<keyof T, string>;
  label: string;
  render?: (value: T[keyof T], row: T, isEditing: boolean) => React.ReactNode;
  textAlign?: "left" | "right" | "center";
  width?: string;
}

export interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  renderActions: (row: T, isEditing: boolean) => React.ReactNode;
  isRowDisabled?: (row: T) => boolean;
  keyExtractor?: (row: T, index: number) => string | number;
}

export default function AdminTable<T extends { id?: string | number }>({
  columns,
  data,
  loading = false,
  emptyMessage = "No data found.",
  renderActions,
  isRowDisabled = () => false,
  keyExtractor = (row) => row.id || Math.random(),
}: AdminTableProps<T>) {
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "#666" }}>
        <Loader2 style={{ margin: "0 auto 16px", animation: "spin 1s linear infinite" }} size={24} />
        Loading...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "#666" }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={{ background: "white", borderRadius: "8px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f5f5f5", borderBottom: "1px solid #ddd" }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: "12px 16px",
                  textAlign: col.textAlign || "left",
                  fontSize: "14px",
                  fontWeight: 600,
                  width: col.width,
                }}
              >
                {col.label}
              </th>
            ))}
            <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "14px", fontWeight: 600 }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => {
            const disabled = isRowDisabled(row);
            const rowKey = keyExtractor(row, index);
            // Check if row has an _isEditing state (for edit mode)
            const isEditing = Boolean(((row as unknown) as Record<string, unknown>)._isEditing);

            return (
              <tr
                key={rowKey}
                style={{
                  borderBottom: "1px solid #eee",
                  background: disabled ? "#f3f4f6" : undefined,
                  color: disabled ? "#999" : undefined,
                  pointerEvents: disabled ? "none" : undefined,
                  opacity: disabled ? 0.6 : 1,
                }}
              >
                {columns.map((col) => {
                  const value = row[col.key] as T[keyof T];
                  const content = col.render ? col.render(value, row, isEditing) : String(value);

                  return (
                    <td
                      key={col.key}
                      style={{
                        padding: "12px 16px",
                        fontSize: "14px",
                        textAlign: col.textAlign || "left",
                      }}
                    >
                      {content}
                    </td>
                  );
                })}
                <td
                  style={{
                    padding: "12px 16px",
                    textAlign: "right",
                  }}
                >
                  {renderActions(row, isEditing)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
