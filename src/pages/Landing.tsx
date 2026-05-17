import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plane, Menu, X, Package, Users, Truck, ArrowRight, CheckCircle2, Zap, Shield, BarChart3 } from "lucide-react";

interface Props {
  isSignedIn: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onGoToApp: () => void;
}

/* ─── Nav ─────────────────────────────────────────────────── */
function Nav({ isSignedIn, onSignIn, onSignOut, onGoToApp }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const scroll = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); setMenuOpen(false); };

  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      height: 64, display: "flex", alignItems: "center", padding: "0 32px",
      background: scrolled ? "hsla(222,28%,7%,0.85)" : "transparent",
      backdropFilter: scrolled ? "blur(20px)" : "none",
      borderBottom: scrolled ? "1px solid var(--border)" : "none",
      transition: "background 0.3s, backdrop-filter 0.3s",
    }}>
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
        <span style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--gradient-primary)" }}>
          <Plane size={16} color="#fff" />
        </span>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>Rider Jets</span>
      </div>

      {/* Desktop links */}
      <nav style={{ display: "flex", alignItems: "center", gap: 4 }} aria-label="Main navigation">
        {!isSignedIn ? (
          <>
            {[["Ecosystem","ecosystem"],["Lifecycle","lifecycle"],["Dashboard","dashboard"],["Value","value"]].map(([label, id]) => (
              <button key={id} onClick={() => scroll(id)} style={navLinkStyle}>{label}</button>
            ))}
            <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 8px" }} />
            <button onClick={onSignIn} style={navLinkStyle}>Sign in</button>
            <button onClick={onSignIn} style={ctaSmallStyle}>Get started</button>
          </>
        ) : (
          <>
            {[["Dispatch","dispatch"],["Drivers","drivers"],["Vehicles","vehicles"]].map(([label, id]) => (
              <button key={id} onClick={() => onGoToApp()} style={navLinkStyle}>{label}</button>
            ))}
            <button onClick={onGoToApp} style={ctaSmallStyle}>Open app</button>
            <button onClick={onSignOut} style={navLinkStyle}>Sign out</button>
          </>
        )}
      </nav>

      {/* Mobile menu toggle */}
      <button onClick={() => setMenuOpen(v => !v)} aria-label="Toggle menu" style={{ display: "none", background: "none", border: "none", color: "var(--foreground)", cursor: "pointer", marginLeft: 12 }}>
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
    </header>
  );
}

/* ─── Hero ────────────────────────────────────────────────── */
function Hero({ onSignIn }: { onSignIn: () => void }) {
  return (
    <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 24px 80px", position: "relative" }}>
      {/* Aurora */}
      <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "10%", left: "20%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, hsla(243,75%,62%,0.15) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "5%", right: "15%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, hsla(270,70%,62%,0.10) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", inset: 0, opacity: 0.2, backgroundImage: "radial-gradient(circle, hsl(215 20% 22%) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ position: "relative", zIndex: 1, maxWidth: 760 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--primary)", background: "hsla(243,75%,62%,0.12)", border: "1px solid hsla(243,75%,62%,0.25)", padding: "4px 14px", borderRadius: 99, display: "inline-block", marginBottom: 24 }}>
          Logistics · Dispatch · Intelligence
        </span>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 24 }}>
          Freight that moves<br />
          <span style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            at the speed of trust
          </span>
        </h1>
        <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "var(--muted-foreground)", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 40px" }}>
          A unified command cockpit connecting dispatchers, drivers, and recipients — with AI routing and real-time visibility at every step.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={onSignIn} style={{ ...heroCta, background: "var(--gradient-primary)", boxShadow: "0 0 32px var(--primary-glow)" }}>
            Get started free <ArrowRight size={16} />
          </button>
          <button onClick={() => document.getElementById("lifecycle")?.scrollIntoView({ behavior: "smooth" })} style={{ ...heroCta, background: "none", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}>
            See how it works
          </button>
        </div>
      </motion.div>
    </section>
  );
}

