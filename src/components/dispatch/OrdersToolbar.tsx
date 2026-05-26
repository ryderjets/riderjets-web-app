import { Search, Filter, Rows3, LayoutGrid, Download, RefreshCw, X } from "lucide-react";
import { useState } from "react";
import type { TripStatus } from "./StatusBadge";

export type ViewMode = "table" | "board";

interface Props {
  search: string;
  onSearch: (v: string) => void;
  activeFilters: TripStatus[];
  onToggleFilter: (s: TripStatus) => void;
  viewMode: ViewMode;
  onViewMode: (v: ViewMode) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

const STATUS_LABELS: Record<TripStatus, string> = {
  IN_PROGRESS: "In Progress",
  PENDING: "Pending Payment",
  COMPLETED: "Completed",
  BLOCKED: "Blocked",
  ISSUES: "Issues",
  OTHER: "Other",
};

const ALL_STATUSES: TripStatus[] = ["IN_PROGRESS", "PENDING", "COMPLETED", "BLOCKED", "ISSUES", "OTHER"];

export default function OrdersToolbar({
  search, onSearch, activeFilters, onToggleFilter,
  viewMode, onViewMode, onRefresh, refreshing,
}: Props) {
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 12px", borderRadius: "var(--radius-md)",
          background: "var(--card)", border: "1px solid var(--border)",
          flex: 1, minWidth: 200, maxWidth: 340,
        }}>
          <Search size={14} color="var(--muted-foreground)" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search txn, driver, vehicle…"
            aria-label="Search orders"
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: "var(--foreground)", fontSize: 13, fontFamily: "var(--font-body)",
            }}
          />
        </div>

        {/* Filter toggle */}
        <button
          aria-label="Toggle status filters"
          onClick={() => setFilterOpen((v) => !v)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 12px", borderRadius: "var(--radius-md)",
            background: filterOpen ? "hsla(243,75%,62%,0.12)" : "var(--card)",
            border: `1px solid ${filterOpen ? "var(--primary)" : "var(--border)"}`,
            color: filterOpen ? "var(--primary)" : "var(--muted-foreground)",
            cursor: "pointer", fontSize: 13, fontFamily: "var(--font-body)",
          }}
        >
          <Filter size={14} />
          Filter
          {activeFilters.length > 0 && (
            <span style={{
              background: "var(--primary)", color: "#fff",
              borderRadius: 99, fontSize: 10, padding: "1px 6px", fontWeight: 600,
            }}>
              {activeFilters.length}
            </span>
          )}
        </button>

        <div style={{ flex: 1 }} />

        {/* View toggle */}
        <div style={{
          display: "flex", borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)", overflow: "hidden",
        }}>
          {(["table", "board"] as ViewMode[]).map((v) => (
            <button
              key={v}
              aria-label={v === "table" ? "Table view" : "Board view"}
              onClick={() => onViewMode(v)}
              style={{
                padding: "7px 12px", background: viewMode === v ? "hsla(243,75%,62%,0.15)" : "var(--card)",
                border: "none", color: viewMode === v ? "var(--primary)" : "var(--muted-foreground)",
                cursor: "pointer", display: "flex", alignItems: "center",
              }}
            >
              {v === "table" ? <Rows3 size={16} /> : <LayoutGrid size={16} />}
            </button>
          ))}
        </div>

        {/* Export */}
        <button aria-label="Export CSV" style={iconBtnStyle}>
          <Download size={16} />
        </button>

        {/* Refresh */}
        <button
          aria-label="Refresh orders"
          onClick={onRefresh}
          style={iconBtnStyle}
        >
          <RefreshCw size={16} style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none" }} />
        </button>
      </div>

      {/* Active filter chips */}
      {filterOpen && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {ALL_STATUSES.map((s) => {
            const on = activeFilters.includes(s);
            return (
              <button
                key={s}
                onClick={() => onToggleFilter(s)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "4px 10px", borderRadius: 99, fontSize: 12,
                  background: on ? "hsla(243,75%,62%,0.15)" : "var(--card)",
                  border: `1px solid ${on ? "var(--primary)" : "var(--border)"}`,
                  color: on ? "var(--primary)" : "var(--muted-foreground)",
                  cursor: "pointer",
                }}
              >
                {STATUS_LABELS[s] || s}
                {on && <X size={10} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  padding: "7px 10px", borderRadius: "var(--radius-md)",
  background: "var(--card)", border: "1px solid var(--border)",
  color: "var(--muted-foreground)", cursor: "pointer", display: "flex", alignItems: "center",
};
