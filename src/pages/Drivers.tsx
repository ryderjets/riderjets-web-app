import { useEffect, useState, useRef } from "react";
import { generateClient } from "aws-amplify/data";
import { uploadFile, getFileUrl } from "../lib/storage";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.js?url";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Clock, ShieldCheck, ShieldAlert, User, Pencil } from "lucide-react";
import type { Schema } from "../../amplify/data/resource";

GlobalWorkerOptions.workerSrc = pdfWorker;

const client = generateClient<Schema>();
type Driver = Schema["Driver"]["type"];
type VettingStatus = "PENDING_REVIEW" | "VETTED" | "SUSPENDED" | "INSURANCE_EXPIRED" | "LICENSE_EXPIRED";

const VETTING_CFG: Record<VettingStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PENDING_REVIEW: { label: "Pending Review", color: "var(--status-pending)",   bg: "hsla(38,92%,52%,0.12)",  icon: <Clock size={12} /> },
  VETTED:         { label: "Vetted",          color: "var(--status-delivered)", bg: "hsla(160,60%,45%,0.12)", icon: <ShieldCheck size={12} /> },
  SUSPENDED:      { label: "Suspended",       color: "var(--status-blocked)",   bg: "hsla(0,72%,56%,0.12)",   icon: <ShieldAlert size={12} /> },
  INSURANCE_EXPIRED: { label: "Insurance Expired", color: "var(--status-blocked)", bg: "hsla(0,72%,56%,0.12)", icon: <ShieldAlert size={12} /> },
  LICENSE_EXPIRED:   { label: "License Expired", color: "var(--status-blocked)", bg: "hsla(0,72%,56%,0.12)", icon: <ShieldAlert size={12} /> },
};

const VEHICLE_LABELS: Record<string, string> = {
  AUTO: "Auto", TROLLEY: "Trolley", TATA_ACE: "Tata Ace",
  SMALL_TRUCK: "Small Truck", LARGE_TRUCK: "Large Truck", OTHER: "Other",
};

