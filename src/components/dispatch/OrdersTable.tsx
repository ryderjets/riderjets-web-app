import { PackageOpen, AlertOctagon } from "lucide-react";
import { motion } from "framer-motion";
import type { Schema } from "../../../amplify/data/resource";
import StatusBadge from "./StatusBadge";
import type { TripStatus } from "./StatusBadge";
import OrderRowActions from "./OrderRowActions";

type Trip = Schema["Trip"]["type"];

interface Props {
  trips: Trip[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onRowClick: (trip: Trip) => void;
  onEdit: (trip: Trip) => void;
  onDelete: (id: string) => void;
  onNewOrder: () => void;
  page: number;
  pageSize: number;
  onPage: (p: number) => void;
}

const thStyle: React.CSSProperties = {
  padding: "10px 14px", textAlign: "left",
  fontSize: 11, fontWeight: 600, letterSpacing: "0.07em",
  textTransform: "uppercase", color: "var(--muted-foreground)",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "13px 14px", fontSize: 13, color: "var(--foreground)",
  borderBottom: "1px solid hsla(215,20%,22%,0.4)",
};

const VEHICLE_LABELS: Record<string, string> = {
  AUTO: "Auto", TROLLEY: "Trolley", TATA_ACE: "Tata Ace",
  SMALL_TRUCK: "Small Truck", LARGE_TRUCK: "Large Truck", OTHER: "Other",
};

function formatTransactionDate(value?: string | null) {
  if (!value) return "—";
  const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(value);
  if (!match) return value;
  const [, year, month, day] = match;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${year}-${months[Number(month) - 1]}-${day}`;
}

export default function OrdersTable({
  trips, loading, error, onRetry, onRowClick, onEdit, onDelete,
  onNewOrder, page, pageSize, onPage,
}: Props) {
  const total = trips.length;
  const start = page * pageSize;
  const slice = trips.slice(start, start + pageSize);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div style={{
      background: "hsla(222,24%,10%,0.6)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-xl)",
      boxShadow: "var(--shadow-elegant)",
      backdropFilter: "blur(20px)",
      overflow: "hidden",
    }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }} aria-label="Dispatch orders">
          <caption style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
            Dispatch orders
          </caption>
          <thead>
            <tr style={{
              position: "sticky", top: 0,
              background: "hsla(222,24%,10%,0.9)",
              backdropFilter: "blur(12px)",
              borderBottom: "1px solid var(--border)",
            }}>
              <th scope="col" style={thStyle}>Txn Date</th>
              <th scope="col" style={thStyle}>Order #</th>
              <th scope="col" style={thStyle}>Vendor</th>
              <th scope="col" style={thStyle}>Driver</th>
              <th scope="col" style={thStyle}>Phone</th>
              <th scope="col" style={thStyle}>Vehicle</th>
              <th scope="col" style={thStyle}>Expense</th>
              <th scope="col" style={thStyle}>Status</th>
              <th scope="col" style={thStyle}>Notes</th>
              <th scope="col" style={thStyle}>Updated</th>
              <th scope="col" style={{ ...thStyle, width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {/* Loading skeletons */}
            {loading && Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 11 }).map((_, j) => (
                  <td key={j} style={{ padding: "14px" }}>
                    <div style={{
                      height: 13, borderRadius: 6,
                      background: "linear-gradient(90deg, var(--card) 25%, var(--accent) 50%, var(--card) 75%)",
                      backgroundSize: "200% 100%",
                      animation: "shimmer 1.4s infinite",
                      width: j === 7 ? 80 : "75%",
                    }} />
                  </td>
                ))}
              </tr>
            ))}

            {/* Error state */}
            {!loading && error && (
              <tr>
                <td colSpan={11} style={{ padding: "60px 20px", textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <AlertOctagon size={32} color="var(--status-blocked)" />
                    <p style={{ color: "var(--muted-foreground)" }}>{error}</p>
                    <button onClick={onRetry} style={actionBtnStyle}>Retry</button>
                  </div>
                </td>
              </tr>
            )}

            {/* Empty state */}
            {!loading && !error && slice.length === 0 && (
              <tr>
                <td colSpan={11} style={{ padding: "80px 20px", textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <PackageOpen size={40} color="var(--muted-foreground)" strokeWidth={1.5} />
                    <p style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--foreground)" }}>No orders yet</p>
                    <p style={{ color: "var(--muted-foreground)", fontSize: 13 }}>Get started by creating your first shipment.</p>
                    <button onClick={onNewOrder} style={actionBtnStyle}>Create your first order</button>
                  </div>
                </td>
              </tr>
            )}

            {/* Data rows */}
            {!loading && !error && slice.map((trip, i) => (
              <motion.tr
                key={trip.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.2 }}
                onClick={() => onRowClick(trip)}
                style={{ cursor: "pointer", transition: "background 0.12s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "hsla(215,20%,22%,0.3)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
              >
                <td style={tdStyle}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                    {formatTransactionDate(trip.transactionDate)}
                  </span>
                </td>
                <td style={tdStyle}>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500, color: "var(--primary)" }}>
                    {trip.orderNumber}
                  </span>
                </td>
                <td style={tdStyle}>{trip.vendor ?? "—"}</td>
                <td style={tdStyle}>{trip.driverName ?? "—"}</td>
                <td style={{ ...tdStyle, fontFamily: "var(--font-mono)", fontSize: 12 }}>
                  {trip.driverPhone ?? "—"}
                </td>
                <td style={tdStyle}>
                  {trip.vehicleType ? VEHICLE_LABELS[trip.vehicleType] ?? trip.vehicleType : "—"}
                </td>
                <td style={{ ...tdStyle, fontFamily: "var(--font-mono)" }}>
                  {trip.expense != null
                    ? <span>₹{trip.expense.toLocaleString("en-IN")}</span>
                    : "—"}
                </td>
                <td style={tdStyle}>
                  <StatusBadge status={trip.status as TripStatus} />
                </td>
                <td style={{ ...tdStyle, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--muted-foreground)" }}>
                  {trip.notes ?? "—"}
                </td>
                <td style={{ ...tdStyle, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted-foreground)" }}>
                  {trip.dateUpdated ? new Date(trip.dateUpdated).toLocaleDateString("en-IN") : "—"}
                </td>
                <td style={{ ...tdStyle, width: 40 }} onClick={(e) => e.stopPropagation()}>
                  <OrderRowActions
                    onView={() => onRowClick(trip)}
                    onEdit={() => onEdit(trip)}
                    onDelete={() => onDelete(trip.id)}
                  />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {!loading && !error && total > 0 && (
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 20px", borderTop: "1px solid var(--border)",
          fontSize: 13, color: "var(--muted-foreground)",
        }}>
          <span>Showing {start + 1}–{Math.min(start + pageSize, total)} of {total}</span>
          <div style={{ display: "flex", gap: 6 }}>
            <PagBtn label="‹" disabled={page === 0} onClick={() => onPage(page - 1)} />
            <PagBtn label="›" disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function PagBtn({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "4px 10px", borderRadius: "var(--radius-sm)",
      background: "var(--card)", border: "1px solid var(--border)",
      color: disabled ? "var(--muted-foreground)" : "var(--foreground)",
      cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1, fontSize: 14,
    }}>
      {label}
    </button>
  );
}

const actionBtnStyle: React.CSSProperties = {
  padding: "8px 18px", borderRadius: "var(--radius-md)",
  background: "linear-gradient(135deg, var(--primary), var(--primary-end))",
  border: "none", color: "#fff", cursor: "pointer",
  fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500,
};
