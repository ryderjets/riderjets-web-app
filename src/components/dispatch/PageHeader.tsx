import { Plus, Home, ChevronRight, CalendarRange } from "lucide-react";
import { motion } from "framer-motion";

export type TimelineFilter = "today" | "last7" | "month" | "last30" | "last90" | "last365" | "all";

const TIMELINE_OPTIONS: { value: TimelineFilter; label: string }[] = [
  { value: "today",  label: "Today" },
  { value: "last7",  label: "Last 7 Days" },
  { value: "month",  label: "This Month" },
  { value: "last30", label: "Last 30 Days" },
  { value: "last90", label: "Last 90 Days" },
  { value: "last365", label: "This Year" },
  { value: "all", label: "All Orders" },
];

interface Props {
  onNewOrder: () => void;
  timeline: TimelineFilter;
  onTimeline: (v: TimelineFilter) => void;
}

export default function PageHeader({ onNewOrder, timeline, onTimeline }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color: "var(--muted-foreground)", fontSize: 13 }}>
          <Home size={13} />
          <ChevronRight size={12} />
          <span>Dispatch</span>
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 28, letterSpacing: "-0.02em", color: "var(--foreground)" }}>
          Dispatch
        </h1>
        <p style={{ color: "var(--muted-foreground)", marginTop: 4, fontSize: 14 }}>
          Coordinate every shipment in motion.
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
        {/* Timeline filter */}
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <CalendarRange size={14} style={{ position: "absolute", left: 10, color: "var(--muted-foreground)", pointerEvents: "none" }} />
          <select
            value={timeline}
            onChange={(e) => onTimeline(e.target.value as TimelineFilter)}
            aria-label="Timeline filter"
            style={{
              paddingLeft: 30, paddingRight: 12, paddingTop: 10, paddingBottom: 10,
              borderRadius: "var(--radius-md)",
              background: "var(--card)", border: "1px solid var(--border)",
              color: "var(--foreground)", cursor: "pointer",
              fontFamily: "var(--font-body)", fontSize: 14,
              outline: "none", appearance: "none", WebkitAppearance: "none",
            }}
          >
            {TIMELINE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* New order */}
        <button
          onClick={onNewOrder}
          aria-label="Create new order"
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 18px", borderRadius: "var(--radius-md)",
            background: "linear-gradient(135deg, var(--primary), var(--primary-end))",
            border: "none", color: "#fff", cursor: "pointer",
            fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 14,
            boxShadow: "0 0 20px var(--primary-glow)", transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
        >
          <Plus size={18} />
          New order
        </button>
      </div>
    </motion.div>
  );
}
