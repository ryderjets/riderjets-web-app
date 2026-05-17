import { motion } from "framer-motion";

export type TripStatus = "COMPLETED" | "IN_PROGRESS" | "PENDING" | "BLOCKED" | "ISSUES" | "OTHER";

const cfg: Record<TripStatus, { label: string; color: string; bg: string }> = {
  COMPLETED:   { label: "Completed",   color: "var(--status-delivered)", bg: "hsla(160,60%,45%,0.12)" },
  IN_PROGRESS: { label: "In Progress", color: "var(--status-transit)",   bg: "hsla(199,80%,52%,0.12)" },
  PENDING:     { label: "Pending",     color: "var(--status-pending)",   bg: "hsla(38,92%,52%,0.12)"  },
  BLOCKED:     { label: "Blocked",     color: "var(--status-blocked)",   bg: "hsla(0,72%,56%,0.12)"   },
  ISSUES:      { label: "Issues",      color: "var(--status-issues)",    bg: "hsla(25,90%,54%,0.12)"  },
  OTHER:       { label: "Other",       color: "var(--muted-foreground)", bg: "hsla(215,16%,52%,0.12)" },
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
