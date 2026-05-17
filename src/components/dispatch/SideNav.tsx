import {
  LayoutDashboard, MapPinned, Users, Truck,
  BarChart3, FileText, Building2, IndianRupee, Settings,
  LifeBuoy, LogOut,
} from "lucide-react";

export type NavId =
  | "dispatch" | "map" | "drivers" | "vehicles"
  | "analytics" | "reports" | "vendors" | "payments" | "settings"
  | "help" | "landing";

interface NavItem { id: NavId; label: string; icon: React.ReactNode }
interface NavGroup { heading: string; items: NavItem[] }

const groups: NavGroup[] = [
  {
    heading: "Operate",
    items: [
      { id: "dispatch",  label: "Dispatch",  icon: <LayoutDashboard size={18} /> },
      { id: "map",       label: "Live Map",  icon: <MapPinned size={18} /> },
      { id: "drivers",   label: "Drivers",   icon: <Users size={18} /> },
      { id: "vehicles",  label: "Vehicles",  icon: <Truck size={18} /> },
    ],
  },
  {
    heading: "Insights",
    items: [
      { id: "analytics", label: "Analytics", icon: <BarChart3 size={18} /> },
      { id: "reports",   label: "Reports",   icon: <FileText size={18} /> },
    ],
  },
  {
    heading: "Manage",
    items: [
      { id: "vendors",   label: "Vendors",   icon: <Building2 size={18} /> },
      { id: "payments",  label: "Payments",  icon: <IndianRupee size={18} /> },
      { id: "settings",  label: "Settings",  icon: <Settings size={18} /> },
    ],
  },
];

interface Props {
  active: NavId;
  onChange: (id: NavId) => void;
  onSignOut: () => void;
}

export default function SideNav({ active, onChange, onSignOut }: Props) {
  return (
    <nav style={{
      width: 240, flexShrink: 0,
      display: "flex", flexDirection: "column",
      background: "var(--card)",
      borderRight: "1px solid var(--border)",
      height: "100%", overflowY: "auto",
      padding: "16px 12px",
    }}>
      {groups.map((g) => (
        <div key={g.heading} style={{ marginBottom: 24 }}>
          <p style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "var(--muted-foreground)",
            padding: "0 10px", marginBottom: 6,
          }}>
            {g.heading}
          </p>
          {g.items.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChange(item.id)}
                aria-current={isActive ? "page" : undefined}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 10px", borderRadius: "var(--radius-md)",
                  background: isActive ? "hsla(243,75%,62%,0.12)" : "none",
                  border: "none",
                  borderLeft: isActive ? "2px solid var(--primary)" : "2px solid transparent",
                  color: isActive ? "var(--foreground)" : "var(--muted-foreground)",
                  cursor: "pointer", fontSize: 14, fontFamily: "var(--font-body)",
                  fontWeight: isActive ? 500 : 400,
                  transition: "background 0.12s, color 0.12s",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "hsla(215,20%,22%,0.4)"; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </div>
      ))}

      <div style={{ marginTop: "auto", borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 2 }}>
        <NavFooterBtn icon={<LifeBuoy size={18} />} label="Help" onClick={() => {}} />
        <NavFooterBtn icon={<LogOut size={18} />} label="Sign out" onClick={onSignOut} />
      </div>
    </nav>
  );
}

function NavFooterBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "9px 10px", borderRadius: "var(--radius-md)",
        background: "none", border: "none",
        color: "var(--muted-foreground)", cursor: "pointer",
        fontSize: 14, fontFamily: "var(--font-body)", textAlign: "left",
        transition: "background 0.12s, color 0.12s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "hsla(215,20%,22%,0.4)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--foreground)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)"; }}
    >
      {icon}{label}
    </button>
  );
}