/* ─── Ecosystem ───────────────────────────────────────────── */
function Ecosystem() {
  const blocks = [
    { icon: <Users size={24} />, title: "Logistics Partners", role: "The Dispatchers", desc: "Create orders, monitor fleet progress, and ensure loads are delivered on time from a single command cockpit." },
    { icon: <Truck size={24} />, title: "Riders / Drivers", role: "The Operators", desc: "Receive clear route instructions, update delivery statuses, and safely transport loads with mobile-first tools." },
    { icon: <Package size={24} />, title: "Recipients", role: "The End Customers", desc: "Receive accurate delivery estimates and secure handoffs with live tracking by order number." },
    { icon: <Zap size={24} />, title: "AI Assistant", role: "The Virtual Coordinator", desc: "Answer partner questions, calculate optimal routes, and flag potential delays before they happen." },
  ];

  return (
    <section id="ecosystem" style={{ padding: "100px 24px", maxWidth: 1100, margin: "0 auto" }}>
      <SectionLabel>The Ecosystem</SectionLabel>
      <SectionTitle>Everyone has a role.<br />One platform connects them all.</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginTop: 56 }}>
        {blocks.map((b, i) => (
          <motion.div key={b.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.4 }}
            style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: 28, display: "flex", flexDirection: "column", gap: 14 }}>
            <span style={{ width: 44, height: 44, borderRadius: 12, background: "hsla(243,75%,62%,0.12)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>{b.icon}</span>
            <div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--primary)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{b.role}</p>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{b.title}</h3>
              <p style={{ fontSize: 14, color: "var(--muted-foreground)", lineHeight: 1.6 }}>{b.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ─── Lifecycle ───────────────────────────────────────────── */
function Lifecycle() {
  const steps = [
    { n: "01", title: "Order Creation", sub: "Partner → System", desc: "A Partner logs in and creates a shipment — source, destination, load weight, and recipient details." },
    { n: "02", title: "AI Optimization", sub: "System → AI", desc: "Before a truck moves, AI analyzes weight and destination to suggest the most efficient route and ETA." },
    { n: "03", title: "Dispatch & Transit", sub: "Partner → Rider", desc: "The Partner assigns the optimized load to a vetted Rider who receives exact details on their device." },
    { n: "04", title: "Active Tracking", sub: "Rider → Partner & Recipient", desc: "As the Rider updates status, the Partner's dashboard updates in real-time and the Recipient is notified." },
    { n: "05", title: "Delivery & Resolution", sub: "Rider → Recipient", desc: "The Rider arrives, the Recipient confirms drop-off, and the order is marked complete instantly." },
  ];

  return (
    <section id="lifecycle" style={{ padding: "100px 24px", background: "hsla(222,24%,9%,0.6)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <SectionLabel>The Lifecycle</SectionLabel>
        <SectionTitle>Five steps from order<br />to delivered.</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 0, marginTop: 56, maxWidth: 720, margin: "56px auto 0" }}>
          {steps.map((s, i) => (
            <motion.div key={s.n} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.4 }}
              style={{ display: "flex", gap: 24, paddingBottom: i < steps.length - 1 ? 40 : 0, position: "relative" }}>
              {/* Line */}
              {i < steps.length - 1 && <div style={{ position: "absolute", left: 19, top: 44, bottom: 0, width: 2, background: "linear-gradient(to bottom, var(--primary), transparent)" }} />}
              <span style={{ width: 40, height: 40, borderRadius: "50%", background: "hsla(243,75%,62%,0.15)", border: "1px solid var(--primary)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{s.n}</span>
              <div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted-foreground)", letterSpacing: "0.08em", marginBottom: 4 }}>{s.sub}</p>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, marginBottom: 6 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "var(--muted-foreground)", lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Dashboard Preview ───────────────────────────────────── */
function DashboardPreview({ onSignIn }: { onSignIn: () => void }) {
  const mockRows = [
    { order: "RJ-20250601-0042", driver: "Ravi Kumar", vehicle: "Tata Ace", expense: "₹4,200", status: "IN_PROGRESS", statusLabel: "In Progress", color: "var(--status-transit)" },
    { order: "RJ-20250601-0041", driver: "Suresh M.", vehicle: "Large Truck", expense: "₹18,500", status: "COMPLETED", statusLabel: "Completed", color: "var(--status-delivered)" },
    { order: "RJ-20250601-0040", driver: "Anand P.", vehicle: "Small Truck", expense: "₹7,800", status: "PENDING", statusLabel: "Pending", color: "var(--status-pending)" },
    { order: "RJ-20250601-0039", driver: "Kiran B.", vehicle: "Auto", expense: "₹1,100", status: "BLOCKED", statusLabel: "Blocked", color: "var(--status-blocked)" },
  ];

  return (
    <section id="dashboard" style={{ padding: "100px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <SectionLabel>The Cockpit</SectionLabel>
        <SectionTitle>Your entire fleet,<br />one glance away.</SectionTitle>
        <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          style={{ marginTop: 48, background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", overflow: "hidden", boxShadow: "0 0 80px hsla(243,75%,62%,0.08)" }}>
          {/* Mock topbar */}
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted-foreground)", marginLeft: 8 }}>dispatch.riderjets.com</span>
          </div>
          {/* Mock KPI strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, borderBottom: "1px solid var(--border)", background: "var(--border)" }}>
            {[["12", "In Progress"], ["48", "Completed"], ["7", "Pending"], ["2", "Blocked"]].map(([n, l]) => (
              <div key={l} style={{ background: "var(--card)", padding: "16px 20px" }}>
                <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 4 }}>{l}</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 24, fontWeight: 600 }}>{n}</p>
              </div>
            ))}
          </div>
          {/* Mock table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Order #", "Driver", "Vehicle", "Expense", "Status"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockRows.map((r) => (
                  <tr key={r.order} style={{ borderBottom: "1px solid hsla(215,20%,22%,0.4)" }}>
                    <td style={{ padding: "12px 16px", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--primary)" }}>{r.order}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>{r.driver}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--muted-foreground)" }}>{r.vehicle}</td>
                    <td style={{ padding: "12px 16px", fontFamily: "var(--font-mono)", fontSize: 13 }}>{r.expense}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, fontSize: 12, color: r.color, background: `${r.color}1a`, border: `1px solid ${r.color}33` }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: r.color }} />{r.statusLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* CTA overlay */}
          <div style={{ padding: "20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "center" }}>
            <button onClick={onSignIn} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 24px", borderRadius: "var(--radius-md)", background: "var(--gradient-primary)", border: "none", color: "#fff", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 14, boxShadow: "0 0 20px var(--primary-glow)" }}>
              Open your cockpit <ArrowRight size={15} />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Value ───────────────────────────────────────────────── */
function Value() {
  const items = [
    { icon: <CheckCircle2 size={20} />, title: "Frictionless Handoffs", desc: "Everyone has exactly the information they need, exactly when they need it." },
    { icon: <Zap size={20} />, title: "Proactive Problem Solving", desc: "Partners don't wait on hold. The AI Agent resolves issues and answers questions instantly." },
    { icon: <BarChart3 size={20} />, title: "Operational Clarity", desc: "A single source of truth for where every package is at any given moment." },
    { icon: <Shield size={20} />, title: "Vetted Network", desc: "Only verified drivers and vehicles reach your dispatch queue — enforced at every layer." },
  ];

  return (
    <section id="value" style={{ padding: "100px 24px", background: "hsla(222,24%,9%,0.6)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <SectionLabel>The Value</SectionLabel>
        <SectionTitle>Built for operators<br />who can't afford downtime.</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginTop: 56 }}>
          {items.map((item, i) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.35 }}
              style={{ display: "flex", flexDirection: "column", gap: 12, padding: 24, background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)" }}>
              <span style={{ color: "var(--primary)" }}>{item.icon}</span>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600 }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: "var(--muted-foreground)", lineHeight: 1.6 }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA Strip ───────────────────────────────────────────── */
function CTAStrip({ onSignIn }: { onSignIn: () => void }) {
  return (
    <section style={{ padding: "100px 24px", textAlign: "center" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}
        style={{ maxWidth: 600, margin: "0 auto" }}>
        <SectionLabel>Get Started</SectionLabel>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 16 }}>
          Ready to move freight<br />smarter?
        </h2>
        <p style={{ color: "var(--muted-foreground)", fontSize: 16, marginBottom: 36, lineHeight: 1.6 }}>
          Join dispatchers already running their operations on Rider Jets.
        </p>
        <button onClick={onSignIn} style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 32px", borderRadius: "var(--radius-md)", background: "var(--gradient-primary)", border: "none", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, boxShadow: "0 0 40px var(--primary-glow)" }}>
          Start dispatching <ArrowRight size={18} />
        </button>
      </motion.div>
    </section>
  );
}

/* ─── Helpers ─────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--primary)", marginBottom: 12, textAlign: "center" }}>
      {children}
    </p>
  );
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 4vw, 44px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15, textAlign: "center" }}>
      {children}
    </h2>
  );
}

const navLinkStyle: React.CSSProperties = {
  background: "none", border: "none", color: "var(--muted-foreground)",
  cursor: "pointer", padding: "6px 12px", borderRadius: "var(--radius-sm)",
  fontSize: 14, fontFamily: "var(--font-body)",
  transition: "color 0.15s",
};
const ctaSmallStyle: React.CSSProperties = {
  background: "var(--gradient-primary)", border: "none", color: "#fff",
  cursor: "pointer", padding: "7px 16px", borderRadius: "var(--radius-md)",
  fontSize: 14, fontFamily: "var(--font-body)", fontWeight: 500,
  boxShadow: "0 0 16px var(--primary-glow)", marginLeft: 4,
};
const heroCta: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 8,
  padding: "13px 28px", borderRadius: "var(--radius-md)",
  border: "none", color: "#fff", cursor: "pointer",
  fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16,
  transition: "opacity 0.15s",
};

/* ─── Page export ─────────────────────────────────────────── */
export default function Landing({ isSignedIn, onSignIn, onSignOut, onGoToApp }: Props) {
  return (
    <div style={{ background: "var(--background)", minHeight: "100vh" }}>
      <Nav isSignedIn={isSignedIn} onSignIn={onSignIn} onSignOut={onSignOut} onGoToApp={onGoToApp} />
      <Hero onSignIn={onSignIn} />
      <Ecosystem />
      <Lifecycle />
      <DashboardPreview onSignIn={onSignIn} />
      <Value />
      <CTAStrip onSignIn={onSignIn} />
      <footer style={{ textAlign: "center", padding: "24px", borderTop: "1px solid var(--border)", color: "var(--muted-foreground)", fontSize: 13, fontFamily: "var(--font-mono)" }}>
        © {new Date().getFullYear()} Rider Jets · All rights reserved
      </footer>
    </div>
  );
}
