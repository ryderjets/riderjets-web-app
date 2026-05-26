import { X, Route, Truck, User, Building2, IndianRupee, Paperclip } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import { uploadFile, getFileUrl, listFiles, deleteFile } from "../../lib/storage";
import type { Schema } from "../../../amplify/data/resource";
import type { TripStatus } from "./StatusBadge";

const client = generateClient<Schema>();
type Trip    = Schema["Trip"]["type"];
type Driver  = Schema["Driver"]["type"];
type Vehicle = Schema["Vehicle"]["type"];

export interface TripInput {
  transactionDate: string;
  orderNumber:     string;
  vendor:          string;
  driverName:      string;
  driverPhone:     string;
  vehicleType:     "AUTO" | "TROLLEY" | "TATA_ACE" | "SMALL_TRUCK" | "LARGE_TRUCK" | "OTHER";
  vehicleNumber:   string;
  driverId:        string;
  vehicleId:       string;
  expense:         number;
  status:          TripStatus;
  notes:           string;
  podUrl:          string;
  podKind:         "UPLOAD" | "URL" | "NONE";
}

interface Props {
  open:     boolean;
  trip?:    Trip | null;
  onClose:  () => void;
  onSave:   (data: TripInput) => void;
}

const VEHICLE_LABELS: Record<string, string> = {
  AUTO: "Auto", TROLLEY: "Trolley", TATA_ACE: "Tata Ace",
  SMALL_TRUCK: "Small Truck", LARGE_TRUCK: "Large Truck", OTHER: "Other",
};

const STATUS_OPTIONS: { value: TripStatus; label: string }[] = [
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "PENDING",     label: "Pending Payment" },
  { value: "COMPLETED",   label: "Completed" },
  { value: "BLOCKED",     label: "Blocked" },
  { value: "ISSUES",      label: "Issues" },
  { value: "OTHER",       label: "Other" },
];

function getDefaultTransactionDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
}

const empty: TripInput = {
  transactionDate: getDefaultTransactionDate(),
  orderNumber: "", vendor: "", driverName: "", driverPhone: "",
  vehicleType: "TATA_ACE", vehicleNumber: "", driverId: "", vehicleId: "",
  expense: 0, status: "PENDING", notes: "", podUrl: "", podKind: "NONE",
};

