import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NAV_LINKS } from "./constants";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 20);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileMenuOpen(false);
  };

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .nav-desktop-links { display: none !important; }
          .nav-signin { display: none !important; }
          .nav-hamburger { display: flex !important; }
        }
        @media (min-width: 769px) {
          .nav-hamburger { display: none !important; }
        }
      `}</style>

      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          zIndex: 1000,
          transition: "background 0.3s, backdrop-filter 0.3s, border-color 0.3s",
          background: scrolled ? "rgba(13,27,42,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(2,128,144,0.2)" : "1px solid transparent",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>

          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, overflow: 'hidden', flexShrink: 0 }}>
              <img src="/pulsedesk-navy.svg" alt="VoltDesk AI" style={{ width: 34, height: 34 }} />
            </div>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 16, letterSpacing: "-0.3px" }}>
              VoltDesk <span style={{ color: "#02C39A" }}>AI</span>
            </span>
          </a>

          <div className="nav-desktop-links" style={{ display: "flex", gap: 8, alignItems: "center" }}>
           {NAV_LINKS.map((link) => (
               <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleAnchorClick(e, link.href)}
                style={{ color: "#94a3b8", fontSize: 14, textDecoration: "none", padding: "6px 14px", borderRadius: 8, transition: "color 0.2s, background 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "transparent"; }}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <a
              href="/login"
              className="nav-signin"
              style={{ color: "#94a3b8", fontSize: 14, textDecoration: "none", padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", transition: "color 0.2s, border-color 0.2s, background 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "transparent"; }}
            >
              Sign in
            </a>
            <motion.a
              href="/login"
              whileHover={{ scale: 1.04, boxShadow: "0 0 20px rgba(2,128,144,0.5)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              style={{ background: "linear-gradient(135deg,#028090,#02C39A)", color: "#fff", fontSize: 14, fontWeight: 600, padding: "8px 20px", borderRadius: 8, textDecoration: "none", whiteSpace: "nowrap" }}
            >
              Request Demo
            </motion.a>

            <button
              className="nav-hamburger"
              onClick={() => setMobileMenuOpen((v) => !v)}
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", width: 36, height: 36, borderRadius: 8, cursor: "pointer", display: "none", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              style={{ overflow: "hidden", background: "rgba(13,27,42,0.98)", borderTop: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 4 }}>
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={(e) => handleAnchorClick(e, link.href)}
                    style={{ color: "#94a3b8", fontSize: 15, textDecoration: "none", padding: "10px 12px", borderRadius: 8, transition: "color 0.2s, background 0.2s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "transparent"; }}
                  >
                    {link.label}
                  </a>
                ))}
                <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "8px 0" }} />
                <a href="/login" style={{ color: "#94a3b8", fontSize: 15, textDecoration: "none", padding: "10px 12px", borderRadius: 8 }}>Sign in</a>
                <a href="/login" style={{ color: "#fff", fontSize: 15, fontWeight: 600, textDecoration: "none", padding: "10px 12px", borderRadius: 8, background: "linear-gradient(135deg,#028090,#02C39A)", textAlign: "center", marginTop: 4 }}>
                  Request Demo
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}