import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Clock, ShieldCheck, ShieldAlert, User, Pencil } from "lucide-react";
import type { Schema } from "../../amplify/data/resource";

const client = generateClient<Schema>();
type Driver = Schema["Driver"]["type"];
type VettingStatus = "PENDING_REVIEW" | "VETTED" | "SUSPENDED";

const VETTING_CFG: Record<VettingStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PENDING_REVIEW: { label: "Pending Review", color: "var(--status-pending)",   bg: "hsla(38,92%,52%,0.12)",  icon: <Clock size={12} /> },
  VETTED:         { label: "Vetted",          color: "var(--status-delivered)", bg: "hsla(160,60%,45%,0.12)", icon: <ShieldCheck size={12} /> },
  SUSPENDED:      { label: "Suspended",       color: "var(--status-blocked)",   bg: "hsla(0,72%,56%,0.12)",   icon: <ShieldAlert size={12} /> },
};

const VEHICLE_LABELS: Record<string, string> = {
  AUTO: "Auto", TROLLEY: "Trolley", TATA_ACE: "Tata Ace",
  SMALL_TRUCK: "Small Truck", LARGE_TRUCK: "Large Truck", OTHER: "Other",
};

const empty = { name: "", phone: "+91 ", vehicleType: "TATA_ACE", preferredVendor: "", licenseNumber: "", licenseExpiry: "", notes: "" };

