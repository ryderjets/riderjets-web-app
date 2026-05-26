import { useEffect, useState, useRef } from "react";
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

const empty = { name: "", phone: "+91 ", vehicleType: "TATA_ACE", preferredVendor: "", address: "", licenseNumber: "", licenseExpiry: "", notes: "" };

export default function Drivers() {
  const [drivers, setDrivers]   = useState<Driver[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Driver | null>(null);
  const [form, setForm]         = useState({ ...empty });
  const [saving, setSaving]     = useState(false);
  const licenseInputRef = useRef<HTMLInputElement | null>(null);

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
      address: d.address ?? "",
      licenseNumber: d.licenseNumber ?? "",
      licenseExpiry: normalizeDateForInput(d.licenseExpiry),
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
        address: form.address,
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
        address: form.address,
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

  function normalizeDateForInput(v?: string | null): string {
    if (!v) return "";
    // Accept YYYY-MM-DD as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    // Accept YYYY-MMM-DD like '2026-May-25'
    const m = /^([0-9]{4})-([A-Za-z]{3})-([0-9]{2})$/.exec(v);
    if (m) {
      const months: Record<string,string> = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
      const mon = months[m[2]];
      if (mon) return `${m[1]}-${mon}-${m[3]}`;
    }
    // Fallback: try Date parse and format
    const dt = new Date(v);
    if (!isNaN(dt.getTime())) {
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    return "";
  }

  function formatDateForDisplay(v?: string | null): string {
    if (!v) return "";
    // If already in YYYY-MMM-DD (e.g., 2026-May-25)
    const m1 = /^([0-9]{4})-([A-Za-z]{3})-([0-9]{2})$/.exec(v);
    if (m1) return `${m1[1]}-${m1[2]}-${m1[3]}`;
    // If in YYYY-MM-DD, convert month number to short name
    const m2 = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(v);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if (m2) {
      const y = m2[1]; const mm = parseInt(m2[2], 10); const dd = m2[3];
      const mon = months[mm - 1] ?? m2[2];
      return `${y}-${mon}-${dd}`;
    }
    // Fallback: try Date parse
    const dt = new Date(v);
    if (!isNaN(dt.getTime())) {
      const y = dt.getFullYear(); const mon = months[dt.getMonth()]; const dd = String(dt.getDate()).padStart(2, '0');
      return `${y}-${mon}-${dd}`;
    }
    return v;
  }

  const dialogInitial = editTarget ? { opacity: 0, y: -10 } : { opacity: 0, scale: 0.96, y: 16 };
  const dialogAnimate = editTarget ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1, y: 0 };
  const dialogExit = editTarget ? { opacity: 0, y: -10 } : { opacity: 0, scale: 0.96 };
  const dialogStyle = editTarget
    ? { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 201, width: "100%", maxWidth: "100%", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 0, boxShadow: "var(--shadow-elegant)", overflowY: "auto" }
    : { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 201, width: "100%", maxWidth: 520, background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-elegant)" };

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
                <div style={{ flex: 1, minWidth: 160 }}>
                  <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Address</p>
                  <p style={{ fontSize: 13 }}>{d.address || "—"}</p>
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Preferred routes</p>
                  <p style={{ fontSize: 13 }}>{d.preferredVendor || "—"}</p>
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>License expiry</p>
                  <p style={{ fontSize: 13, fontFamily: "var(--font-mono)" }}>{formatDateForDisplay(d.licenseExpiry) || "—"}</p>
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
            <motion.div initial={dialogInitial} animate={dialogAnimate} exit={dialogExit} style={dialogStyle as any}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17 }}>{editTarget ? "Edit Driver" : "Add Driver"}</h3>
                <button onClick={() => setShowDialog(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}><X size={18} /></button>
              </div>
              {editTarget ? (
                <div style={{ display: 'flex', gap: 20, padding: 24 }}>
                  <div style={{ width: 300, maxHeight: '70vh', overflowY: 'auto', borderRight: '1px solid var(--border)', paddingRight: 12 }}>
                    {drivers.map((dd) => (
                      <div key={dd.id} onClick={() => openEdit(dd)}
                        style={{ padding: 10, borderRadius: 8, cursor: 'pointer', marginBottom: 8, background: editTarget?.id === dd.id ? 'rgba(0,128,255,0.06)' : 'transparent', border: editTarget?.id === dd.id ? '1px solid var(--accent)' : '1px solid transparent' }}>
                        <div style={{ fontWeight: 600 }}>{dd.name}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted-foreground)' }}>{dd.phone}</div>
                        <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 6 }}>{formatDateForDisplay(dd.licenseExpiry) || '—'}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ flex: 1 }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                        <Field label="Address"><input value={form.address} onChange={set("address")} style={inp} /></Field>
                      </Row2>
                      <Row2>
                        <Field label="Preferred routes"><input value={form.preferredVendor} onChange={set("preferredVendor")} style={inp} /></Field>
                      </Row2>
                      <Row2>
                        <Field label="License Number"><input value={form.licenseNumber} onChange={set("licenseNumber")} style={inp} /></Field>
                        <Field label="License Expiry">
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input ref={licenseInputRef} type="date" value={form.licenseExpiry} onChange={set("licenseExpiry")} style={{ ...inp, flex: 1 }} />
                            <button type="button" onClick={() => { licenseInputRef.current?.showPicker?.(); licenseInputRef.current?.focus(); }}
                              aria-label="Open date picker" style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', cursor: 'pointer' }}>📅</button>
                          </div>
                        </Field>
                      </Row2>
                      <Field label="Notes"><textarea value={form.notes} onChange={set("notes")} rows={2} style={{ ...inp, resize: 'vertical' }} /></Field>
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                        <button type="button" onClick={() => setShowDialog(false)} style={ghostBtn}>Cancel</button>
                        <button type="submit" disabled={saving} style={primaryBtn}>{saving ? 'Saving…' : editTarget ? 'Save changes' : 'Add Driver'}</button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                        <Field label="Address"><input value={form.address} onChange={set("address")} style={inp} /></Field>
                      </Row2>
                      <Row2>
                        <Field label="Preferred routes"><input value={form.preferredVendor} onChange={set("preferredVendor")} style={inp} /></Field>
                      </Row2>
                  <Row2>
                    <Field label="License Number"><input value={form.licenseNumber} onChange={set("licenseNumber")} style={inp} /></Field>
                    <Field label="License Expiry">
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input ref={licenseInputRef} type="date" value={form.licenseExpiry} onChange={set("licenseExpiry")} style={{ ...inp, flex: 1 }} />
                        <button type="button" onClick={() => { licenseInputRef.current?.showPicker?.(); licenseInputRef.current?.focus(); }}
                          aria-label="Open date picker" style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', cursor: 'pointer' }}>📅</button>
                      </div>
                    </Field>
                  </Row2>
                  <Field label="Notes"><textarea value={form.notes} onChange={set("notes")} rows={2} style={{ ...inp, resize: 'vertical' }} /></Field>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                    <button type="button" onClick={() => setShowDialog(false)} style={ghostBtn}>Cancel</button>
                    <button type="submit" disabled={saving} style={primaryBtn}>{saving ? 'Saving…' : editTarget ? 'Save changes' : 'Add Driver'}</button>
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
