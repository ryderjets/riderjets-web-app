import type { OrderStatus } from "../types";

const colors: Record<OrderStatus, string> = {
  PENDING: "#f59e0b",
  OPTIMIZED: "#3b82f6",
  IN_TRANSIT: "#8b5cf6",
  DELAYED: "#ef4444",
  DELIVERED: "#10b981",
};

export default function StatusBadge({ status }: { status: OrderStatus | null | undefined }) {
  const s = (status ?? "PENDING") as OrderStatus;
  return (
    <span
      style={{
        background: colors[s],
        color: "#fff",
        padding: "2px 10px",
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 0.5,
      }}
    >
      {s.replace("_", " ")}
    </span>
  );
}
