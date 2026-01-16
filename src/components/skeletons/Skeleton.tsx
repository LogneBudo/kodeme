/**
 * Generic skeleton component for content placeholders
 */
interface SkeletonProps {
  lines?: number;
  width?: string;
  height?: string;
}

export default function Skeleton({
  lines = 3,
  width = "100%",
  height = "16px",
}: SkeletonProps) {
  return (
    <div>
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          style={{
            width: i === lines - 1 ? "80%" : width,
            height,
            background: "#f0f0f0",
            borderRadius: "4px",
            marginBottom: "8px",
            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          }}
        />
      ))}
    </div>
  );
}