export default function Drivers() {
  const [drivers, setDrivers]   = useState<Driver[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Driver | null>(null);
  const [form, setForm]         = useState({ ...empty });
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    const sub = client.models.Driver.observeQuery({ authMode: "apiKey" }).subscribe({
      next: (d) => { setDrivers([...d.items]); setLoading(false); },
    });
    return () => sub.unsubscribe();
  }, []);

  function openAdd() {
    setEditTarget(null);
    setForm({ ...empty });
    setShowDialog(true);
  }

  function openEdit(d: Driver) {
    setEditTarget(d);
    setForm({
      name: d.name, phone: d.phone,
      vehicleType: d.vehicleType ?? "TATA_ACE",
      preferredVendor: d.preferredVendor ?? "",
      licenseNumber: d.licenseNumber ?? "",
      licenseExpiry: d.licenseExpiry ?? "",
      notes: d.notes ?? "",
    });
    setShowDialog(true);
  }

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((v) => ({ ...v, [f]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    if (editTarget) {
      await client.models.Driver.update({
        id: editTarget.id,
        name: form.name, phone: form.phone,
        vehicleType: form.vehicleType as Driver["vehicleType"],
        preferredVendor: form.preferredVendor,
        licenseNumber: form.licenseNumber,
        licenseExpiry: form.licenseExpiry || undefined,
        notes: form.notes,
        updatedDate: new Date().toISOString(),
      }, { authMode: "apiKey" });
    } else {
      await client.models.Driver.create({
        name: form.name, phone: form.phone,
        vehicleType: form.vehicleType as Driver["vehicleType"],
        preferredVendor: form.preferredVendor,
        licenseNumber: form.licenseNumber,
        licenseExpiry: form.licenseExpiry || undefined,
        notes: form.notes,
        vettingStatus: "PENDING_REVIEW",
        isAvailable: true,
        updatedDate: new Date().toISOString(),
      }, { authMode: "apiKey" });
    }
    setForm({ ...empty }); setShowDialog(false); setEditTarget(null); setSaving(false);
  }

  async function updateVetting(id: string, vettingStatus: VettingStatus) {
    await client.models.Driver.update({ id, vettingStatus, updatedDate: new Date().toISOString() }, { authMode: "apiKey" });
  }

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700 }}>Drivers</h2>
          <p style={{ color: "var(--muted-foreground)", fontSize: 13, marginTop: 4 }}>Manage and vet your driver network.</p>
        </div>
        {!loading && drivers.length > 0 && (
          <button onClick={openAdd} style={primaryBtn}><Plus size={16} /> Add Driver</button>
        )}
      </div>

      {loading ? (
        <div style={{ color: "var(--muted-foreground)", padding: 40, textAlign: "center" }}>Loading…</div>
      ) : drivers.length === 0 ? (
        <EmptyState icon={<User size={36} strokeWidth={1.5} />} title="No drivers yet" sub="Add your first driver to get started." onAdd={openAdd} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {drivers.map((d) => {
            const v = (d.vettingStatus ?? "PENDING_REVIEW") as VettingStatus;
            const cfg = VETTING_CFG[v];
            return (
              <motion.div key={d.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <p style={{ fontWeight: 600, fontSize: 15 }}>{d.name}</p>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted-foreground)" }}>{d.phone}</p>
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Vehicle type</p>
                  <p style={{ fontSize: 13 }}>{d.vehicleType ? VEHICLE_LABELS[d.vehicleType] : "—"}</p>
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Vendor</p>
                  <p style={{ fontSize: 13 }}>{d.preferredVendor || "—"}</p>
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>License expiry</p>
                  <p style={{ fontSize: 13, fontFamily: "var(--font-mono)" }}>{d.licenseExpiry || "—"}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, fontSize: 12, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}33` }}>
                    {cfg.icon} {cfg.label}
                  </span>
                  <select value={v} onChange={(e) => updateVetting(d.id, e.target.value as VettingStatus)}
                    style={{ background: "var(--accent)", border: "1px solid var(--border)", color: "var(--foreground)", borderRadius: "var(--radius-sm)", padding: "4px 8px", fontSize: 12, cursor: "pointer", outline: "none" }}>
                    <option value="PENDING_REVIEW">Pending Review</option>
                    <option value="VETTED">Vetted</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                  <button onClick={() => openEdit(d)} aria-label="Edit driver" style={iconBtn}>
                    <Pencil size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showDialog && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDialog(false)}
              style={{ position: "fixed", inset: 0, zIndex: 200, background: "hsla(222,28%,4%,0.7)", backdropFilter: "blur(4px)" }} />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 201, width: "100%", maxWidth: 520, background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-elegant)" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17 }}>{editTarget ? "Edit Driver" : "Add Driver"}</h3>
                <button onClick={() => setShowDialog(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}><X size={18} /></button>
              </div>
              <form onSubmit={handleSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
                <Row2>
                  <Field label="Full Name *"><input required value={form.name} onChange={set("name")} style={inp} /></Field>
                  <Field label="Phone *"><input required value={form.phone} onChange={set("phone")} style={inp} /></Field>
                </Row2>
                <Row2>
                  <Field label="Vehicle Type">
                    <select value={form.vehicleType} onChange={set("vehicleType")} style={inp}>
                      {["AUTO","TROLLEY","TATA_ACE","SMALL_TRUCK","LARGE_TRUCK","OTHER"].map(v => <option key={v} value={v}>{VEHICLE_LABELS[v]}</option>)}
                    </select>
                  </Field>
                  <Field label="Preferred Vendor"><input value={form.preferredVendor} onChange={set("preferredVendor")} style={inp} /></Field>
                </Row2>
                <Row2>
                  <Field label="License Number"><input value={form.licenseNumber} onChange={set("licenseNumber")} style={inp} /></Field>
                  <Field label="License Expiry"><input type="date" value={form.licenseExpiry} onChange={set("licenseExpiry")} style={inp} /></Field>
                </Row2>
                <Field label="Notes"><textarea value={form.notes} onChange={set("notes")} rows={2} style={{ ...inp, resize: "vertical" }} /></Field>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                  <button type="button" onClick={() => setShowDialog(false)} style={ghostBtn}>Cancel</button>
                  <button type="submit" disabled={saving} style={primaryBtn}>{saving ? "Saving…" : editTarget ? "Save changes" : "Add Driver"}</button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ icon, title, sub, onAdd }: { icon: React.ReactNode; title: string; sub: string; onAdd: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <span style={{ color: "var(--muted-foreground)" }}>{icon}</span>
      <p style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>{title}</p>
      <p style={{ color: "var(--muted-foreground)", fontSize: 13 }}>{sub}</p>
      <button onClick={onAdd} style={primaryBtn}><Plus size={16} /> Add Driver</button>
    </div>
  );
}

function Row2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", gap: 12 }}>{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13, color: "var(--muted-foreground)", flex: 1 }}>{label}{children}</label>;
}

const inp: React.CSSProperties = { padding: "9px 12px", borderRadius: "var(--radius-md)", background: "var(--accent)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: 14, fontFamily: "var(--font-body)", outline: "none", width: "100%" };
const primaryBtn: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: "var(--radius-md)", background: "linear-gradient(135deg, var(--primary), var(--primary-end))", border: "none", color: "#fff", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 14, boxShadow: "0 0 16px var(--primary-glow)" };
const ghostBtn: React.CSSProperties = { padding: "9px 18px", borderRadius: "var(--radius-md)", background: "none", border: "1px solid var(--border)", color: "var(--muted-foreground)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 14 };
const iconBtn: React.CSSProperties = { background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--muted-foreground)", cursor: "pointer", padding: "5px 7px", display: "flex", alignItems: "center" };
