import { motion } from "framer-motion";

export default function XAIPanelMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: "easeOut" as const }}
      style={{ borderRadius: 20, overflow: "hidden", background: "#0a1520", border: "1px solid rgba(2,195,154,0.3)", maxWidth: 420, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}
    >
      <div style={{ background: "#028090", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#fff", fontSize: 12 }}>⚡</span>
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>AI Risk Assessment — Powered by GPT-4o</span>
        </div>
        <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: "monospace" }}>TK-00291</span>
      </div>
      <div style={{ padding: 20 }}>
        <p style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Classification</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {["IT — Network", "Priority: High", "SLA: 4h"].map((tag) => (
            <span key={tag} style={{ background: "rgba(2,128,144,0.2)", color: "#02C39A", border: "1px solid rgba(2,195,154,0.3)", borderRadius: 100, padding: "4px 12px", fontSize: 12 }}>
              {tag}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <p style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>Confidence Score</p>
          <span style={{ color: "#02C39A", fontSize: 13, fontWeight: 700 }}>0.87</span>
        </div>
        <div style={{ height: 8, borderRadius: 100, background: "rgba(255,255,255,0.08)", marginBottom: 6 }}>
          <motion.div
            style={{ background: "linear-gradient(90deg, #028090, #02C39A)", height: "100%", borderRadius: 100 }}
            initial={{ width: 0 }}
            whileInView={{ width: "87%" }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </div>
        <p style={{ color: "#02C39A", fontSize: 11, marginBottom: 20 }}>High Confidence — Auto-routing enabled</p>
        <p style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Signals</p>
        {[
          { signal: 'Keywords: "VPN", "cannot connect", "remote"', score: "+0.42" },
          { signal: "Requester history: 3 IT tickets prior", score: "+0.28" },
          { signal: "Ticket time: Monday 9am — peak IT hour", score: "+0.17" },
        ].map((item) => (
          <div key={item.signal} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ color: "#94a3b8", fontSize: 12, flex: 1 }}>{item.signal}</span>
            <span style={{ color: "#02C39A", fontSize: 12, fontWeight: 600, marginLeft: 12 }}>{item.score}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
