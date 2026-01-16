/**
 * Skeleton component for cards
 * Displays a placeholder while data is loading
 */
export default function CardSkeleton() {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "12px",
        padding: "16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      {/* Header */}
      <div
        style={{
          height: "24px",
          background: "#f0f0f0",
          borderRadius: "4px",
          marginBottom: "12px",
          animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        }}
      />

      {/* Lines */}
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          style={{
            height: "12px",
            background: "#f0f0f0",
            borderRadius: "4px",
            marginBottom: "8px",
            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "16px",
      }}
    >
      {[...Array(count)].map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
