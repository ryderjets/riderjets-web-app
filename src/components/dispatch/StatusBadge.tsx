import { motion } from "framer-motion";

export type TripStatus = "COMPLETED" | "IN_PROGRESS" | "PENDING" | "BLOCKED" | "ISSUES" | "OTHER";

const cfg: Record<TripStatus, { label: string; color: string; bg: string }> = {
  COMPLETED:   { label: "Completed",   color: "hsl(160,60%,42%)",  bg: "hsla(160,60%,42%,0.14)" },
  IN_PROGRESS: { label: "In Progress", color: "hsl(210,90%,55%)",  bg: "hsla(210,90%,55%,0.14)" },
  PENDING:     { label: "Pending",     color: "hsl(38,92%,48%)",   bg: "hsla(38,92%,48%,0.14)"  },
  BLOCKED:     { label: "Blocked",     color: "hsl(0,80%,55%)",    bg: "hsla(0,80%,55%,0.14)"   },
  ISSUES:      { label: "Issues",      color: "hsl(25,90%,50%)",   bg: "hsla(25,90%,50%,0.14)"  },
  OTHER:       { label: "Other",       color: "hsl(215,16%,55%)",  bg: "hsla(215,16%,55%,0.12)" },
};

export default function StatusBadge({ status }: { status: TripStatus | string | null | undefined }) {
  const s = (status ?? "PENDING") as TripStatus;
  const c = cfg[s] ?? cfg.OTHER;

  return (
    <motion.span
      key={s}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.15 }}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "3px 10px", borderRadius: 99,
        fontSize: 12, fontWeight: 500, fontFamily: "var(--font-body)",
        color: c.color, background: c.bg,
        border: `1px solid ${c.color}33`,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
      {c.label}
    </motion.span>
  );
}
