import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";
import SparklineChart from "./SparklineChart";

export default function DashboardMockup() {
  const [activeKpi, setActiveKpi] = useState<number | null>(null);
  const [ticketHovered, setTicketHovered] = useState<number | null>(null);
  const [pulse, setPulse] = useState(true);
  const [liveValues, setLiveValues] = useState([47, 91, 38, 420]);
  const containerRef = useRef<HTMLDivElement>(null);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 150, damping: 20 });
  const springY = useSpring(rotateY, { stiffness: 150, damping: 20 });

  useEffect(() => {
    const t = setInterval(() => setPulse((p) => !p), 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setLiveValues((prev) => [
        prev[0] + Math.floor(Math.random() * 3) - 1,
        Math.min(99, Math.max(85, prev[1] + Math.floor(Math.random() * 3) - 1)),
        prev[2] + Math.floor(Math.random() * 3) - 1,
        prev[3] + Math.floor(Math.random() * 10) - 5,
      ]);
    }, 2500);
    return () => clearInterval(t);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    rotateY.set(dx * 12);
    rotateX.set(-dy * 8);
  }, [rotateX, rotateY]);

  const handleMouseLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
  }, [rotateX, rotateY]);

  const kpis = [
    { label: "Open Tickets", value: liveValues[0].toString(), delta: "+12%", positive: true },
    { label: "SLA Compliance", value: `${liveValues[1]}%`, delta: "-2%", positive: false },
    { label: "Avg Resolution", value: `${(liveValues[2] / 10).toFixed(1)}h`, delta: "-15%", positive: true },
    { label: "AI Cost Today", value: `$${(liveValues[3] / 100).toFixed(2)}`, delta: "normal", positive: true },
  ];

  const tickets = [
    { id: "TK-00321", title: "VPN issue" },
    { id: "TK-00258", title: "New employee setup" },
    { id: "TK-00339", title: "Printer offline" },
  ];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: "1200px", maxWidth: 780, margin: "56px auto 0", position: "relative" }}
    >
      <motion.div
        style={{ rotateX: springX, rotateY: springY, transformStyle: "preserve-3d" }}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >

        <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(2,128,144,0.3)", background: "#0D1B2A", boxShadow: "0 40px 80px rgba(0,0,0,0.6)" }}>
          {/* Browser chrome */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: "#0a1520", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
            <div style={{ flex: 1, marginLeft: 12, background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: "4px 12px", color: "#475569", fontSize: 12, fontFamily: "monospace", display: "flex", alignItems: "center", gap: 6 }}>
              <motion.div
                animate={{ opacity: pulse ? 1 : 0.2 }}
                transition={{ duration: 0.5 }}
                style={{ width: 6, height: 6, borderRadius: "50%", background: "#02C39A", flexShrink: 0 }}
              />
              app.pulsedesk.ai
            </div>
          </div>

          <div style={{ display: "flex", minHeight: 300 }}>
            {/* Sidebar */}
            <div style={{ width: 52, background: "#0a1520", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0", gap: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#028090,#02C39A)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>P</div>
              {["▦", "☰", "👤", "◉", "📊", "⚙"].map((ic, i) => (
                <motion.div key={i} whileHover={{ scale: 1.15 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, background: i === 0 ? "rgba(2,128,144,0.25)" : "transparent", color: i === 0 ? "#02C39A" : "#475569", cursor: "pointer" }}>
                  {ic}
                </motion.div>
              ))}
            </div>

            {/* Main content */}
            <div style={{ flex: 1, padding: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
                {kpis.map((kpi, i) => (
                  <motion.div
                    key={i}
                    onHoverStart={() => setActiveKpi(i)}
                    onHoverEnd={() => setActiveKpi(null)}
                    animate={{
                      borderColor: activeKpi === i ? "rgba(2,195,154,0.5)" : "rgba(255,255,255,0.07)",
                      background: activeKpi === i ? "rgba(2,128,144,0.15)" : "rgba(255,255,255,0.04)",
                    }}
                    transition={{ duration: 0.2 }}
                    style={{ borderRadius: 12, padding: "10px 12px", border: "1px solid rgba(255,255,255,0.07)", cursor: "default", position: "relative", overflow: "hidden" }}
                  >
                    {/* Shimmer */}
                    <motion.div
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
                      style={{ position: "absolute", top: 0, left: 0, width: "40%", height: "100%", background: "linear-gradient(90deg, transparent, rgba(2,195,154,0.07), transparent)", pointerEvents: "none" }}
                    />
                    <p style={{ color: "#475569", fontSize: 10, marginBottom: 4 }}>{kpi.label}</p>
                    <motion.p
                      key={kpi.value}
                      initial={{ opacity: 0.5, y: -4 }}
                      animate={{ opacity: 1, y: 0, color: activeKpi === i ? "#02C39A" : "#f1f5f9" }}
                      transition={{ duration: 0.3 }}
                      style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}
                    >
                      {kpi.value}
                    </motion.p>
                    <p style={{ color: kpi.positive ? "#02C39A" : "#ef4444", fontSize: 10, marginTop: 3 }}>{kpi.delta}</p>
                  </motion.div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ borderRadius: 12, padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <SparklineChart />
                </div>
                <div style={{ borderRadius: 12, padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <p style={{ color: "#475569", fontSize: 10, marginBottom: 8 }}>Recent Tickets</p>
                  {tickets.map((ticket, i) => (
                    <motion.div
                      key={ticket.id}
                      onHoverStart={() => setTicketHovered(i)}
                      onHoverEnd={() => setTicketHovered(null)}
                      animate={{ background: ticketHovered === i ? "rgba(2,128,144,0.15)" : "transparent", x: ticketHovered === i ? 3 : 0 }}
                      transition={{ duration: 0.15 }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, borderRadius: 6, padding: "3px 4px", cursor: "pointer" }}
                    >
                      <span style={{ color: "#028090", fontSize: 10, fontFamily: "monospace" }}>{ticket.id}</span>
                      <span style={{ color: "#94a3b8", fontSize: 10, flex: 1, marginLeft: 8 }}>{ticket.title}</span>
                      <motion.span
                        animate={{ scale: ticketHovered === i ? 1.1 : 1 }}
                        style={{ background: "linear-gradient(135deg,#028090,#02C39A)", color: "#fff", fontSize: 9, padding: "2px 5px", borderRadius: 4 }}
                      >
                        AI
                      </motion.span>
                    </motion.div>
                  ))}
                  <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 6 }}>
                    <motion.div
                      animate={{ opacity: pulse ? 1 : 0.2, scale: pulse ? 1 : 0.8 }}
                      transition={{ duration: 0.4 }}
                      style={{ width: 6, height: 6, borderRadius: "50%", background: "#02C39A", flexShrink: 0 }}
                    />
                    <span style={{ color: "#475569", fontSize: 9 }}>Live — updating every 3s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Glow shadow */}
      <motion.div
        animate={{ opacity: [0.4, 0.7, 0.4], scale: [0.95, 1, 0.95] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", inset: 0, zIndex: -2, borderRadius: 20, background: "radial-gradient(ellipse at center, rgba(2,128,144,0.25) 0%, transparent 70%)", filter: "blur(32px)", transform: "translateY(32px) scale(0.9)", pointerEvents: "none" }}
      />
    </div>
  );
}