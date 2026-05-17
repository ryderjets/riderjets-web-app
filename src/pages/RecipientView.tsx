import { useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import StatusBadge from "../components/dispatch/StatusBadge";
import type { TripStatus } from "../components/dispatch/StatusBadge";

const client = generateClient<Schema>();
type Trip = Schema["Trip"]["type"];

export default function RecipientView() {
  const [input, setInput]   = useState("");
  const [trip, setTrip]     = useState<Trip | null>(null);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setTrip(null); setLoading(true);
    try {
      const { data } = await client.models.Trip.list({
        filter: { orderNumber: { eq: input.trim() } },
        authMode: "apiKey",
      });
      data.length === 0 ? setError("No order found with that number.") : setTrip(data[0]);
    } catch { setError("Lookup failed. Try again."); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ padding: 32, maxWidth: 520 }}>
      <h2 style={{ fontFamily: "var(--font-display)", marginBottom: 20 }}>Track Your Order</h2>
      <form onSubmit={handleTrack} style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Enter order number"
          required
          style={{ flex: 1, padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: 14, outline: "none" }}
        />
        <button type="submit" disabled={loading} style={{ padding: "10px 18px", borderRadius: "var(--radius-md)", background: "linear-gradient(135deg, var(--primary), var(--primary-end))", border: "none", color: "#fff", cursor: "pointer", fontSize: 14 }}>
          {loading ? "…" : "Track"}
        </button>
      </form>
      {error && <p style={{ color: "var(--status-blocked)", marginBottom: 16 }}>{error}</p>}
      {trip && (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{trip.orderNumber}</span>
            <StatusBadge status={trip.status as TripStatus} />
          </div>
          <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>Driver: {trip.driverName ?? "—"} · {trip.driverPhone ?? "—"}</p>
          <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>Vendor: {trip.vendor ?? "—"}</p>
          {trip.notes && <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>Notes: {trip.notes}</p>}
        </div>
      )}
    </div>
  );
}
