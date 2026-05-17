import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import StatusBadge from "../components/dispatch/StatusBadge";
import type { TripStatus } from "../components/dispatch/StatusBadge";

const client = generateClient<Schema>();
type Trip = Schema["Trip"]["type"];

export default function RiderView() {
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    const sub = client.models.Trip.observeQuery({ authMode: "apiKey" }).subscribe({
      next: (data) => setTrips(data.items.filter((t) => t.status === "IN_PROGRESS")),
    });
    return () => sub.unsubscribe();
  }, []);

  async function updateStatus(id: string, status: TripStatus) {
    await client.models.Trip.update({ id, status }, { authMode: "apiKey" });
  }

  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ fontFamily: "var(--font-display)", marginBottom: 20 }}>Rider View</h2>
      {trips.length === 0 ? (
        <p style={{ color: "var(--muted-foreground)" }}>No active trips.</p>
      ) : trips.map((t) => (
        <div key={t.id} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{t.orderNumber}</span>
            <StatusBadge status={t.status as TripStatus} />
          </div>
          <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 12 }}>{t.driverName} · {t.driverPhone}</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => updateStatus(t.id, "COMPLETED")} style={btnStyle("#10b981")}>Mark Completed</button>
            <button onClick={() => updateStatus(t.id, "BLOCKED")} style={btnStyle("#ef4444")}>Report Blocked</button>
          </div>
        </div>
      ))}
    </div>
  );
}

const btnStyle = (bg: string): React.CSSProperties => ({
  padding: "7px 14px", borderRadius: "var(--radius-md)",
  background: bg, border: "none", color: "#fff",
  cursor: "pointer", fontSize: 13, fontFamily: "var(--font-body)",
});
