import { useEffect, useCallback, useState } from "react";
import { motion, useScroll, useSpring, useInView, AnimatePresence } from "framer-motion";
import { useRef } from "react";
import Navbar from "./components/Navbar";
import DashboardMockup from "./components/DashboardMockup";
import XAIPanelMockup from "./components/XAIPanelMockup";
import AnimatedCounter from "./components/AnimatedCounter";
import ParticleCanvas from "./components/ParticleCanvas";
import { STATS, FEATURES, TESTIMONIALS, TECH_STACK, FOOTER_SECTIONS } from "./components/constants";

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: "#fff", color: "#1E293B", overflowX: "hidden" }}>
      <motion.div style={{ scaleX, transformOrigin: "left", position: "fixed", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#028090,#02C39A)", zIndex: 9999 }} />

      <Navbar />

      {/* Hero */}
      <section style={{ background: "#0D1B2A", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 80, paddingBottom: 80, position: "relative", overflow: "hidden" }}>
        <ParticleCanvas />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 50% at 50% 30%, rgba(2,128,144,0.13) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px", textAlign: "center", position: "relative", zIndex: 1, width: "100%" }}>
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ display: "inline-block", marginBottom: 32 }}>
            <motion.div animate={{ boxShadow: ["0 0 0 0 rgba(2,195,154,0.4)", "0 0 0 8px rgba(2,195,154,0)", "0 0 0 0 rgba(2,195,154,0)"] }} transition={{ duration: 2.5, repeat: Infinity }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(2,195,154,0.08)", border: "1px solid rgba(2,195,154,0.35)", borderRadius: 100, padding: "6px 18px" }}>
              <span style={{ color: "#02C39A", fontSize: 12 }}>✦</span>
              <span style={{ color: "#02C39A", fontSize: 13, fontWeight: 500 }}>Now with AI Agent Orchestration</span>
            </motion.div>
          </motion.div>

          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            <motion.h1 variants={fadeUp} style={{ fontSize: "clamp(36px,6vw,72px)", fontWeight: 800, lineHeight: 1.1, color: "#fff", margin: "0 0 24px", letterSpacing: "-0.02em" }}>
              The Operating System<br />for Modern{" "}
              <span style={{ background: "linear-gradient(135deg,#028090 0%,#02C39A 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Enterprises</span>
            </motion.h1>
            <motion.p variants={fadeUp} style={{ fontSize: "clamp(16px,2.2vw,20px)", color: "#94a3b8", lineHeight: 1.65, maxWidth: 560, margin: "0 auto 40px" }}>
              PulseDesk AI unifies support, HR, IT assets, and facilities under one intelligent platform that classifies, predicts, and acts — automatically.
            </motion.p>
            <motion.div variants={fadeUp} style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 48 }}>
              <motion.a href="/login" whileHover={{ scale: 1.04, boxShadow: "0 0 32px rgba(2,128,144,0.55)" }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#028090", color: "#fff", fontWeight: 700, fontSize: 16, padding: "14px 32px", borderRadius: 10, textDecoration: "none" }}>
                Request Demo →
              </motion.a>
              <motion.a href="/login" whileHover={{ scale: 1.04, background: "rgba(255,255,255,0.09)" }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", color: "#fff", fontWeight: 600, fontSize: 16, padding: "14px 32px", borderRadius: 10, textDecoration: "none", border: "1px solid rgba(255,255,255,0.14)" }}>
                View Live Demo →
              </motion.a>
            </motion.div>
            <motion.div variants={fadeUp} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex" }}>
                  {["https://i.pravatar.cc/40?img=1","https://i.pravatar.cc/40?img=5","https://i.pravatar.cc/40?img=12","https://i.pravatar.cc/40?img=23","https://i.pravatar.cc/40?img=31"].map((src, i) => (
                    <img key={i} src={src} alt="user" style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid #0D1B2A", marginLeft: i > 0 ? -8 : 0, objectFit: "cover" }} />
                  ))}
                </div>
                <span style={{ color: "#64748b", fontSize: 13 }}>Trusted by 500+ teams</span>
              </div>
              <span style={{ color: "#1e3a5f" }}>·</span>
              <span style={{ color: "#64748b", fontSize: 13 }}>99.9% uptime</span>
              <span style={{ color: "#1e3a5f" }}>·</span>
              <span style={{ color: "#64748b", fontSize: 13 }}>{"<"} 3s AI classification</span>
            </motion.div>
          </motion.div>
          <DashboardMockup />
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: "#fff", padding: "72px 24px", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 32, textAlign: "center" }}>
          {STATS.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}>
              <p style={{ fontSize: "clamp(32px,4vw,52px)", fontWeight: 800, color: "#028090", lineHeight: 1, marginBottom: 8, letterSpacing: "-0.02em" }}>
                {stat.prefix}<AnimatedCounter value={stat.value} />{stat.suffix}
              </p>
              <p style={{ color: "#64748b", fontSize: 14 }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ background: "#f8fafc", padding: "96px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 800, color: "#0f172a", marginBottom: 12, letterSpacing: "-0.02em" }}>Everything your operations need</h2>
            <p style={{ color: "#64748b", fontSize: 18 }}>One platform. Every team. Full AI.</p>
          </motion.div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 24 }}>
            {FEATURES.map((feature) => (
              <motion.div key={feature.title} variants={fadeUp} whileHover={{ y: -6, boxShadow: "0 16px 48px rgba(2,128,144,0.12)" }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{ background: "#fff", borderRadius: 16, padding: 28, border: "1px solid #e2e8f0", cursor: "default" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(2,128,144,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>{feature.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{feature.title}</h3>
                <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.65, margin: 0 }}>{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* AI Explainability */}
      <section id="demo" style={{ background: "#0D1B2A", padding: "96px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 64, alignItems: "center" }}>
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <p style={{ color: "#028090", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 16 }}>✦ Powered by Multi-Provider AI</p>
            <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, color: "#fff", marginBottom: 20, lineHeight: 1.15, letterSpacing: "-0.02em" }}>AI that explains itself</h2>
            <p style={{ color: "#64748b", fontSize: 17, lineHeight: 1.7, marginBottom: 40 }}>Every decision is transparent, auditable, and reversible. No black boxes.</p>
            {[
              { icon: "👁️", title: "XAI Panel", desc: "See exactly why the AI classified each ticket — signal by signal." },
              { icon: "📊", title: "Confidence Score", desc: "Red-flag when AI is uncertain. Always know when to review manually." },
              { icon: "📋", title: "Full Audit Log", desc: "Every prompt, token count, and cost tracked and exportable." },
            ].map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                style={{ display: "flex", gap: 16, marginBottom: 24 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(2,195,154,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{item.icon}</div>
                <div>
                  <p style={{ color: "#fff", fontWeight: 600, fontSize: 15, marginBottom: 4 }}><span style={{ color: "#02C39A" }}>✦ </span>{item.title}</p>
                  <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.55, margin: 0 }}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
          <div style={{ display: "flex", justifyContent: "center" }}><XAIPanelMockup /></div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ background: "#f8fafc", padding: "96px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 800, color: "#0f172a", textAlign: "center", marginBottom: 56, letterSpacing: "-0.02em" }}>
            Built for enterprise teams
          </motion.h2>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 24 }}>
            {TESTIMONIALS.map((t) => (
              <motion.div key={t.name} variants={fadeUp} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{ background: "#fff", borderRadius: 16, padding: 28, border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                  {Array.from({ length: 5 }).map((_, i) => <span key={i} style={{ color: "#f59e0b", fontSize: 16 }}>★</span>)}
                </div>
                <p style={{ color: "#1e293b", fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>"{t.quote}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#028090,#02C39A)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>{t.initials}</div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: "#0f172a", margin: 0 }}>{t.name}</p>
                    <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Tech Stack */}
      <section style={{ background: "#fff", padding: "72px 24px", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Built on technology you trust</h2>
            <p style={{ color: "#64748b", fontSize: 15, marginBottom: 48 }}>Open standards. No vendor lock-in.</p>
          </motion.div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}
            style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 28 }}>
            {TECH_STACK.map((tech) => (
              <motion.div key={tech.name} variants={fadeUp} whileHover={{ scale: 1.1, y: -4 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "default" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, border: "1px solid #e2e8f0" }}>{tech.icon}</div>
                <span style={{ color: "#64748b", fontSize: 13 }}>{tech.name}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "linear-gradient(135deg,#028090 0%,#02C39A 100%)", padding: "96px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.08) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 600, margin: "0 auto" }}>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, color: "#fff", marginBottom: 16, letterSpacing: "-0.02em" }}>
            Ready to transform your operations?
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            style={{ color: "rgba(255,255,255,0.8)", fontSize: 18, marginBottom: 40 }}>
            Start your demo today — no credit card required.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <motion.a href="/login" whileHover={{ scale: 1.05, boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}
              style={{ background: "#fff", color: "#028090", fontWeight: 700, fontSize: 16, padding: "14px 32px", borderRadius: 10, textDecoration: "none" }}>
              Request Demo
            </motion.a>
            <motion.a href="/login" whileHover={{ scale: 1.05, background: "rgba(255,255,255,0.18)" }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}
              style={{ background: "rgba(255,255,255,0.1)", color: "#fff", fontWeight: 600, fontSize: 16, padding: "14px 32px", borderRadius: 10, textDecoration: "none", border: "1px solid rgba(255,255,255,0.3)" }}>
              Schedule a call →
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: "#0D1B2A", padding: "64px 24px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 48, marginBottom: 48 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#028090,#02C39A)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>P</span>
                </div>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>PulseDesk <span style={{ color: "#02C39A" }}>AI</span></span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#64748b", marginBottom: 20 }}>The intelligent operating platform for modern enterprises.</p>
              <div style={{ display: "flex", gap: 10 }}>
                {["𝕏", "in"].map((icon, i) => (
                  <a key={i} href="#" style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: 14, textDecoration: "none", border: "1px solid rgba(255,255,255,0.08)" }}>{icon}</a>
                ))}
              </div>
            </div>
            {FOOTER_SECTIONS.map((section) => (
              <div key={section.title}>
                <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16 }}>{section.title}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {section.links.map((link) => (
                    <a key={link.label} href={link.href} style={{ color: "#64748b", fontSize: 14, textDecoration: "none", transition: "color 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#cbd5e1")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}>{link.label}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <p style={{ color: "#334155", fontSize: 13 }}>© 2026 PulseDesk AI. All rights reserved.</p>
            <p style={{ color: "#334155", fontSize: 13 }}>❤ Made in Costa Rica</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
