import { Plus, Home, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  onNewOrder: () => void;
}

export default function PageHeader({ onNewOrder }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
    >
      <div>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color: "var(--muted-foreground)", fontSize: 13 }}>
          <Home size={13} />
          <ChevronRight size={12} />
          <span>Dispatch</span>
        </div>
        <h1 style={{
          fontFamily: "var(--font-display)", fontWeight: 700,
          fontSize: 28, letterSpacing: "-0.02em", color: "var(--foreground)",
        }}>
          Dispatch
        </h1>
        <p style={{ color: "var(--muted-foreground)", marginTop: 4, fontSize: 14 }}>
          Coordinate every shipment in motion.
        </p>
      </div>

      <button
        onClick={onNewOrder}
        aria-label="Create new order"
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 18px", borderRadius: "var(--radius-md)",
          background: "linear-gradient(135deg, var(--primary), var(--primary-end))",
          border: "none", color: "#fff", cursor: "pointer",
          fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 14,
          boxShadow: "0 0 20px var(--primary-glow)",
          transition: "opacity 0.15s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
      >
        <Plus size={18} />
        New order
      </button>
    </motion.div>
  );
}
