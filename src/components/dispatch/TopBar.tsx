import { Plane, Search, Bell, ChevronDown } from "lucide-react";

interface Props {
  userEmail?: string;
  onSignOut: () => void;
  onMenuToggle?: () => void;
}

export default function TopBar({ userEmail, onSignOut }: Props) {
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      height: 64, display: "flex", alignItems: "center",
      padding: "0 24px", gap: 16,
      background: "hsla(222,28%,7%,0.75)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid var(--border)",
    }}>
      {/* Brand */}
      <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
        <span style={{
          width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg, var(--primary), var(--primary-end))",
        }}>
          <Plane size={16} color="#fff" />
        </span>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "var(--foreground)" }}>
          Rider Jets
        </span>
      </a>

      {/* Search hint */}
      <button
        aria-label="Open command palette"
        style={{
          flex: 1, maxWidth: 320, display: "flex", alignItems: "center", gap: 8,
          padding: "7px 12px", borderRadius: "var(--radius-md)",
          background: "var(--card)", border: "1px solid var(--border)",
          color: "var(--muted-foreground)", cursor: "pointer", textAlign: "left",
        }}
      >
        <Search size={14} />
        <span style={{ flex: 1, fontSize: 13 }}>Search…</span>
        <kbd style={{
          fontSize: 11, padding: "1px 5px", borderRadius: 4,
          background: "var(--accent)", border: "1px solid var(--border)",
          color: "var(--muted-foreground)", fontFamily: "var(--font-mono)",
        }}>⌘K</kbd>
      </button>

      <div style={{ flex: 1 }} />

      {/* Status pill */}
      <span style={{
        display: "flex", alignItems: "center", gap: 6,
        fontSize: 12, color: "var(--muted-foreground)",
      }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--status-delivered)" }} />
        All systems nominal
      </span>

      {/* Notifications */}
      <button aria-label="Notifications" style={{
        position: "relative", background: "none", border: "none",
        color: "var(--muted-foreground)", cursor: "pointer", padding: 6, borderRadius: "var(--radius-sm)",
      }}>
        <Bell size={18} />
        <span style={{
          position: "absolute", top: 4, right: 4,
          width: 7, height: 7, borderRadius: "50%",
          background: "var(--status-blocked)",
        }} />
      </button>

      {/* Avatar menu */}
      <button
        onClick={onSignOut}
        aria-label="User menu"
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "none", border: "none", cursor: "pointer",
          color: "var(--muted-foreground)", padding: "4px 8px",
          borderRadius: "var(--radius-sm)",
        }}
      >
        <span style={{
          width: 30, height: 30, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--primary), var(--primary-end))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color: "#fff",
        }}>
          {(userEmail?.[0] ?? "U").toUpperCase()}
        </span>
        <span style={{ fontSize: 13, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {userEmail}
        </span>
        <ChevronDown size={14} />
      </button>
    </header>
  );
}
