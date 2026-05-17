import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  label:        string;
  expense:      number;
  tripCount:    number;
  tripLabel:    string;
  delta?:       number;
  deltaLabel?:  string;        // e.g. "vs yesterday", "vs prev 7 days"
  icon:         React.ReactNode;
  reducedMotion?: boolean;
  accentColor?: string;
}

export function formatExpense(v: number): string {
  if (v >= 10_00_000) return `₹${(v / 1_00_000).toFixed(2)} L`;
  if (v >= 1_00_000)  return `₹${(v / 1_00_000).toFixed(2)} L`;
  if (v >= 1_000)     return `₹${(v / 1_000).toFixed(1)} K`;
  return `₹${v.toLocaleString("en-IN")}`;
}

export default function KpiCard({ label, expense, tripCount, tripLabel, delta, deltaLabel, icon, accentColor }: Props) {
  const isZero     = delta === 0;
  const isPositive = (delta ?? 0) > 0;
  const deltaColor = isZero ? "var(--muted-foreground)" : isPositive ? "hsl(160,60%,42%)" : "hsl(0,80%,55%)";
  const accent     = accentColor ?? "var(--primary)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      style={{
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)", padding: "20px 22px",
        boxShadow: "var(--shadow-elegant)", backdropFilter: "blur(20px)",
        display: "flex", flexDirection: "column", gap: 10,
      }}
    >
      {/* Label + icon */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
          {label}
        </span>
        <span style={{ padding: 8, borderRadius: 10, background: `${accent}1a`, color: accent, display: "flex" }}>
          {icon}
        </span>
      </div>

      {/* Primary headline — expense */}
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 700, color: "var(--foreground)", lineHeight: 1, letterSpacing: "-0.02em" }}>
        {formatExpense(expense)}
      </span>

      {/* Sub-text — trip count */}
      <span style={{ fontSize: 12, color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}>
        {tripCount === 0 ? `No trips ${tripLabel}` : `${tripCount} trip${tripCount !== 1 ? "s" : ""} ${tripLabel}`}
      </span>

      {/* Delta — financial day-over-day */}
      {delta !== undefined && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: deltaColor }}>
          {isZero ? <Minus size={13} /> : isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          <span>{isPositive ? "+" : ""}{delta}% spend {deltaLabel ?? "vs yesterday"}</span>
        </div>
      )}
    </motion.div>
  );
}