function formatPhoneInput(val: string): string {
  if (!val) return "";
  if (val === "+") return val;

  if (val.length === 1 && /\d/.test(val)) {
    val = "+91 " + val;
  }

  let cc = "";
  let rest = "";
  const spaceMatch = val.match(/^(\+\d+)\s+(.*)$/);

  if (spaceMatch) {
    cc = spaceMatch[1];
    rest = spaceMatch[2];
  } else if (val.startsWith('+')) {
    const clean = val.replace(/[^\d+]/g, '');
    if (clean.startsWith('+91') && clean.length > 3) {
      cc = "+91"; rest = clean.slice(3);
    } else if (clean.startsWith('+1') && clean.length > 2) {
      cc = "+1"; rest = clean.slice(2);
    } else if (clean.length > 4) {
      cc = clean.slice(0, 4); rest = clean.slice(4);
    } else {
      cc = clean; rest = "";
    }
  } else {
    const digitsOnly = val.replace(/\D/g, '');
    if (digitsOnly.length > 0) {
      cc = "+91"; rest = digitsOnly;
    } else {
      cc = val.replace(/[^\d+]/g, ''); rest = "";
    }
  }

  const digits = rest.replace(/\D/g, '').slice(0, 10);
  if (digits.length === 0) return cc + (val.endsWith(' ') ? ' ' : '');

  let local = digits;
  if (digits.length > 4 && digits.length <= 7) {
    local = `${digits.slice(0, 4)}-${digits.slice(4)}`;
  } else if (digits.length > 7) {
    local = `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return `${cc} ${local}`;
}

const empty = { name: "", phone: "", vehicleType: "TATA_ACE", preferredVendor: "", address: "", aadharNumber: "", aadharUrl: "", licenseNumber: "", licenseAttachmentUrl: "", licenseExpiry: "", panNumber: "", panUrl: "", notes: "" };

export default function Drivers() {
  const [drivers, setDrivers]   = useState<Driver[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Driver | null>(null);
  const [form, setForm]         = useState({ ...empty });
  const [initialForm, setInitialForm] = useState({ ...empty });
  const [saving, setSaving]     = useState(false);
  const licenseInputRef = useRef<HTMLInputElement | null>(null);

  // File input refs
  const aadharInputRef = useRef<HTMLInputElement | null>(null);
  const licenseFileInputRef = useRef<HTMLInputElement | null>(null);
  const panInputRef = useRef<HTMLInputElement | null>(null);

  // Attachment states
  const [aadharLabel, setAadharLabel] = useState<string>("");
  const [aadharUploading, setAadharUploading] = useState(false);
  const [aadharPreviewUrl, setAadharPreviewUrl] = useState<string | null>(null);
  const [aadharThumbnail, setAadharThumbnail] = useState<string | null>(null);

  const [licenseFileLabel, setLicenseFileLabel] = useState<string>("");
  const [licenseUploading, setLicenseUploading] = useState(false);
  const [licensePreviewUrl, setLicensePreviewUrl] = useState<string | null>(null);
  const [licenseThumbnail, setLicenseThumbnail] = useState<string | null>(null);

  const [panLabel, setPanLabel] = useState<string>("");
  const [panUploading, setPanUploading] = useState(false);
  const [panPreviewUrl, setPanPreviewUrl] = useState<string | null>(null);
  const [panThumbnail, setPanThumbnail] = useState<string | null>(null);

  const [uploadStatusMessage, setUploadStatusMessage] = useState<string>("");
  const [uploadStatusType, setUploadStatusType] = useState<"success" | "error" | "info">("info");
  const uploadStatusTimer = useRef<number | null>(null);

  const [toastMessage, setToastMessage] = useState<string>("");
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (uploadStatusTimer.current) window.clearTimeout(uploadStatusTimer.current);
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  function getErrorMessage(err: unknown) {
    if (!err) return "Unknown error";
    if (typeof err === "string") return err;
    if (err instanceof Error) return err.message;
    try { return JSON.stringify(err); } catch { return "Unknown error"; }
  }

  function showUploadStatus(message: string, type: "success" | "error" | "info" = "success") {
    setUploadStatusMessage(message);
    setUploadStatusType(type);
    if (uploadStatusTimer.current) window.clearTimeout(uploadStatusTimer.current);
    uploadStatusTimer.current = window.setTimeout(() => setUploadStatusMessage(""), 3000);
  }

  function showToast(message: string) {
    setToastMessage(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMessage(""), 5000);
  }

  function isPdfKey(path?: string | null): boolean {
    return !!path && path.toLowerCase().endsWith(".pdf");
  }

  async function loadPdfThumbnail(url: string): Promise<string | null> {
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`PDF fetch failed: ${resp.status}`);
      const array = await resp.arrayBuffer();
      const pdf = await getDocument({ data: array }).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      const scale = Math.min(1, 150 / viewport.width) || 1;
      const renderViewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = renderViewport.width;
      canvas.height = renderViewport.height;
      const context = canvas.getContext("2d");
      if (!context) return null;
      await page.render({ canvasContext: context, viewport: renderViewport }).promise;
      return canvas.toDataURL("image/png");
    } catch (err) {
      console.debug("PDF thumbnail generation failed", err);
      return null;
    }
  }

  async function setAttachmentPreview(key: string, url: string | null, setPreviewUrl: (value: string | null) => void, setThumbnail: (value: string | null) => void) {
    setPreviewUrl(url);
    if (url && isPdfKey(key)) {
      const thumb = await loadPdfThumbnail(url);
      setThumbnail(thumb);
    } else {
      setThumbnail(url);
    }
  }

  useEffect(() => {
    const sub = client.models.Driver.observeQuery({ authMode: "apiKey" }).subscribe({
      next: (d) => { 
        const todayStr = new Date().toISOString().split("T")[0];
        const updatedItems = d.items.map(item => {
          if (item.vettingStatus === 'VETTED' && item.licenseExpiry && item.licenseExpiry < todayStr) {
             client.models.Driver.update({ id: item.id, vettingStatus: "LICENSE_EXPIRED" }, { authMode: "apiKey" });
             return { ...item, vettingStatus: "LICENSE_EXPIRED" as VettingStatus };
          }
          return item;
        });
        setDrivers(updatedItems); 
        setLoading(false); 
      },
    });
    return () => sub.unsubscribe();
  }, []);

  function openAdd() {
    setEditTarget(null);
    setForm({ ...empty });
    setInitialForm({ ...empty });
    setShowDialog(true);
  }

  function openEdit(d: Driver) {
    setEditTarget(d);
    const loadedForm = {
      name: d.name, phone: d.phone,
      vehicleType: d.vehicleType ?? "TATA_ACE",
      preferredVendor: d.preferredVendor ?? "",
      address: d.address ?? "",
      aadharNumber: d.aadharNumber ?? "",
      aadharUrl: d.aadharUrl ?? "",
      licenseNumber: d.licenseNumber ?? "",
      licenseAttachmentUrl: d.licenseAttachmentUrl ?? "",
      licenseExpiry: normalizeDateForInput(d.licenseExpiry),
      panNumber: d.panNumber ?? "",
      panUrl: d.panUrl ?? "",
      notes: d.notes ?? "",
    };
    setForm(loadedForm);
    setInitialForm(loadedForm);

    // prefetch attachment previews if present
    (async () => {
      if (d.aadharUrl) {
        try {
          const r: any = await getFileUrl(d.aadharUrl);
          const url = typeof r === 'string' ? r : (r?.url || r?.signedUrl || r?.presignedUrl || r?.getUrl);
          await setAttachmentPreview(d.aadharUrl, url || null, setAadharPreviewUrl, setAadharThumbnail);
          setAadharLabel((d.aadharUrl || "").split('/').pop() || "");
        } catch (err) { console.debug("aadhar preview err", err); }
      } else {
        setAadharPreviewUrl(null); setAadharThumbnail(null); setAadharLabel("");
      }
      if (d.licenseAttachmentUrl) {
        try {
          const r: any = await getFileUrl(d.licenseAttachmentUrl);
          const url = typeof r === 'string' ? r : (r?.url || r?.signedUrl || r?.presignedUrl || r?.getUrl);
          await setAttachmentPreview(d.licenseAttachmentUrl, url || null, setLicensePreviewUrl, setLicenseThumbnail);
          setLicenseFileLabel((d.licenseAttachmentUrl || "").split('/').pop() || "");
        } catch (err) { console.debug("license preview err", err); }
      } else {
        setLicensePreviewUrl(null); setLicenseThumbnail(null); setLicenseFileLabel("");
      }
      if (d.panUrl) {
        try {
          const r: any = await getFileUrl(d.panUrl);
          const url = typeof r === 'string' ? r : (r?.url || r?.signedUrl || r?.presignedUrl || r?.getUrl);
          await setAttachmentPreview(d.panUrl, url || null, setPanPreviewUrl, setPanThumbnail);
          setPanLabel((d.panUrl || "").split('/').pop() || "");
        } catch (err) { console.debug("pan preview err", err); }
      } else {
        setPanPreviewUrl(null); setPanThumbnail(null); setPanLabel("");
      }
    })();

    setShowDialog(true);
  }

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((v) => ({ ...v, [f]: e.target.value }));

  function handleClose() {
    if (saving) return;
    if (JSON.stringify(form) !== JSON.stringify(initialForm)) {
      if (!window.confirm("You have unsaved changes. Are you sure you want to discard them and exit?")) {
        return;
      }
    }
    setShowDialog(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      let res;
      if (editTarget) {
        res = await client.models.Driver.update({
          id: editTarget.id,
          name: form.name, phone: form.phone,
          vehicleType: form.vehicleType as Driver["vehicleType"],
          preferredVendor: form.preferredVendor,
          address: form.address,
          aadharNumber: form.aadharNumber || undefined,
          aadharUrl: form.aadharUrl || undefined,
          licenseNumber: form.licenseNumber,
          licenseAttachmentUrl: form.licenseAttachmentUrl || undefined,
          licenseExpiry: form.licenseExpiry || undefined,
          panNumber: form.panNumber || undefined,
          panUrl: form.panUrl || undefined,
          notes: form.notes,
          updatedDate: new Date().toISOString(),
        }, { authMode: "apiKey" });
      } else {
        res = await client.models.Driver.create({
          name: form.name, phone: form.phone,
          vehicleType: form.vehicleType as Driver["vehicleType"],
          preferredVendor: form.preferredVendor,
          address: form.address,
          aadharNumber: form.aadharNumber || undefined,
          aadharUrl: form.aadharUrl || undefined,
          licenseNumber: form.licenseNumber,
          licenseAttachmentUrl: form.licenseAttachmentUrl || undefined,
          licenseExpiry: form.licenseExpiry || undefined,
          panNumber: form.panNumber || undefined,
          panUrl: form.panUrl || undefined,
          notes: form.notes,
          vettingStatus: "PENDING_REVIEW",
          isAvailable: true,
          updatedDate: new Date().toISOString(),
        }, { authMode: "apiKey" });
      }
      if (res.errors) throw new Error(res.errors.map((e: any) => e.message).join(", "));
      setForm({ ...empty }); setShowDialog(false); setEditTarget(null);
    } catch (err) {
      console.error("Save failed:", err);
      showUploadStatus(`Save failed: ${getErrorMessage(err)}`, "error");
    } finally {
      setSaving(false);
    }
  }

  async function updateVetting(d: Driver, vettingStatus: VettingStatus) {
    if (vettingStatus === "VETTED") {
      const todayStr = new Date().toISOString().split("T")[0];
      if (d.licenseExpiry && d.licenseExpiry < todayStr) {
        showToast("License has expired, update the license expire date before vetting");
        return;
      }
    }
    await client.models.Driver.update({ id: d.id, vettingStatus, updatedDate: new Date().toISOString() }, { authMode: "apiKey" });
  }

  // Handlers for attachments
  async function handleAadharFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return; setAadharUploading(true); showUploadStatus("Uploading Aadhar...", "info");
    const selectedFileName = f.name; setAadharLabel(selectedFileName);
    const MAX = 10 * 1024 * 1024; if (f.size > MAX) { setAadharUploading(false); showUploadStatus("Aadhar file is too large", "error"); return; }
    const baseKey = editTarget?.id || form.licenseNumber || `driver-${Date.now()}`;
    const safeBase = String(baseKey).replace(/[^a-zA-Z0-9_-]/g,'_');
    const safeFile = selectedFileName.replace(/[^a-zA-Z0-9._-]/g,'_');
    const key = `drivers/${safeBase}/aadhar_${Date.now()}_${safeFile}`;
    try {
      await uploadFile(key, f);
      setForm(v => ({ ...v, aadharUrl: key }));
      try {
        const r: any = await getFileUrl(key);
        const url = typeof r === 'string' ? r : (r?.url||r?.signedUrl||r?.presignedUrl||r?.getUrl);
        await setAttachmentPreview(key, url||null, setAadharPreviewUrl, setAadharThumbnail);
      } catch (previewErr) {
        console.debug('aadhar preview err', previewErr);
      }
      showUploadStatus("Aadhar uploaded successfully", "success");
    } catch (err) { console.error('aadhar upload', err); showUploadStatus(`Aadhar upload failed: ${getErrorMessage(err)}`, "error"); }
    finally { setAadharUploading(false); }
  }

  async function handleLicenseFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return; setLicenseUploading(true); showUploadStatus("Uploading license attachment...", "info");
    const selectedFileName = f.name; setLicenseFileLabel(selectedFileName);
    const MAX = 10 * 1024 * 1024; if (f.size > MAX) { setLicenseUploading(false); showUploadStatus("License file is too large", "error"); return; }
    const baseKey = editTarget?.id || form.licenseNumber || `driver-${Date.now()}`;
    const safeBase = String(baseKey).replace(/[^a-zA-Z0-9_-]/g,'_');
    const safeFile = selectedFileName.replace(/[^a-zA-Z0-9._-]/g,'_');
    const key = `drivers/${safeBase}/license_${Date.now()}_${safeFile}`;
    try {
      await uploadFile(key, f);
      setForm(v => ({ ...v, licenseAttachmentUrl: key }));
      try {
        const r: any = await getFileUrl(key);
        const url = typeof r === 'string' ? r : (r?.url||r?.signedUrl||r?.presignedUrl||r?.getUrl);
        await setAttachmentPreview(key, url||null, setLicensePreviewUrl, setLicenseThumbnail);
      } catch (previewErr) {
        console.debug('license preview err', previewErr);
      }
      showUploadStatus("License uploaded successfully", "success");
    } catch (err) { console.error('license upload', err); showUploadStatus(`License upload failed: ${getErrorMessage(err)}`, "error"); }
    finally { setLicenseUploading(false); }
  }

  async function handlePanFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return; setPanUploading(true); showUploadStatus("Uploading PAN attachment...", "info");
    const selectedFileName = f.name; setPanLabel(selectedFileName);
    const MAX = 10 * 1024 * 1024; if (f.size > MAX) { setPanUploading(false); showUploadStatus("PAN file is too large", "error"); return; }
    const baseKey = editTarget?.id || form.licenseNumber || `driver-${Date.now()}`;
    const safeBase = String(baseKey).replace(/[^a-zA-Z0-9_-]/g,'_');
    const safeFile = selectedFileName.replace(/[^a-zA-Z0-9._-]/g,'_');
    const key = `drivers/${safeBase}/pan_${Date.now()}_${safeFile}`;
    try {
      await uploadFile(key, f);
      setForm(v => ({ ...v, panUrl: key }));
      try {
        const r: any = await getFileUrl(key);
        const url = typeof r === 'string' ? r : (r?.url||r?.signedUrl||r?.presignedUrl||r?.getUrl);
        await setAttachmentPreview(key, url||null, setPanPreviewUrl, setPanThumbnail);
      } catch (previewErr) {
        console.debug('pan preview err', previewErr);
      }
      showUploadStatus("PAN uploaded successfully", "success");
    } catch (err) { console.error('pan upload', err); showUploadStatus(`PAN upload failed: ${getErrorMessage(err)}`, "error"); }
    finally { setPanUploading(false); }
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

  const dialogInitial = editTarget ? { opacity: 0, y: -10 } : { x: "100%" };
  const dialogAnimate = editTarget ? { opacity: 1, y: 0 } : { x: 0 };
  const dialogExit = editTarget ? { opacity: 0, y: -10 } : { x: "100%" };
  const dialogTransition = editTarget ? undefined : { type: "spring", stiffness: 320, damping: 32 };

  const dialogStyle = editTarget
    ? { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 201, width: "100%", maxWidth: "100%", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 0, boxShadow: "var(--shadow-elegant)", overflowY: "auto" }
    : { position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 201, width: "100%", maxWidth: 640, background: "var(--card)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", boxShadow: "-8px 0 40px hsla(222,28%,4%,0.2)", overflowY: "auto" };

  const formContent = (
    <>
      {uploadStatusMessage ? (
        <div style={{ padding: '10px 14px', borderRadius: 12, marginBottom: 12, background: uploadStatusType === 'success' ? 'rgba(16,185,129,0.12)' : uploadStatusType === 'error' ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)', color: uploadStatusType === 'success' ? '#047857' : uploadStatusType === 'error' ? '#b91c1c' : '#1d4ed8', border: `1px solid ${uploadStatusType === 'success' ? 'rgba(16,185,129,0.28)' : uploadStatusType === 'error' ? 'rgba(239,68,68,0.28)' : 'rgba(59,130,246,0.28)'}` }}>
          {uploadStatusMessage}
        </div>
      ) : null}
      <Row2>
        <Field label="Full Name *"><input required value={form.name} onChange={set("name")} style={inp} /></Field>
        <Field label="Phone *"><input required type="tel" value={form.phone} onChange={(e) => setForm(v => ({ ...v, phone: formatPhoneInput(e.target.value) }))} placeholder="+91 XXXX-XXX-XXX" style={inp} /></Field>
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
        <Field label="License Expiry">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input ref={licenseInputRef} type="date" value={form.licenseExpiry} onChange={set("licenseExpiry")} style={{ ...inp, flex: 1 }} />
            <button type="button" onClick={() => { licenseInputRef.current?.showPicker?.(); licenseInputRef.current?.focus(); }}
              aria-label="Open date picker" style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', cursor: 'pointer' }}>📅</button>
          </div>
        </Field>
      </Row2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 8 }}>
        {/* Aadhar */}
        <div>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 6 }}>Aadhar</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}><input value={form.aadharNumber} onChange={set('aadharNumber')} placeholder="Aadhar number" style={inp} /></div>
          <div>
            <input ref={aadharInputRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleAadharFile} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><div style={{ ...inp, padding: 8, minHeight: 44, display: 'flex', alignItems: 'center', color: aadharLabel ? 'var(--foreground)' : 'var(--muted-foreground)' }}>{aadharLabel || 'No file'}</div><button type="button" onClick={() => aadharInputRef.current?.click()} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--primary)', background: 'hsla(243,75%,62%,0.12)', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>{aadharUploading ? 'Uploading…' : (aadharLabel ? 'Replace' : 'Upload')}</button></div>
            {aadharThumbnail ? <div style={{ marginTop: 8 }}><img src={aadharThumbnail} alt="aadhar" onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (aadharPreviewUrl) window.open(aadharPreviewUrl, '_blank', 'noopener,noreferrer'); }} style={{ height: 80, cursor: 'pointer', borderRadius: 6, objectFit: 'cover' }} /></div> : null}
          </div>
        </div>

        {/* Driver License */}
        <div>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 6 }}>Driver License *</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}><input required value={form.licenseNumber} onChange={set('licenseNumber')} placeholder="License number" style={inp} /></div>
          <div>
            <input ref={licenseFileInputRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleLicenseFile} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><div style={{ ...inp, padding: 8, minHeight: 44, display: 'flex', alignItems: 'center', color: licenseFileLabel ? 'var(--foreground)' : 'var(--muted-foreground)' }}>{licenseFileLabel || 'No file'}</div><button type="button" onClick={() => licenseFileInputRef.current?.click()} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--primary)', background: 'hsla(243,75%,62%,0.12)', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>{licenseUploading ? 'Uploading…' : (licenseFileLabel ? 'Replace' : 'Upload')}</button></div>
            {licenseThumbnail ? <div style={{ marginTop: 8 }}><img src={licenseThumbnail} alt="license" onClick={(e)=>{e.preventDefault(); e.stopPropagation(); if (licensePreviewUrl) window.open(licensePreviewUrl, '_blank', 'noopener,noreferrer');}} style={{ height: 80, cursor: 'pointer', borderRadius: 6, objectFit: 'cover' }} /></div> : null}
          </div>
        </div>

        {/* PAN */}
        <div>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 6 }}>PAN</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}><input value={form.panNumber} onChange={set('panNumber')} placeholder="PAN number" style={inp} /></div>
          <div>
            <input ref={panInputRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handlePanFile} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><div style={{ ...inp, padding: 8, minHeight: 44, display: 'flex', alignItems: 'center', color: panLabel ? 'var(--foreground)' : 'var(--muted-foreground)' }}>{panLabel || 'No file'}</div><button type="button" onClick={() => panInputRef.current?.click()} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--primary)', background: 'hsla(243,75%,62%,0.12)', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>{panUploading ? 'Uploading…' : (panLabel ? 'Replace' : 'Upload')}</button></div>
            {panThumbnail ? <div style={{ marginTop: 8 }}><img src={panThumbnail} alt="pan" onClick={(e)=>{e.preventDefault(); e.stopPropagation(); if (panPreviewUrl) window.open(panPreviewUrl, '_blank', 'noopener,noreferrer');}} style={{ height: 80, cursor: 'pointer', borderRadius: 6, objectFit: 'cover' }} /></div> : null}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 8 }}><Field label="Notes"><textarea value={form.notes} onChange={set("notes")} rows={2} style={{ ...inp, resize: 'vertical' }} /></Field></div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
        <button type="button" onClick={handleClose} style={ghostBtn}>Cancel</button>
        <button type="submit" disabled={saving} style={primaryBtn}>{saving ? 'Saving…' : editTarget ? 'Save changes' : 'Add Driver'}</button>
      </div>
    </>
  );

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1100, margin: "0 auto" }}>
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            style={{
              position: "fixed", top: 24, left: 24, zIndex: 9999,
              background: "var(--card)", border: "1px solid var(--border)", borderLeft: "4px solid var(--status-blocked)",
              boxShadow: "var(--shadow-elegant)", padding: "16px 20px", borderRadius: "var(--radius-md)",
              display: "flex", alignItems: "center", gap: 12
            }}
          >
            <ShieldAlert size={20} color="var(--status-blocked)" />
            <span style={{ fontSize: 14, fontWeight: 500, color: "var(--foreground)" }}>{toastMessage}</span>
            <button onClick={() => setToastMessage("")} style={{ background: "none", border: "none", color: "var(--muted-foreground)", cursor: "pointer", display: "flex" }}><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

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
                  <select value={v} onChange={(e) => updateVetting(d, e.target.value as VettingStatus)}
                    style={{ background: "var(--accent)", border: "1px solid var(--border)", color: "var(--foreground)", borderRadius: "var(--radius-sm)", padding: "4px 8px", fontSize: 12, cursor: "pointer", outline: "none" }}>
                    <option value="PENDING_REVIEW">Pending Review</option>
                    <option value="VETTED">Vetted</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="LICENSE_EXPIRED">License Expired</option>
                    <option value="INSURANCE_EXPIRED">Insurance Expired</option>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose}
              style={{ position: "fixed", inset: 0, zIndex: 200, background: "hsla(222,28%,4%,0.7)", backdropFilter: "blur(4px)" }} />
            <motion.div initial={dialogInitial} animate={dialogAnimate} exit={dialogExit} transition={dialogTransition as any} style={dialogStyle as any}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "var(--card)", zIndex: 10 }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17 }}>{editTarget ? "Edit Driver" : "Add Driver"}</h3>
                <button onClick={handleClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}><X size={18} /></button>
              </div>
              {editTarget ? (
                <div style={{ display: 'flex', gap: 20, padding: 24 }}>
                  <div style={{ width: 300, maxHeight: '70vh', overflowY: 'auto', borderRight: '1px solid var(--border)', paddingRight: 12 }}>
                    {drivers.map((dd) => (
                      <div key={dd.id} onClick={() => { if (JSON.stringify(form) !== JSON.stringify(initialForm)) { if (!window.confirm("You have unsaved changes. Are you sure you want to discard them?")) return; } openEdit(dd); }}
                        style={{ padding: 10, borderRadius: 8, cursor: 'pointer', marginBottom: 8, background: editTarget?.id === dd.id ? 'rgba(0,128,255,0.06)' : 'transparent', border: editTarget?.id === dd.id ? '1px solid var(--accent)' : '1px solid transparent' }}>
                        <div style={{ fontWeight: 600 }}>{dd.name}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted-foreground)' }}>{dd.phone}</div>
                        <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 6 }}>{formatDateForDisplay(dd.licenseExpiry) || '—'}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ flex: 1 }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {formContent}
                    </form>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {formContent}
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
