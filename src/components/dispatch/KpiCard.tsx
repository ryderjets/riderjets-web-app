import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useReducer } from "react";

interface Props {
  label: string;
  value: number;
  delta?: number;
  icon: React.ReactNode;
  reducedMotion?: boolean;
}

export default function KpiCard({ label, value, delta, icon, reducedMotion }: Props) {
  const [displayed, setDisplayed] = useReducer((_: number, n: number) => n, reducedMotion ? value : 0);

  useEffect(() => {
    if (reducedMotion) { setDisplayed(value); return; }
    let start = 0;
    const step = Math.ceil(value / 30);
    const id = setInterval(() => {
      start += step;
      if (start >= value) { setDisplayed(value); clearInterval(id); }
      else setDisplayed(start);
    }, 400 / 30);
    return () => clearInterval(id);
  }, [value, reducedMotion]);

  const isZero    = delta === 0;
  const isPositive = (delta ?? 0) > 0;
  const deltaColor = isZero
    ? "var(--muted-foreground)"
    : isPositive
    ? "var(--status-delivered)"
    : "var(--status-blocked)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        padding: "20px 22px",
        boxShadow: "var(--shadow-elegant)",
        backdropFilter: "blur(20px)",
        display: "flex", flexDirection: "column", gap: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{
          fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
          textTransform: "uppercase", color: "var(--muted-foreground)",
        }}>
          {label}
        </span>
        <span style={{
          padding: 8, borderRadius: 10,
          background: "hsla(243,75%,62%,0.12)",
          color: "var(--primary)", display: "flex",
        }}>
          {icon}
        </span>
      </div>

      <span style={{
        fontFamily: "var(--font-mono)", fontSize: 32, fontWeight: 600,
        color: "var(--foreground)", lineHeight: 1,
      }}>
        {displayed.toLocaleString()}
      </span>

      {delta !== undefined && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: deltaColor }}>
          {isZero ? <Minus size={13} /> : isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          <span>{isPositive ? "+" : ""}{delta}% vs yesterday</span>
        </div>
      )}
    </motion.div>
  );
}
