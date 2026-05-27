import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Clock, ShieldCheck, ShieldAlert, Truck, Pencil } from "lucide-react";
import type { Schema } from "../../amplify/data/resource";

const client = generateClient<Schema>();
type Vehicle = Schema["Vehicle"]["type"];
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

const empty = { vehicleNumber: "", type: "TATA_ACE", make: "", model: "", capacityKg: "", truckSizeFt: "", rcNumber: "", insuranceExpiry: "", fitnessExpiry: "" };

export default function Vehicles() {
  const [vehicles, setVehicles]     = useState<Vehicle[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Vehicle | null>(null);
  const [form, setForm]             = useState({ ...empty });
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    const sub = client.models.Vehicle.observeQuery({ authMode: "apiKey" }).subscribe({
      next: (d) => { setVehicles([...d.items]); setLoading(false); },
    });
    return () => sub.unsubscribe();
  }, []);

  function openAdd() {
    setEditTarget(null);
    setForm({ ...empty });
    setShowDialog(true);
  }

  function openEdit(v: Vehicle) {
    setEditTarget(v);
    setForm({
      vehicleNumber: v.vehicleNumber,
      type: v.type ?? "TATA_ACE",
      make: v.make ?? "",
      model: v.model ?? "",
      capacityKg: v.capacityKg?.toString() ?? "",
      truckSizeFt: v.truckSizeFt?.toString() ?? "",
      rcNumber: v.rcNumber ?? "",
      insuranceExpiry: v.insuranceExpiry ?? "",
      fitnessExpiry: v.fitnessExpiry ?? "",
    });
    setShowDialog(true);
  }

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((v) => ({ ...v, [f]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const payload = {
      vehicleNumber: form.vehicleNumber.toUpperCase(),
      type: form.type as Vehicle["type"],
      make: form.make, model: form.model,
      capacityKg: form.capacityKg ? parseFloat(form.capacityKg) : undefined,
      truckSizeFt: form.truckSizeFt ? parseInt(form.truckSizeFt) : undefined,
      rcNumber: form.rcNumber,
      insuranceExpiry: form.insuranceExpiry || undefined,
      fitnessExpiry: form.fitnessExpiry || undefined,
      updatedDate: new Date().toISOString(),
    };
    if (editTarget) {
      await client.models.Vehicle.update({ id: editTarget.id, ...payload }, { authMode: "apiKey" });
    } else {
      await client.models.Vehicle.create({ ...payload, vettingStatus: "PENDING_REVIEW" }, { authMode: "apiKey" });
    }
    setForm({ ...empty }); setShowDialog(false); setEditTarget(null); setSaving(false);
  }

  async function updateVetting(id: string, vettingStatus: VettingStatus) {
    await client.models.Vehicle.update({ id, vettingStatus, updatedDate: new Date().toISOString() }, { authMode: "apiKey" });
  }

  const dialogInitial = editTarget ? { opacity: 0, y: -10 } : { opacity: 0, scale: 0.96, y: 16 };
  const dialogAnimate = editTarget ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1, y: 0 };
  const dialogExit = editTarget ? { opacity: 0, y: -10 } : { opacity: 0, scale: 0.96 };
  const dialogStyle = editTarget
    ? { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 201, width: "100%", maxWidth: "100%", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 0, boxShadow: "var(--shadow-elegant)", overflowY: "auto" }
    : { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 201, width: "100%", maxWidth: 560, background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-elegant)", maxHeight: "90vh", overflowY: "auto" };

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700 }}>Vehicles</h2>
          <p style={{ color: "var(--muted-foreground)", fontSize: 13, marginTop: 4 }}>Manage and vet your vehicle fleet.</p>
        </div>
        {!loading && vehicles.length > 0 && (
          <button onClick={openAdd} style={primaryBtn}><Plus size={16} /> Add Vehicle</button>
        )}
      </div>

      {loading ? (
        <div style={{ color: "var(--muted-foreground)", padding: 40, textAlign: "center" }}>Loading…</div>
      ) : vehicles.length === 0 ? (
        <EmptyState icon={<Truck size={36} strokeWidth={1.5} />} title="No vehicles yet" sub="Add your first vehicle to get started." onAdd={openAdd} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {vehicles.map((v) => {
            const vs = (v.vettingStatus ?? "PENDING_REVIEW") as VettingStatus;
            const cfg = VETTING_CFG[vs];
            return (
              <motion.div key={v.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 15, color: "var(--primary)" }}>{v.vehicleNumber}</p>
                  <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{v.type ? VEHICLE_LABELS[v.type] : "—"}</p>
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Make / Model</p>
                  <p style={{ fontSize: 13 }}>{[v.make, v.model].filter(Boolean).join(" ") || "—"}</p>
                </div>
                <div style={{ flex: 1, minWidth: 100 }}>
                  <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Capacity</p>
                  <p style={{ fontSize: 13, fontFamily: "var(--font-mono)" }}>{v.capacityKg ? `${v.capacityKg} kg` : "—"}</p>
                </div>
                <div style={{ flex: 1, minWidth: 100 }}>
                  <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Size</p>
                  <p style={{ fontSize: 13, fontFamily: "var(--font-mono)" }}>{v.truckSizeFt ? `${v.truckSizeFt} ft` : "—"}</p>
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Insurance expiry</p>
                  <p style={{ fontSize: 13, fontFamily: "var(--font-mono)" }}>{v.insuranceExpiry || "—"}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, fontSize: 12, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}33` }}>
                    {cfg.icon} {cfg.label}
                  </span>
                  <select value={vs} onChange={(e) => updateVetting(v.id, e.target.value as VettingStatus)}
                    style={{ background: "var(--accent)", border: "1px solid var(--border)", color: "var(--foreground)", borderRadius: "var(--radius-sm)", padding: "4px 8px", fontSize: 12, cursor: "pointer", outline: "none" }}>
                    <option value="PENDING_REVIEW">Pending Review</option>
                    <option value="VETTED">Vetted</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                  <button onClick={() => openEdit(v)} aria-label="Edit vehicle" style={iconBtn}>
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
            <motion.div initial={dialogInitial} animate={dialogAnimate} exit={dialogExit} style={dialogStyle as any}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "var(--card)", zIndex: 1 }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17 }}>{editTarget ? "Edit Vehicle" : "Add Vehicle"}</h3>
                <button onClick={() => setShowDialog(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}><X size={18} /></button>
              </div>
              {editTarget ? (
                <div style={{ display: 'flex', gap: 20, padding: 24 }}>
                  <div style={{ width: 300, maxHeight: '70vh', overflowY: 'auto', borderRight: '1px solid var(--border)', paddingRight: 12 }}>
                    {vehicles.map((vv) => (
                      <div key={vv.id} onClick={() => openEdit(vv)}
                        style={{ padding: 10, borderRadius: 8, cursor: 'pointer', marginBottom: 8, background: editTarget?.id === vv.id ? 'rgba(0,128,255,0.06)' : 'transparent', border: editTarget?.id === vv.id ? '1px solid var(--accent)' : '1px solid transparent' }}>
                        <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>{vv.vehicleNumber}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{vv.type ? VEHICLE_LABELS[vv.type] : "—"}</div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>{[vv.make, vv.model].filter(Boolean).join(" ") || "—"}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ flex: 1 }}>
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <Row2>
                        <Field label="Vehicle Number *">
                          <input required value={form.vehicleNumber} onChange={set("vehicleNumber")} placeholder="e.g. MH12AB1234"
                            disabled={!!editTarget} style={{ ...inp, opacity: editTarget ? 0.6 : 1 }} />
                        </Field>
                        <Field label="Type">
                          <select value={form.type} onChange={set("type")} style={inp}>
                            {["AUTO","TROLLEY","TATA_ACE","SMALL_TRUCK","LARGE_TRUCK","OTHER"].map(t => <option key={t} value={t}>{VEHICLE_LABELS[t]}</option>)}
                          </select>
                        </Field>
                      </Row2>
                      <Row2>
                        <Field label="Make"><input value={form.make} onChange={set("make")} placeholder="e.g. Tata" style={inp} /></Field>
                        <Field label="Model"><input value={form.model} onChange={set("model")} placeholder="e.g. Ace Gold" style={inp} /></Field>
                      </Row2>
                      <Row2>
                        <Field label="Capacity (kg)"><input type="number" min="0" value={form.capacityKg} onChange={set("capacityKg")} style={inp} /></Field>
                        <Field label="Size (ft) *"><input required type="number" min="0" value={form.truckSizeFt} onChange={set("truckSizeFt")} style={inp} /></Field>
                      </Row2>
                      <Field label="RC Number"><input value={form.rcNumber} onChange={set("rcNumber")} style={inp} /></Field>
                      <Row2>
                        <Field label="Insurance Expiry"><input type="date" value={form.insuranceExpiry} onChange={set("insuranceExpiry")} style={inp} /></Field>
                        <Field label="Fitness Expiry"><input type="date" value={form.fitnessExpiry} onChange={set("fitnessExpiry")} style={inp} /></Field>
                      </Row2>
                      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                        <button type="button" onClick={() => setShowDialog(false)} style={ghostBtn}>Cancel</button>
                        <button type="submit" disabled={saving} style={primaryBtn}>{saving ? "Saving…" : editTarget ? "Save changes" : "Add Vehicle"}</button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
                  <Row2>
                    <Field label="Vehicle Number *">
                      <input required value={form.vehicleNumber} onChange={set("vehicleNumber")} placeholder="e.g. MH12AB1234"
                        disabled={!!editTarget} style={{ ...inp, opacity: editTarget ? 0.6 : 1 }} />
                    </Field>
                    <Field label="Type">
                      <select value={form.type} onChange={set("type")} style={inp}>
                        {["AUTO","TROLLEY","TATA_ACE","SMALL_TRUCK","LARGE_TRUCK","OTHER"].map(t => <option key={t} value={t}>{VEHICLE_LABELS[t]}</option>)}
                      </select>
                    </Field>
                  </Row2>
                  <Row2>
                    <Field label="Make"><input value={form.make} onChange={set("make")} placeholder="e.g. Tata" style={inp} /></Field>
                    <Field label="Model"><input value={form.model} onChange={set("model")} placeholder="e.g. Ace Gold" style={inp} /></Field>
                  </Row2>
                  <Row2>
                    <Field label="Capacity (kg)"><input type="number" min="0" value={form.capacityKg} onChange={set("capacityKg")} style={inp} /></Field>
                    <Field label="Size (ft) *"><input required type="number" min="0" value={form.truckSizeFt} onChange={set("truckSizeFt")} style={inp} /></Field>
                  </Row2>
                  <Field label="RC Number"><input value={form.rcNumber} onChange={set("rcNumber")} style={inp} /></Field>
                  <Row2>
                    <Field label="Insurance Expiry"><input type="date" value={form.insuranceExpiry} onChange={set("insuranceExpiry")} style={inp} /></Field>
                    <Field label="Fitness Expiry"><input type="date" value={form.fitnessExpiry} onChange={set("fitnessExpiry")} style={inp} /></Field>
                  </Row2>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                    <button type="button" onClick={() => setShowDialog(false)} style={ghostBtn}>Cancel</button>
                    <button type="submit" disabled={saving} style={primaryBtn}>{saving ? "Saving…" : editTarget ? "Save changes" : "Add Vehicle"}</button>
                  </div>
                </form>
              )}
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
      <button onClick={onAdd} style={primaryBtn}><Plus size={16} /> Add Vehicle</button>
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