export default function OrderSheet({ open, trip, onClose, onSave }: Props) {
  const [form, setForm]         = useState<TripInput>({ ...empty, orderNumber: "" });
  const [drivers, setDrivers]   = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fileLabel, setFileLabel] = useState<string>("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  function getFileLabelFromKey(key: string) {
    return key.split("/").pop() || key;
  }
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState<number>(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef              = useRef<HTMLInputElement | null>(null);

  // Auto-generate order number: YYMM-XXXX
  async function generateOrderNumber(): Promise<string> {
    const now = new Date();
    const yymm = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const { data } = await client.models.Trip.list({
      filter: { orderNumber: { beginsWith: yymm } },
      authMode: "apiKey",
    });
    const seq = (data.length + 1).toString().padStart(4, "0");
    return `${yymm}-${seq}`;
  }

  // Load vetted drivers + vehicles on open
  useEffect(() => {
    if (!open) return;
    client.models.Driver.list({ filter: { vettingStatus: { eq: "VETTED" } }, authMode: "apiKey" })
      .then(({ data }) => setDrivers(data));
    client.models.Vehicle.list({ filter: { vettingStatus: { eq: "VETTED" } }, authMode: "apiKey" })
      .then(({ data }) => setVehicles(data));
  }, [open]);

  useEffect(() => {
    if (trip) {
      setForm({
        transactionDate: trip.transactionDate ?? empty.transactionDate,
        orderNumber:     trip.orderNumber,
        vendor:          trip.vendor ?? "",
        driverName:      trip.driverName ?? "",
        driverPhone:     trip.driverPhone ?? "",
        vehicleType:     (trip.vehicleType ?? "TATA_ACE") as TripInput["vehicleType"],
        vehicleNumber:   trip.vehicleNumber ?? "",
        driverId:        trip.driverId ?? "",
        vehicleId:       trip.vehicleId ?? "",
        expense:         trip.expense ?? 0,
        status:          (trip.status ?? "PENDING") as TripStatus,
        notes:           trip.notes ?? "",
        podUrl:          trip.podUrl ?? "",
        podKind:         (trip.podKind ?? "NONE") as TripInput["podKind"],
      });
      setFileLabel(trip.podKind === "UPLOAD" && trip.podUrl ? getFileLabelFromKey(trip.podUrl) : "");
      setPreviewUrl(null);
      setGalleryUrls([]);
      setShowPreview(false);
      setUploadSuccess(false);
      setUploadError(null);

      if (trip.podKind === "UPLOAD" && trip.podUrl) {
        (async () => {
          try {
            const res: any = await getFileUrl(trip.podUrl);
            let url: string | null = null;
            if (typeof res === "string") url = res;
            else if (res?.url) url = String(res.url);
            else if (res?.signedUrl) url = String(res.signedUrl);
            else if (res?.presignedUrl) url = String(res.presignedUrl);
            else if (res?.getUrl) url = String(res.getUrl);
            setPreviewUrl(url);
          } catch (err) {
            console.debug("Could not get preview URL for existing upload", err);
          }
        })();
      }
    } else {
      // New order — generate number async
      const base = { ...empty };
      setForm(base);
      setFileLabel("");
      setPreviewUrl(null);
      setGalleryUrls([]);
      setShowPreview(false);
      setUploadSuccess(false);
      setUploadError(null);
      generateOrderNumber().then((n) => setForm((f) => ({ ...f, orderNumber: n })));
    }
  }, [trip, open]);

  const set = (field: keyof TripInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: field === "expense" ? parseFloat(e.target.value) || 0 : e.target.value }));

  function pickDriver(d: Driver) {
    setForm((f) => ({
      ...f,
      driverId:    d.id,
      driverName:  d.name,
      driverPhone: d.phone,
      vendor:      d.preferredVendor ?? f.vendor,
      vehicleType: (d.vehicleType ?? f.vehicleType) as TripInput["vehicleType"],
    }));
  }

  function pickVehicle(v: Vehicle) {
    setForm((f) => ({
      ...f,
      vehicleId:     v.id,
      vehicleNumber: v.vehicleNumber,
      vehicleType:   (v.type ?? f.vehicleType) as TripInput["vehicleType"],
    }));
  }

  async function openGallery() {
    setShowPreview(true);
    try {
      // Determine folder prefix to list files
      const folder = (() => {
        const key = form.podUrl || trip?.podUrl || '';
        if (!key) return '';
        const parts = key.split('/');
        parts.pop();
        return parts.join('/') + '/';
      })();

      const keys: string[] = [];
      if (folder) {
        try {
          const res: any = await listFiles(folder);
          // res may have .results or .items or be array
          const items = Array.isArray(res) ? res : (res?.results ?? res?.items ?? res?.files ?? []);
          for (const it of items) {
            const k = it?.path ?? it?.key ?? it?.Key ?? it?.name ?? it?.filename ?? null;
            if (k) keys.push(k);
          }
        } catch (err) {
          console.debug('listFiles failed', err);
        }
      }

      // Ensure current podUrl is included
      const currentKey = form.podUrl || trip?.podUrl || '';
      if (currentKey && !keys.includes(currentKey)) keys.unshift(currentKey);

      // Fetch preview URLs
      const urls: string[] = [];
      for (const k of keys) {
        try {
          const r: any = await getFileUrl(k);
          let u: string | null = null;
          if (typeof r === 'string') u = r;
          else if (r?.url) u = String(r.url);
          else if (r?.signedUrl) u = String(r.signedUrl);
          else if (r?.presignedUrl) u = String(r.presignedUrl);
          else if (r?.getUrl) u = String(r.getUrl);
          if (u) urls.push(u);
        } catch (err) {
          console.debug('getFileUrl failed for', k, err);
        }
      }

      setGalleryUrls(urls);
      // set index to current file if present
      const idx = urls.findIndex(u => u === previewUrl || u.includes((currentKey || '').split('/').pop() ?? ''));
      setGalleryIndex(idx >= 0 ? idx : 0);
    } catch (e) {
      console.error('openGallery error', e);
      setGalleryUrls(previewUrl ? [previewUrl] : []);
      setGalleryIndex(0);
    }
  }

  async function deleteAttachment() {
    const key = form.podUrl || trip?.podUrl || "";
    if (!key) return;
    setDeleting(true);
    setUploadError(null);
    try {
      await deleteFile(key);
      setForm((f) => ({ ...f, podUrl: "", podKind: "NONE" }));
      setFileLabel("");
      setPreviewUrl(null);
      setGalleryUrls([]);
      setShowPreview(false);
      setUploadSuccess(false);
    } catch (err) {
      console.error("Delete failed", err);
      setUploadError("Unable to delete attachment. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  function prevInGallery() {
    setGalleryIndex((i) => (galleryUrls.length ? (i - 1 + galleryUrls.length) % galleryUrls.length : 0));
  }

  function nextInGallery() {
    setGalleryIndex((i) => (galleryUrls.length ? (i + 1) % galleryUrls.length : 0));
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
            style={{ position: "fixed", inset: 0, zIndex: 200, background: "hsla(222,28%,4%,0.6)", backdropFilter: "blur(4px)" }} />

          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 201, width: "100%", maxWidth: 560, background: "var(--card)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", boxShadow: "-8px 0 40px hsla(222,28%,4%,0.5)" }}>

            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>{trip ? "Edit Order" : "New Order"}</h2>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--primary)", marginTop: 2, display: "block" }}>
                  {form.orderNumber || "Generating…"}
                </span>
              </div>
              <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: 4 }}><X size={20} /></button>
            </div>

            {/* Body */}
            <form id="trip-form" onSubmit={(e) => { e.preventDefault(); onSave(form); }} style={{ flex: 1, overflowY: "auto", padding: 24 }}>

              {/* Trip details */}
              <Sec icon={<Route size={16} />} label="Trip Details">
                <Fld label="Transaction Date *"><input required type="date" value={form.transactionDate} onChange={set("transactionDate")} style={inp} /></Fld>
                <Fld label="Status">
                  <select value={form.status} onChange={set("status")} style={inp}>
                    {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Fld>
              </Sec>

              {/* Driver picker */}
              <Sec icon={<User size={16} />} label="Driver">
                {drivers.length > 0 && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                    {drivers.map((d) => (
                      <button key={d.id} type="button" onClick={() => pickDriver(d)}
                        style={{ padding: "6px 12px", borderRadius: "var(--radius-md)", border: `1px solid ${form.driverId === d.id ? "var(--primary)" : "var(--border)"}`, background: form.driverId === d.id ? "hsla(243,75%,62%,0.12)" : "var(--accent)", color: form.driverId === d.id ? "var(--primary)" : "var(--foreground)", cursor: "pointer", fontSize: 13 }}>
                        {d.name}
                      </button>
                    ))}
                  </div>
                )}
                <Row2>
                  <Fld label="Driver Name"><input value={form.driverName} onChange={set("driverName")} style={inp} /></Fld>
                  <Fld label="Phone"><input type="tel" value={form.driverPhone} onChange={set("driverPhone")} style={inp} /></Fld>
                </Row2>
              </Sec>

              {/* Vehicle picker */}
              <Sec icon={<Truck size={16} />} label="Vehicle">
                {vehicles.length > 0 && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                    {vehicles.map((v) => (
                      <button key={v.id} type="button" onClick={() => pickVehicle(v)}
                        style={{ padding: "6px 12px", borderRadius: "var(--radius-md)", border: `1px solid ${form.vehicleId === v.id ? "var(--primary)" : "var(--border)"}`, background: form.vehicleId === v.id ? "hsla(243,75%,62%,0.12)" : "var(--accent)", color: form.vehicleId === v.id ? "var(--primary)" : "var(--foreground)", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-mono)" }}>
                        {v.vehicleNumber}
                      </button>
                    ))}
                  </div>
                )}
                {/* Auto-pulled vehicle details */}
                {form.vehicleId && (() => {
                  const v = vehicles.find(v => v.id === form.vehicleId);
                  if (!v) return null;
                  return (
                    <div style={{ display: "flex", gap: 12, padding: "10px 14px", borderRadius: "var(--radius-md)", background: "hsla(243,75%,62%,0.06)", border: "1px solid hsla(243,75%,62%,0.2)", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Type: <strong style={{ color: "var(--foreground)" }}>{VEHICLE_LABELS[v.type ?? ""] ?? "—"}</strong></span>
                      <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Capacity: <strong style={{ color: "var(--foreground)" }}>{v.capacityKg ? `${v.capacityKg} kg` : "—"}</strong></span>
                      <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Size: <strong style={{ color: "var(--foreground)" }}>{v.truckSizeFt ? `${v.truckSizeFt} ft` : "—"}</strong></span>
                    </div>
                  );
                })()}
                <Fld label="Vehicle Number">
                  <input value={form.vehicleNumber} onChange={set("vehicleNumber")} placeholder="Enter manually or pick above" style={inp} />
                </Fld>
              </Sec>

              {/* Vendor */}
              <Sec icon={<Building2 size={16} />} label="Vendor">
                <Fld label="Vendor Name"><input value={form.vendor} onChange={set("vendor")} style={inp} /></Fld>
              </Sec>

              {/* Expense */}
              <Sec icon={<IndianRupee size={16} />} label="Expense">
                <Fld label="Amount (₹)"><input type="number" min="0" step="0.01" value={form.expense || ""} onChange={set("expense")} placeholder="0.00" style={inp} /></Fld>
              </Sec>

              {/* PoD */}
              <Sec icon={<Paperclip size={16} />} label="Proof of Delivery">
                <div style={{ display: "flex", gap: 0, marginBottom: 12, borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--border)" }}>
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    style={{ flex: 1, padding: "7px", background: "hsla(243,75%,62%,0.15)", border: "none", color: "var(--primary)", cursor: uploading ? "not-allowed" : "pointer", fontSize: 13 }}>
                    {uploading ? "Uploading…" : "Upload File"}
                  </button>
                </div>
                <Fld label="File">
                  <input ref={fileInputRef} type="file" accept="image/*,.pdf" capture="environment" onChange={async (e) => {
                    const f = e.target.files?.[0];
                    setUploadError(null);
                    setUploadSuccess(false);
                    if (!f) return;
                    const selectedFileName = f.name;
                    setFileLabel(selectedFileName);
                    const MAX = 10 * 1024 * 1024; // 10 MB
                    if (f.size > MAX) {
                      setUploadError("File too large. Please upload a file up to 10 MB.");
                      return;
                    }

                    const orderKey = trip?.id || form.orderNumber || `order-${Date.now()}`;
                    const safeOrderKey = orderKey.replace(/[^a-zA-Z0-9_-]/g, "_");
                    const safeFileName = selectedFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
                    const fileKey = `pods/${safeOrderKey}/${Date.now()}_${safeFileName}`;

                    setUploading(true);
                    try {
                      await uploadFile(fileKey, f);
                      // store key in form and mark as upload
                      setForm((v) => ({ ...v, podUrl: fileKey, podKind: "UPLOAD" }));
                      // fetch a signed URL for preview
                      try {
                        const urlRes: any = await getFileUrl(fileKey);
                        let url: string | null = null;
                        if (typeof urlRes === 'string') url = urlRes;
                        else if (urlRes?.url) url = String(urlRes.url);
                        else if (urlRes?.signedUrl) url = String(urlRes.signedUrl);
                        else if (urlRes?.presignedUrl) url = String(urlRes.presignedUrl);
                        else if (urlRes?.getUrl) url = String(urlRes.getUrl);
                        setPreviewUrl(url);
                      } catch (err) {
                        // Non-fatal: preview may not be available, still mark success
                        console.debug("Could not get preview URL", err);
                        setPreviewUrl(null);
                      }
                      setUploadSuccess(true);
                    } catch (uploadErr) {
                      console.error("Upload failed", uploadErr);
                      setUploadError(`Upload failed for ${selectedFileName}. Please try again.`);
                    } finally {
                      setUploading(false);
                    }
                  }} style={{ display: "none" }} />
                  <div style={{ ...inp, padding: "12px", minHeight: 44, display: "flex", alignItems: "center", color: fileLabel ? "var(--foreground)" : "var(--muted-foreground)" }}>
                    {fileLabel || "Choose a file by clicking Upload File above."}
                  </div>
                  {uploadError ? <div style={{ marginTop: 6, color: "hsl(0,80%,50%)", fontSize: 13 }}>{uploadError}</div> : null}
                  {uploading ? <div style={{ marginTop: 6, color: "var(--muted-foreground)", fontSize: 13 }}>Uploading file…</div> : null}
                  {deleting ? <div style={{ marginTop: 6, color: "var(--muted-foreground)", fontSize: 13 }}>Deleting attachment…</div> : null}
                  {uploadSuccess ? <div style={{ marginTop: 6, color: "hsl(140,60%,35%)", fontSize: 13 }}>File added to the Order</div> : null}
                  {previewUrl ? (
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img src={previewUrl} alt="preview" onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(previewUrl, '_blank', 'noopener,noreferrer'); }} style={{ height: 80, cursor: "pointer", borderRadius: 6, objectFit: "cover" }} />
                        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteAttachment(); }} aria-label="Delete attachment"
                          style={{ position: 'absolute', top: -8, right: -8, width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', cursor: deleting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <X size={14} />
                        </button>
                      </div>
                      <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); fileInputRef.current?.click(); }} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', cursor: 'pointer' }}>Replace</button>
                    </div>
                  ) : null}
                </Fld>
              </Sec>

              {/* Preview modal */}
              <AnimatePresence>
                {showPreview && galleryUrls.length > 0 && (
                  <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPreview(false)}
                      style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.6)" }} />
                    <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }}
                      style={{ position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)", zIndex: 301, maxWidth: "90%", maxHeight: "90%", background: "var(--card)", padding: 12, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ position: 'absolute', right: 12, top: 12 }}>
                        <button onClick={() => setShowPreview(false)} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button type="button" onClick={() => prevInGallery()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }} aria-label="Previous">◀</button>
                        <div style={{ maxHeight: '80vh', overflow: 'auto' }}>
                          {galleryUrls[galleryIndex].toLowerCase().endsWith('.pdf') ? (
                            <iframe src={galleryUrls[galleryIndex]} title="preview" style={{ width: '80vw', height: '80vh', border: 'none' }} />
                          ) : (
                            <img src={galleryUrls[galleryIndex]} alt={`preview-${galleryIndex}`} style={{ maxWidth: '80vw', maxHeight: '80vh', display: 'block' }} />
                          )}
                        </div>
                        <button type="button" onClick={() => nextInGallery()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }} aria-label="Next">▶</button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* Notes */}
              <Sec icon={<Paperclip size={16} />} label="Notes">
                <textarea value={form.notes} onChange={set("notes")} placeholder="Special instructions…" rows={3} style={{ ...inp, resize: "vertical", fontFamily: "var(--font-body)" }} />
              </Sec>

            </form>

            {/* Footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={onClose} style={ghostBtn}>Cancel</button>
              <button type="submit" form="trip-form" style={primaryBtn}>{trip ? "Save changes" : "Create order"}</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Sec({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, color: "var(--muted-foreground)" }}>
        {icon}<span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
    </div>
  );
}
function Row2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", gap: 12 }}>{children}</div>;
}
function Fld({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13, color: "var(--muted-foreground)", flex: 1 }}>{label}{children}</label>;
}

const inp: React.CSSProperties = { padding: "9px 12px", borderRadius: "var(--radius-md)", background: "var(--accent)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: 14, fontFamily: "var(--font-body)", outline: "none", width: "100%" };
const primaryBtn: React.CSSProperties = { padding: "9px 20px", borderRadius: "var(--radius-md)", background: "linear-gradient(135deg, var(--primary), var(--primary-end))", border: "none", color: "#fff", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 14, boxShadow: "0 0 16px var(--primary-glow)" };
const ghostBtn: React.CSSProperties = { padding: "9px 18px", borderRadius: "var(--radius-md)", background: "none", border: "1px solid var(--border)", color: "var(--muted-foreground)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 14 };
