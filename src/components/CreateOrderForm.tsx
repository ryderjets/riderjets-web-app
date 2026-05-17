import { useState } from "react";

interface OrderInput {
  source: string;
  destination: string;
  weightKg: number;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
}

interface Props {
  onSubmit: (data: OrderInput) => void;
  onCancel: () => void;
}

const empty: OrderInput = {
  source: "",
  destination: "",
  weightKg: 0,
  recipientName: "",
  recipientEmail: "",
  recipientPhone: "",
};

export default function CreateOrderForm({ onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<OrderInput>(empty);

  const set = (field: keyof OrderInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: field === "weightKg" ? parseFloat(e.target.value) : e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form className="create-order-form" onSubmit={handleSubmit}>
      <h3>New Shipment</h3>
      <div className="form-row">
        <label>Source *<input required value={form.source} onChange={set("source")} placeholder="City, Address" /></label>
        <label>Destination *<input required value={form.destination} onChange={set("destination")} placeholder="City, Address" /></label>
      </div>
      <div className="form-row">
        <label>Weight (kg) *<input required type="number" min="0.1" step="0.1" value={form.weightKg || ""} onChange={set("weightKg")} /></label>
      </div>
      <div className="form-row">
        <label>Recipient Name *<input required value={form.recipientName} onChange={set("recipientName")} /></label>
        <label>Recipient Email *<input required type="email" value={form.recipientEmail} onChange={set("recipientEmail")} /></label>
      </div>
      <div className="form-row">
        <label>Recipient Phone<input type="tel" value={form.recipientPhone} onChange={set("recipientPhone")} /></label>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn-primary">Create Order</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
