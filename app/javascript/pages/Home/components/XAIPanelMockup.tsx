import { useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function XAIPanelMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [confidence, setConfidence] = useState(0);
  const [activeSignal, setActiveSignal] = useState<number | null>(null);
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    if (!inView) return;
    const timer = setTimeout(() => {
      let val = 0;
      const interval = setInterval(() => {
        val += 2;
        if (val >= 87) { setConfidence(87); clearInterval(interval); }
        else setConfidence(val);
      }, 20);
      return () => clearInterval(interval);
    }, 400);
    return () => clearTimeout(timer);
  }, [inView]);

  useEffect(() => {
    const t = setInterval(() => setPulse((p) => !p), 1800);
    return () => clearInterval(t);
  }, []);

  const signals = [
    { signal: 'Keywords: "VPN", "cannot connect", "remote"', score: "+0.42", bar: 84 },
    { signal: "Requester history: 3 IT tickets prior", score: "+0.28", bar: 56 },
    { signal: "Ticket time: Monday 9am — peak IT hour", score: "+0.17", bar: 34 },
  ];

  const tags = ["IT — Network", "Priority: High", "SLA: 4h"];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      whileHover={{ y: -6, boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(2,195,154,0.4)" }}
      style={{ borderRadius: 20, overflow: "hidden", background: "#0a1520", border: "1px solid rgba(2,195,154,0.25)", maxWidth: 440, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}
    >
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#028090,#026d7a)", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <motion.div
            animate={{ scale: pulse ? 1 : 0.85, opacity: pulse ? 1 : 0.6 }}
            transition={{ duration: 0.4 }}
            style={{ width: 8, height: 8, borderRadius: "50%", background: "#02C39A", boxShadow: "0 0 8px rgba(2,195,154,0.8)" }}
          />
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>AI Risk Assessment — Powered by GPT-4o</span>
        </div>
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontFamily: "monospace", background: "rgba(0,0,0,0.2)", padding: "2px 8px", borderRadius: 6 }}>TK-00291</span>
      </div>

      <div style={{ padding: 22 }}>
        {/* Classification */}
        <p style={{ color: "#475569", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600, marginBottom: 10 }}>Classification</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
          {tags.map((tag, i) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.2 + i * 0.1, type: "spring", stiffness: 400, damping: 20 }}
              style={{ background: "rgba(2,128,144,0.18)", color: "#02C39A", border: "1px solid rgba(2,195,154,0.3)", borderRadius: 100, padding: "5px 14px", fontSize: 12, fontWeight: 500 }}
            >
              {tag}
            </motion.span>
          ))}
        </div>

        {/* Confidence Score */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <p style={{ color: "#475569", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>Confidence Score</p>
          <motion.span
            animate={{ color: confidence > 80 ? "#02C39A" : "#f59e0b" }}
            style={{ fontSize: 20, fontWeight: 800, color: "#02C39A", letterSpacing: "-0.02em" }}
          >
            {(confidence / 100).toFixed(2)}
          </motion.span>
        </div>
        <div style={{ height: 6, borderRadius: 100, background: "rgba(255,255,255,0.06)", marginBottom: 8, overflow: "hidden" }}>
          <motion.div
            style={{ background: "linear-gradient(90deg,#028090,#02C39A)", height: "100%", borderRadius: 100 }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 0.05 }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 24 }}>
          <motion.div
            animate={{ opacity: pulse ? 1 : 0.3 }}
            transition={{ duration: 0.4 }}
            style={{ width: 5, height: 5, borderRadius: "50%", background: "#02C39A" }}
          />
          <p style={{ color: "#02C39A", fontSize: 11, fontWeight: 500 }}>High Confidence — Auto-routing enabled</p>
        </div>

        {/* Signals */}
        <p style={{ color: "#475569", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600, marginBottom: 12 }}>Signals</p>
        {signals.map((item, i) => (
          <motion.div
            key={item.signal}
            initial={{ opacity: 0, x: -16 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.6 + i * 0.15, duration: 0.5 }}
            onHoverStart={() => setActiveSignal(i)}
            onHoverEnd={() => setActiveSignal(null)}
            style={{ marginBottom: 14, cursor: "default" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <motion.span
                animate={{ color: activeSignal === i ? "#e2e8f0" : "#94a3b8" }}
                style={{ fontSize: 12, flex: 1 }}
              >
                {item.signal}
              </motion.span>
              <motion.span
                animate={{ scale: activeSignal === i ? 1.1 : 1 }}
                style={{ color: "#02C39A", fontSize: 13, fontWeight: 700, marginLeft: 12 }}
              >
                {item.score}
              </motion.span>
            </div>
            {/* Signal bar */}
            <div style={{ height: 3, borderRadius: 100, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
              <motion.div
                style={{ background: "linear-gradient(90deg,#028090,#02C39A)", height: "100%", borderRadius: 100 }}
                initial={{ width: 0 }}
                animate={inView ? { width: `${item.bar}%` } : {}}
                transition={{ delay: 0.8 + i * 0.15, duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}