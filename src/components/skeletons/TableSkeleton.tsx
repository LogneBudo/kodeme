/**
 * Skeleton component for table rows
 * Displays a placeholder while data is loading
 */
export default function TableRowSkeleton() {
  return (
    <tr style={{ borderBottom: "1px solid #eee" }}>
      {[...Array(4)].map((_, i) => (
        <td key={i} style={{ padding: "12px 16px" }}>
          <div
            style={{
              height: "16px",
              background: "#f0f0f0",
              borderRadius: "4px",
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          />
        </td>
      ))}
    </tr>
  );
}

export function TableSkeletonBody({ rows = 5 }: { rows?: number }) {
  return (
    <tbody>
      {[...Array(rows)].map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </tbody>
  );
}
