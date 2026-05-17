import { MoreHorizontal, Eye, Pencil, Copy, Archive } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface Props {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function OrderRowActions({ onView, onEdit, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const items = [
    { icon: <Eye size={14} />,     label: "View",      action: onView },
    { icon: <Pencil size={14} />,  label: "Edit",      action: onEdit },
    { icon: <Copy size={14} />,    label: "Duplicate", action: () => {} },
    { icon: <Archive size={14} />, label: "Archive",   action: onDelete },
  ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        aria-label="Row actions"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "var(--muted-foreground)", padding: "4px 6px",
          borderRadius: "var(--radius-sm)", display: "flex",
        }}
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 100,
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)", padding: "4px",
          boxShadow: "var(--shadow-elegant)", minWidth: 140,
        }}>
          {items.map((item) => (
            <button
              key={item.label}
              onClick={(e) => { e.stopPropagation(); item.action(); setOpen(false); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 8,
                padding: "8px 10px", background: "none", border: "none",
                color: "var(--foreground)", cursor: "pointer", fontSize: 13,
                fontFamily: "var(--font-body)", borderRadius: "var(--radius-sm)",
                textAlign: "left",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
            >
              {item.icon}{item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
