import { useEffect, useState, useRef } from "react";
import { generateClient } from "aws-amplify/data";
import { uploadFile, getFileUrl } from "../lib/storage";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.js?url";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Clock, ShieldCheck, ShieldAlert, Truck, Pencil } from "lucide-react";
import type { Schema } from "../../amplify/data/resource";

GlobalWorkerOptions.workerSrc = pdfWorker;

const client = generateClient<Schema>();
type Vehicle = Schema["Vehicle"]["type"];
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

const empty = {
  vehicleNumber: "", type: "TATA_ACE", make: "", model: "",
  capacityKg: "", truckSizeFt: "",
  rcNumber: "", rcUrl: "",
  insuranceNumber: "", insuranceExpiry: "", insuranceUrl: "",
  fitnessExpiry: "",
  ownerName: "", ownerPhone: "", ownerAddress: "",
  heightClearanceFt: "", nationalPermit: "No", nationalPermitNumber: "", taxPermitUrl: "",
  photoFrontUrl: "", photoBackUrl: "", photoLeftUrl: "", photoRightUrl: ""
};

export default function Vehicles() {
  const [vehicles, setVehicles]     = useState<Vehicle[]>([]);
  const [drivers, setDrivers]       = useState<Schema["Driver"]["type"][]>([]);
  const [loading, setLoading]       = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Vehicle | null>(null);
  const [form, setForm]             = useState({ ...empty });
  const [initialForm, setInitialForm] = useState({ ...empty });
  const [saving, setSaving]         = useState(false);

  // File input refs
  const rcInputRef = useRef<HTMLInputElement | null>(null);
  const insuranceInputRef = useRef<HTMLInputElement | null>(null);
  const taxPermitInputRef = useRef<HTMLInputElement | null>(null);

  const [rcLabel, setRcLabel] = useState<string>("");
  const [rcUploading, setRcUploading] = useState(false);
  const [rcPreviewUrl, setRcPreviewUrl] = useState<string | null>(null);
  const [rcThumbnail, setRcThumbnail] = useState<string | null>(null);

  const [insuranceLabel, setInsuranceLabel] = useState<string>("");
  const [insuranceUploading, setInsuranceUploading] = useState(false);
  const [insurancePreviewUrl, setInsurancePreviewUrl] = useState<string | null>(null);
  const [insuranceThumbnail, setInsuranceThumbnail] = useState<string | null>(null);

  const [taxPermitLabel, setTaxPermitLabel] = useState<string>("");
  const [taxPermitUploading, setTaxPermitUploading] = useState(false);
  const [taxPermitPreviewUrl, setTaxPermitPreviewUrl] = useState<string | null>(null);
  const [taxPermitThumbnail, setTaxPermitThumbnail] = useState<string | null>(null);

  // Vehicle 4-side photos
  const photoFrontRef = useRef<HTMLInputElement | null>(null);
  const photoBackRef = useRef<HTMLInputElement | null>(null);
  const photoLeftRef = useRef<HTMLInputElement | null>(null);
  const photoRightRef = useRef<HTMLInputElement | null>(null);

  type PhotoState = { label: string; uploading: boolean; previewUrl: string | null; thumbnail: string | null; };
  const initPhoto = (): PhotoState => ({ label: "", uploading: false, previewUrl: null, thumbnail: null });
  const [photos, setPhotos] = useState<Record<string, PhotoState>>({ front: initPhoto(), back: initPhoto(), left: initPhoto(), right: initPhoto() });

  const [uploadStatusMessage, setUploadStatusMessage] = useState<string>("");
  const [uploadStatusType, setUploadStatusType] = useState<"success" | "error" | "info">("info");
  const uploadStatusTimer = useRef<number | null>(null);

  const [toastMessage, setToastMessage] = useState<string>("");
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    const sub = client.models.Vehicle.observeQuery({ authMode: "apiKey" }).subscribe({
      next: (d) => { 
        const todayStr = new Date().toISOString().split("T")[0];
        const updatedItems = d.items.map(item => {
          if (item.vettingStatus === 'VETTED' && item.insuranceExpiry && item.insuranceExpiry < todayStr) {
             client.models.Vehicle.update({ id: item.id, vettingStatus: "INSURANCE_EXPIRED" }, { authMode: "apiKey" });
             return { ...item, vettingStatus: "INSURANCE_EXPIRED" as VettingStatus };
          }
          return item;
        });
        setVehicles(updatedItems); 
        setLoading(false); 
      },
    });
    const subDrivers = client.models.Driver.observeQuery({ authMode: "apiKey" }).subscribe({
      next: (d) => setDrivers([...d.items]),
    });
    return () => { sub.unsubscribe(); subDrivers.unsubscribe(); };
  }, []);

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

  function openAdd() {
    setEditTarget(null);
    setForm({ ...empty });
    setInitialForm({ ...empty });
    setRcLabel(""); setRcPreviewUrl(null); setRcThumbnail(null);
    setInsuranceLabel(""); setInsurancePreviewUrl(null); setInsuranceThumbnail(null);
    setTaxPermitLabel(""); setTaxPermitPreviewUrl(null); setTaxPermitThumbnail(null);
    setPhotos({ front: initPhoto(), back: initPhoto(), left: initPhoto(), right: initPhoto() });
    setShowDialog(true);
  }

  function openEdit(v: Vehicle) {
    setEditTarget(v);
    const loadedForm = {
      vehicleNumber: v.vehicleNumber,
      type: v.type ?? "TATA_ACE",
      make: v.make ?? "",
      model: v.model ?? "",
      capacityKg: v.capacityKg?.toString() ?? "",
      truckSizeFt: v.truckSizeFt?.toString() ?? "",
      rcNumber: v.rcNumber ?? "",
      rcUrl: v.rcUrl ?? "",
      insuranceNumber: v.insuranceNumber ?? "",
      insuranceExpiry: v.insuranceExpiry ?? "",
      insuranceUrl: v.insuranceUrl ?? "",
      fitnessExpiry: v.fitnessExpiry ?? "",
      ownerName: v.ownerName ?? "",
      ownerPhone: v.ownerPhone ?? "",
      ownerAddress: v.ownerAddress ?? "",
      heightClearanceFt: v.heightClearanceFt?.toString() ?? "",
      nationalPermit: v.nationalPermit ? "Yes" : "No",
      nationalPermitNumber: v.nationalPermitNumber ?? "",
      taxPermitUrl: v.taxPermitUrl ?? "",
      photoFrontUrl: v.photoFrontUrl ?? "",
      photoBackUrl: v.photoBackUrl ?? "",
      photoLeftUrl: v.photoLeftUrl ?? "",
      photoRightUrl: v.photoRightUrl ?? "",
    };
    setForm(loadedForm);
    setInitialForm(loadedForm);

    // prefetch previews
    (async () => {
      if (v.rcUrl) {
        try {
          const r: any = await getFileUrl(v.rcUrl);
          const url = typeof r === 'string' ? r : (r?.url || r?.signedUrl || r?.presignedUrl || r?.getUrl);
          await setAttachmentPreview(v.rcUrl, url || null, setRcPreviewUrl, setRcThumbnail);
          setRcLabel((v.rcUrl || "").split('/').pop() || "");
        } catch (err) { console.debug("rc preview err", err); }
      } else { setRcPreviewUrl(null); setRcThumbnail(null); setRcLabel(""); }

      if (v.insuranceUrl) {
        try {
          const r: any = await getFileUrl(v.insuranceUrl);
          const url = typeof r === 'string' ? r : (r?.url || r?.signedUrl || r?.presignedUrl || r?.getUrl);
          await setAttachmentPreview(v.insuranceUrl, url || null, setInsurancePreviewUrl, setInsuranceThumbnail);
          setInsuranceLabel((v.insuranceUrl || "").split('/').pop() || "");
        } catch (err) { console.debug("insurance preview err", err); }
      } else { setInsurancePreviewUrl(null); setInsuranceThumbnail(null); setInsuranceLabel(""); }

      if (v.taxPermitUrl) {
        try {
          const r: any = await getFileUrl(v.taxPermitUrl);
          const url = typeof r === 'string' ? r : (r?.url || r?.signedUrl || r?.presignedUrl || r?.getUrl);
          await setAttachmentPreview(v.taxPermitUrl, url || null, setTaxPermitPreviewUrl, setTaxPermitThumbnail);
          setTaxPermitLabel((v.taxPermitUrl || "").split('/').pop() || "");
        } catch (err) { console.debug("tax permit preview err", err); }
      } else { setTaxPermitPreviewUrl(null); setTaxPermitThumbnail(null); setTaxPermitLabel(""); }

      const loadSide = async (side: "front"|"back"|"left"|"right", urlStr?: string | null) => {
        if (!urlStr) return;
        try {
          const r: any = await getFileUrl(urlStr);
          const url = typeof r === 'string' ? r : (r?.url || r?.signedUrl || r?.presignedUrl || r?.getUrl);
          let thumb: string | null = null;
          if (url && isPdfKey(urlStr)) thumb = await loadPdfThumbnail(url); else thumb = url;
          setPhotos(prev => ({ ...prev, [side]: { ...prev[side], label: urlStr.split('/').pop() || "", previewUrl: url || null, thumbnail: thumb || null } }));
        } catch (err) { console.debug(`${side} preview err`, err); }
      };
      loadSide("front", v.photoFrontUrl);
      loadSide("back", v.photoBackUrl);
      loadSide("left", v.photoLeftUrl);
      loadSide("right", v.photoRightUrl);
    })();

    setShowDialog(true);
  }

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((v) => ({ ...v, [f]: e.target.value }));

  const handleOwnerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const matched = drivers.find(d => d.name === val);
    if (matched) {
      setForm(v => ({
        ...v,
        ownerName: val,
        ownerPhone: formatPhoneInput(v.ownerPhone || matched.phone || ""),
        ownerAddress: v.ownerAddress || matched.address || ""
      }));
    } else {
      setForm(v => ({ ...v, ownerName: val }));
    }
  };

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
    const payload = {
      vehicleNumber: form.vehicleNumber.toUpperCase(),
      type: form.type as Vehicle["type"],
      make: form.make, model: form.model,
      capacityKg: form.capacityKg ? parseFloat(form.capacityKg) : undefined,
      truckSizeFt: form.truckSizeFt ? parseFloat(form.truckSizeFt) : undefined,
      heightClearanceFt: form.heightClearanceFt ? parseFloat(form.heightClearanceFt) : undefined,
      rcNumber: form.rcNumber,
      rcUrl: form.rcUrl || undefined,
      insuranceNumber: form.insuranceNumber,
      insuranceExpiry: form.insuranceExpiry || undefined,
      insuranceUrl: form.insuranceUrl || undefined,
      fitnessExpiry: form.fitnessExpiry || undefined,
      ownerName: form.ownerName,
      ownerPhone: form.ownerPhone,
      ownerAddress: form.ownerAddress,
      nationalPermit: form.nationalPermit === "Yes",
      nationalPermitNumber: form.nationalPermitNumber || undefined,
      taxPermitUrl: form.taxPermitUrl || undefined,
      photoFrontUrl: form.photoFrontUrl || undefined,
      photoBackUrl: form.photoBackUrl || undefined,
      photoLeftUrl: form.photoLeftUrl || undefined,
      photoRightUrl: form.photoRightUrl || undefined,
      updatedDate: new Date().toISOString(),
    };
    try {
      let res;
      if (editTarget) {
        res = await client.models.Vehicle.update({ id: editTarget.id, ...payload }, { authMode: "apiKey" });
      } else {
        res = await client.models.Vehicle.create({ ...payload, vettingStatus: "PENDING_REVIEW" }, { authMode: "apiKey" });
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

  async function handleRcFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return; setRcUploading(true); showUploadStatus("Uploading RC...", "info");
    const selectedFileName = f.name; setRcLabel(selectedFileName);
    const MAX = 10 * 1024 * 1024; if (f.size > MAX) { setRcUploading(false); showUploadStatus("RC file is too large", "error"); return; }
    const baseKey = editTarget?.id || form.vehicleNumber || `vehicle-${Date.now()}`;
    const safeBase = String(baseKey).replace(/[^a-zA-Z0-9_-]/g,'_');
    const safeFile = selectedFileName.replace(/[^a-zA-Z0-9._-]/g,'_');
    const key = `vehicles/${safeBase}/rc_${Date.now()}_${safeFile}`;
    try {
      await uploadFile(key, f);
      setForm(v => ({ ...v, rcUrl: key }));
      try {
        const r: any = await getFileUrl(key);
        const url = typeof r === 'string' ? r : (r?.url||r?.signedUrl||r?.presignedUrl||r?.getUrl);
        await setAttachmentPreview(key, url||null, setRcPreviewUrl, setRcThumbnail);
      } catch (previewErr) { console.debug('rc preview err', previewErr); }
      showUploadStatus("RC uploaded successfully", "success");
    } catch (err) { console.error('rc upload', err); showUploadStatus(`RC upload failed: ${getErrorMessage(err)}`, "error"); }
    finally { setRcUploading(false); }
  }

  async function handleInsuranceFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return; setInsuranceUploading(true); showUploadStatus("Uploading Insurance...", "info");
    const selectedFileName = f.name; setInsuranceLabel(selectedFileName);
    const MAX = 10 * 1024 * 1024; if (f.size > MAX) { setInsuranceUploading(false); showUploadStatus("Insurance file is too large", "error"); return; }
    const baseKey = editTarget?.id || form.vehicleNumber || `vehicle-${Date.now()}`;
    const safeBase = String(baseKey).replace(/[^a-zA-Z0-9_-]/g,'_');
    const safeFile = selectedFileName.replace(/[^a-zA-Z0-9._-]/g,'_');
    const key = `vehicles/${safeBase}/insurance_${Date.now()}_${safeFile}`;
    try {
      await uploadFile(key, f);
      setForm(v => ({ ...v, insuranceUrl: key }));
      try {
        const r: any = await getFileUrl(key);
        const url = typeof r === 'string' ? r : (r?.url||r?.signedUrl||r?.presignedUrl||r?.getUrl);
        await setAttachmentPreview(key, url||null, setInsurancePreviewUrl, setInsuranceThumbnail);
      } catch (previewErr) { console.debug('insurance preview err', previewErr); }
      showUploadStatus("Insurance uploaded successfully", "success");
    } catch (err) { console.error('insurance upload', err); showUploadStatus(`Insurance upload failed: ${getErrorMessage(err)}`, "error"); }
    finally { setInsuranceUploading(false); }
  }

  async function handleTaxPermitFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return; setTaxPermitUploading(true); showUploadStatus("Uploading Tax/Permit...", "info");
    const selectedFileName = f.name; setTaxPermitLabel(selectedFileName);
    const MAX = 10 * 1024 * 1024; if (f.size > MAX) { setTaxPermitUploading(false); showUploadStatus("Tax/Permit file is too large", "error"); return; }
    const baseKey = editTarget?.id || form.vehicleNumber || `vehicle-${Date.now()}`;
    const safeBase = String(baseKey).replace(/[^a-zA-Z0-9_-]/g,'_');
    const safeFile = selectedFileName.replace(/[^a-zA-Z0-9._-]/g,'_');
    const key = `vehicles/${safeBase}/tax_permit_${Date.now()}_${safeFile}`;
    try {
      await uploadFile(key, f);
      setForm(v => ({ ...v, taxPermitUrl: key }));
      try {
        const r: any = await getFileUrl(key);
        const url = typeof r === 'string' ? r : (r?.url||r?.signedUrl||r?.presignedUrl||r?.getUrl);
        await setAttachmentPreview(key, url||null, setTaxPermitPreviewUrl, setTaxPermitThumbnail);
      } catch (previewErr) { console.debug('tax permit preview err', previewErr); }
      showUploadStatus("Tax/Permit uploaded successfully", "success");
    } catch (err) { console.error('tax permit upload', err); showUploadStatus(`Tax/Permit upload failed: ${getErrorMessage(err)}`, "error"); }
    finally { setTaxPermitUploading(false); }
  }

  async function handlePhotoFile(e: React.ChangeEvent<HTMLInputElement>, side: "front" | "back" | "left" | "right") {
    const f = e.target.files?.[0]; if (!f) return;
    setPhotos(p => ({ ...p, [side]: { ...p[side], uploading: true, label: f.name }}));
    showUploadStatus(`Uploading ${side} photo...`, "info");
    const MAX = 10 * 1024 * 1024;
    if (f.size > MAX) {
      setPhotos(p => ({ ...p, [side]: { ...p[side], uploading: false }}));
      showUploadStatus(`Photo is too large`, "error"); return;
    }
    const baseKey = editTarget?.id || form.vehicleNumber || `vehicle-${Date.now()}`;
    const safeBase = String(baseKey).replace(/[^a-zA-Z0-9_-]/g,'_');
    const safeFile = f.name.replace(/[^a-zA-Z0-9._-]/g,'_');
    const key = `vehicles/${safeBase}/photo_${side}_${Date.now()}_${safeFile}`;
    
    try {
      await uploadFile(key, f);
      let formKey = "photoFrontUrl";
      if (side === "back") formKey = "photoBackUrl";
      if (side === "left") formKey = "photoLeftUrl";
      if (side === "right") formKey = "photoRightUrl";
      setForm(v => ({ ...v, [formKey]: key }));
      
      try {
        const r: any = await getFileUrl(key);
        const url = typeof r === 'string' ? r : (r?.url||r?.signedUrl||r?.presignedUrl||r?.getUrl);
        let thumb: string | null = null;
        if (url && isPdfKey(key)) thumb = await loadPdfThumbnail(url); else thumb = url;
        setPhotos(p => ({ ...p, [side]: { ...p[side], previewUrl: url || null, thumbnail: thumb || null }}));
      } catch (previewErr) { console.debug(`${side} preview err`, previewErr); }
      showUploadStatus(`${side} photo uploaded successfully`, "success");
    } catch (err) {
      console.error(`${side} upload`, err);
      showUploadStatus(`${side} photo upload failed: ${getErrorMessage(err)}`, "error");
    } finally {
      setPhotos(p => ({ ...p, [side]: { ...p[side], uploading: false }}));
    }
  }

  function renderPhotoBox(side: "front"|"back"|"left"|"right", labelText: string, inputRef: any) {
    const state = photos[side];
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{labelText}</label>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handlePhotoFile(e, side)} />
        <div onClick={() => inputRef.current?.click()}
          style={{ width: 90, height: 70, borderRadius: 8, border: state.thumbnail ? "none" : "2px dashed var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: state.thumbnail ? "var(--accent)" : "hsla(243,75%,62%,0.08)", overflow: "hidden", position: "relative", boxShadow: state.thumbnail ? "0 4px 12px rgba(0,0,0,0.1)" : "none" }}>
          {state.uploading ? (
            <span style={{ fontSize: 11, color: "var(--primary)", fontWeight: 600 }}>Uploading…</span>
          ) : state.thumbnail ? (
            <img src={state.thumbnail} alt={side} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <Plus size={20} color="var(--primary)" />
          )}
        </div>
        {state.previewUrl && <button type="button" onClick={(e) => { e.stopPropagation(); window.open(state.previewUrl!, '_blank'); }} style={{ fontSize: 11, background: "none", border: "none", color: "var(--primary)", cursor: "pointer", padding: "2px 6px" }}>View</button>}
      </div>
    );
  }

  async function updateVetting(v: Vehicle, vettingStatus: VettingStatus) {
    if (vettingStatus === "VETTED") {
      const todayStr = new Date().toISOString().split("T")[0];
      if (v.insuranceExpiry && v.insuranceExpiry < todayStr) {
        showToast("Insurance has expired, update the insurance expiry date before vetting");
        return;
      }
      if (v.fitnessExpiry && v.fitnessExpiry < todayStr) {
        showToast("Fitness has expired, update the fitness expiry date before vetting");
        return;
      }
    }
    await client.models.Vehicle.update({ id: v.id, vettingStatus, updatedDate: new Date().toISOString() }, { authMode: "apiKey" });
  }

  const dialogInitial = editTarget ? { opacity: 0, y: -10 } : { x: "100%" };
  const dialogAnimate = editTarget ? { opacity: 1, y: 0 } : { x: 0 };
  const dialogExit = editTarget ? { opacity: 0, y: -10 } : { x: "100%" };
  const dialogTransition = editTarget ? undefined : { type: "spring", stiffness: 320, damping: 32 };
  const dialogStyle = editTarget
    ? { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 201, width: "100%", maxWidth: "100%", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 0, boxShadow: "var(--shadow-elegant)", overflowY: "auto" }
    : { position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 201, width: "100%", maxWidth: 640, background: "var(--card)", borderLeft: "1px solid var(--border)", boxShadow: "-8px 0 40px hsla(222,28%,4%,0.2)", overflowY: "auto" };

  const formContent = (
    <>
      <div style={{ fontWeight: 600, marginTop: 8, marginBottom: -4, color: "var(--foreground)" }}>Vehicle Info</div>
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
        <Field label="Capacity (kg)"><input type="number" min="0" step="any" value={form.capacityKg} onChange={set("capacityKg")} style={inp} /></Field>
        <Field label="Size (ft) *"><input required type="number" min="0" step="any" value={form.truckSizeFt} onChange={set("truckSizeFt")} style={inp} /></Field>
        <Field label="Height Clearance (ft)"><input type="number" min="0" step="any" value={form.heightClearanceFt} onChange={set("heightClearanceFt")} style={inp} /></Field>
      </Row2>

      <div style={{ fontWeight: 600, marginTop: 16, marginBottom: -4, color: "var(--foreground)" }}>Owner Details</div>
      <datalist id="driver-names">
        {drivers.map(d => <option key={d.id} value={d.name} />)}
      </datalist>
      <datalist id="driver-phones">
        {drivers.map(d => <option key={d.id} value={d.phone} />)}
      </datalist>
      <Row2>
        <Field label="Name *"><input required list="driver-names" value={form.ownerName} onChange={handleOwnerNameChange} style={inp} /></Field>
        <Field label="Phone *"><input required type="tel" list="driver-phones" value={form.ownerPhone} onChange={(e) => setForm(v => ({ ...v, ownerPhone: formatPhoneInput(e.target.value) }))} placeholder="+91 XXXX-XXX-XXX" style={inp} /></Field>
      </Row2>
      <Field label="Address"><input value={form.ownerAddress} onChange={set("ownerAddress")} style={inp} /></Field>

      <div style={{ fontWeight: 600, marginTop: 16, marginBottom: 12, color: "var(--foreground)" }}>Vehicle Photos</div>
      <div style={{ display: "grid", gridTemplateColumns: "100px 100px 100px", gridTemplateRows: "auto auto auto", gap: "16px 32px", justifyContent: "center", alignItems: "center", background: "hsla(222,20%,10%,0.3)", padding: "24px 0", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", marginTop: 12 }}>
        <div style={{ gridColumn: 2, gridRow: 1 }}>
          {renderPhotoBox("front", "Front", photoFrontRef)}
        </div>
        <div style={{ gridColumn: 1, gridRow: 2 }}>
          {renderPhotoBox("left", "Left Side", photoLeftRef)}
        </div>
        <div style={{ gridColumn: 2, gridRow: 2, display: "flex", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 72, height: 72, background: "var(--card)", borderRadius: "50%", border: "1px solid var(--border)", boxShadow: "var(--shadow-elegant)" }}>
            <Truck size={32} color="var(--muted-foreground)" strokeWidth={1.5} />
          </div>
        </div>
        <div style={{ gridColumn: 3, gridRow: 2 }}>
          {renderPhotoBox("right", "Right Side", photoRightRef)}
        </div>
        <div style={{ gridColumn: 2, gridRow: 3 }}>
          {renderPhotoBox("back", "Back", photoBackRef)}
        </div>
      </div>

      <div style={{ fontWeight: 600, marginTop: 16, marginBottom: -4, color: "var(--foreground)" }}>Documents & Attachments</div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12, alignItems: 'start' }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 6 }}>RC Book</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <input value={form.rcNumber} onChange={set('rcNumber')} placeholder="RC number" style={inp} />
          </div>
          <div>
            <input ref={rcInputRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleRcFile} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ ...inp, padding: 8, minHeight: 44, display: 'flex', alignItems: 'center', color: rcLabel ? 'var(--foreground)' : 'var(--muted-foreground)' }}>{rcLabel || 'No file'}</div>
              <button type="button" onClick={() => rcInputRef.current?.click()} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--primary)', background: 'hsla(243,75%,62%,0.12)', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>{rcUploading ? 'Uploading…' : (rcLabel ? 'Replace' : 'Upload')}</button>
            </div>
            {rcThumbnail ? <div style={{ marginTop: 8 }}><img src={rcThumbnail} alt="rc" onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (rcPreviewUrl) window.open(rcPreviewUrl, '_blank', 'noopener,noreferrer'); }} style={{ height: 80, cursor: 'pointer', borderRadius: 6, objectFit: 'cover' }} /></div> : null}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 6 }}>Insurance</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <input value={form.insuranceNumber} onChange={set('insuranceNumber')} placeholder="Insurance number" style={inp} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <input type="date" value={form.insuranceExpiry} onChange={set('insuranceExpiry')} title="Insurance Expiry" style={inp} />
          </div>
          <div>
            <input ref={insuranceInputRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleInsuranceFile} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ ...inp, padding: 8, minHeight: 44, display: 'flex', alignItems: 'center', color: insuranceLabel ? 'var(--foreground)' : 'var(--muted-foreground)' }}>{insuranceLabel || 'No file'}</div>
              <button type="button" onClick={() => insuranceInputRef.current?.click()} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--primary)', background: 'hsla(243,75%,62%,0.12)', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>{insuranceUploading ? 'Uploading…' : (insuranceLabel ? 'Replace' : 'Upload')}</button>
            </div>
            {insuranceThumbnail ? <div style={{ marginTop: 8 }}><img src={insuranceThumbnail} alt="insurance" onClick={(e)=>{e.preventDefault(); e.stopPropagation(); if (insurancePreviewUrl) window.open(insurancePreviewUrl, '_blank', 'noopener,noreferrer');}} style={{ height: 80, cursor: 'pointer', borderRadius: 6, objectFit: 'cover' }} /></div> : null}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 6 }}>Goods Permit / Tax</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <select value={form.nationalPermit} onChange={set('nationalPermit')} style={inp}>
              <option value="No">No National Permit</option>
              <option value="Yes">Has National Permit</option>
            </select>
          </div>
          {form.nationalPermit === 'Yes' && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <input required value={form.nationalPermitNumber} onChange={set('nationalPermitNumber')} placeholder="National Permit number *" style={inp} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <input type="date" value={form.fitnessExpiry} onChange={set("fitnessExpiry")} title="Fitness Expiry" style={inp} />
          </div>
          <div>
            <input ref={taxPermitInputRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleTaxPermitFile} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ ...inp, padding: 8, minHeight: 44, display: 'flex', alignItems: 'center', color: taxPermitLabel ? 'var(--foreground)' : 'var(--muted-foreground)' }}>{taxPermitLabel || 'No file'}</div>
              <button type="button" onClick={() => taxPermitInputRef.current?.click()} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--primary)', background: 'hsla(243,75%,62%,0.12)', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>{taxPermitUploading ? 'Uploading…' : (taxPermitLabel ? 'Replace' : 'Upload')}</button>
            </div>
            {taxPermitThumbnail ? <div style={{ marginTop: 8 }}><img src={taxPermitThumbnail} alt="tax permit" onClick={(e)=>{e.preventDefault(); e.stopPropagation(); if (taxPermitPreviewUrl) window.open(taxPermitPreviewUrl, '_blank', 'noopener,noreferrer');}} style={{ height: 80, cursor: 'pointer', borderRadius: 6, objectFit: 'cover' }} /></div> : null}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
        <button type="button" onClick={handleClose} style={ghostBtn}>Cancel</button>
        <button type="submit" disabled={saving} style={primaryBtn}>{saving ? "Saving…" : editTarget ? "Save changes" : "Add Vehicle"}</button>
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
                  <select value={vs} onChange={(e) => updateVetting(v, e.target.value as VettingStatus)}
                    style={{ background: "var(--accent)", border: "1px solid var(--border)", color: "var(--foreground)", borderRadius: "var(--radius-sm)", padding: "4px 8px", fontSize: 12, cursor: "pointer", outline: "none" }}>
                    <option value="PENDING_REVIEW">Pending Review</option>
                    <option value="VETTED">Vetted</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="LICENSE_EXPIRED">License Expired</option>
                    <option value="INSURANCE_EXPIRED">Insurance Expired</option>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose}
              style={{ position: "fixed", inset: 0, zIndex: 200, background: "hsla(222,28%,4%,0.7)", backdropFilter: "blur(4px)" }} />
            <motion.div initial={dialogInitial} animate={dialogAnimate} exit={dialogExit} transition={dialogTransition as any} style={dialogStyle as any}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "var(--card)", zIndex: 10 }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17 }}>{editTarget ? "Edit Vehicle" : "Add Vehicle"}</h3>
                <button onClick={handleClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }}><X size={18} /></button>
              </div>

              <AnimatePresence>
                {uploadStatusMessage && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    style={{ position: "sticky", top: 76, zIndex: 9, margin: '16px 24px 0', padding: '10px 14px', borderRadius: 12, background: uploadStatusType === 'success' ? 'rgba(16,185,129,0.12)' : uploadStatusType === 'error' ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)', color: uploadStatusType === 'success' ? '#047857' : uploadStatusType === 'error' ? '#b91c1c' : '#1d4ed8', border: `1px solid ${uploadStatusType === 'success' ? 'rgba(16,185,129,0.28)' : uploadStatusType === 'error' ? 'rgba(239,68,68,0.28)' : 'rgba(59,130,246,0.28)'}`, backdropFilter: "blur(8px)", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500 }}>
                      {uploadStatusType === 'success' ? <ShieldCheck size={16} /> : uploadStatusType === 'error' ? <ShieldAlert size={16} /> : <Clock size={16} />}
                      {uploadStatusMessage}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {editTarget ? (
                <div style={{ display: 'flex', gap: 20, padding: 24 }}>
                  <div style={{ width: 300, maxHeight: '70vh', overflowY: 'auto', borderRight: '1px solid var(--border)', paddingRight: 12 }}>
                    {vehicles.map((vv) => (
                      <div key={vv.id} onClick={() => { if (JSON.stringify(form) !== JSON.stringify(initialForm)) { if (!window.confirm("You have unsaved changes. Are you sure you want to discard them?")) return; } openEdit(vv); }}
                        style={{ padding: 10, borderRadius: 8, cursor: 'pointer', marginBottom: 8, background: editTarget?.id === vv.id ? 'rgba(0,128,255,0.06)' : 'transparent', border: editTarget?.id === vv.id ? '1px solid var(--accent)' : '1px solid transparent' }}>
                        <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>{vv.vehicleNumber}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{vv.type ? VEHICLE_LABELS[vv.type] : "—"}</div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>{[vv.make, vv.model].filter(Boolean).join(" ") || "—"}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ flex: 1 }}>
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {formContent}
                    </form>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
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
