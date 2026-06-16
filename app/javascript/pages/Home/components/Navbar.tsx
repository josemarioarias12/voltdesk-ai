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

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 1000,
        transition: "background 0.3s, backdrop-filter 0.3s, border-color 0.3s",
        background: scrolled ? "rgba(13,27,42,0.88)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(2,128,144,0.2)" : "1px solid transparent",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#028090,#02C39A)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>P</span>
          </div>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>
            PulseDesk <span style={{ color: "#02C39A" }}>AI</span>
          </span>
        </a>

        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {NAV_LINKS.map((link) => (
            <a key={link.label} href={link.href}
              style={{ color: "#94a3b8", fontSize: 14, textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/login" style={{ color: "#94a3b8", fontSize: 14, textDecoration: "none" }}>Sign in</a>
          <motion.a href="/login"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            style={{ background: "#028090", color: "#fff", fontSize: 14, fontWeight: 600, padding: "8px 20px", borderRadius: 8, textDecoration: "none" }}
          >
            Request Demo
          </motion.a>
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            style={{ background: "transparent", border: "none", color: "#fff", fontSize: 22, cursor: "pointer" }}
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
            style={{ overflow: "hidden", background: "rgba(13,27,42,0.97)", borderTop: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              {NAV_LINKS.map((link) => (
                <a key={link.label} href={link.href}
                  style={{ color: "#94a3b8", fontSize: 15, textDecoration: "none" }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <a href="/login" style={{ color: "#02C39A", fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
                Request Demo →
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
