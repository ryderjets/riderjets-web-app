import { useReducedMotion } from "framer-motion";
import TopBar from "./TopBar";
import SideNav from "./SideNav";
import type { NavId } from "./SideNav";

interface Props {
  children: React.ReactNode;
  activeNav: NavId;
  onNavChange: (id: NavId) => void;
  userEmail?: string;
  onSignOut: () => void;
}

export default function DispatchShell({ children, activeNav, onNavChange, userEmail, onSignOut }: Props) {
  const reduced = useReducedMotion();

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--background)", overflow: "hidden" }}>

      {/* Aurora layer */}
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: -10, pointerEvents: "none" }}>
        {/* Top-left glow */}
        <div style={{
          position: "absolute", top: -120, left: -120,
          width: 520, height: 520, borderRadius: "50%",
          background: "radial-gradient(circle, hsla(243,75%,62%,0.18) 0%, transparent 70%)",
          animation: reduced ? "none" : "auroraA 40s ease-in-out infinite alternate",
        }} />
        {/* Bottom-right glow */}
        <div style={{
          position: "absolute", bottom: -160, right: -160,
          width: 640, height: 640, borderRadius: "50%",
          background: "radial-gradient(circle, hsla(270,70%,62%,0.12) 0%, transparent 70%)",
          animation: reduced ? "none" : "auroraB 40s ease-in-out infinite alternate-reverse",
        }} />
        {/* Dot grid */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.3,
          backgroundImage: "radial-gradient(circle, hsl(215 20% 22%) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />
        {/* Top fade */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 80,
          background: "linear-gradient(to bottom, var(--background), transparent)",
        }} />
      </div>

      <TopBar userEmail={userEmail} onSignOut={onSignOut} />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <SideNav active={activeNav} onChange={onNavChange} onSignOut={onSignOut} />

        <main style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>
          <div style={{ maxWidth: 1440, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
            {children}
          </div>
        </main>
      </div>

      <style>{`
        @keyframes auroraA { 0%{transform:translate3d(0,0,0)} 100%{transform:translate3d(60px,40px,0)} }
        @keyframes auroraB { 0%{transform:translate3d(0,0,0)} 100%{transform:translate3d(-50px,-30px,0)} }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
}
