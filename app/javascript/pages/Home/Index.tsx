import { useCallback } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import Navbar from "./components/Navbar";
import DashboardMockup from "./components/DashboardMockup";
import XAIPanelMockup from "./components/XAIPanelMockup";
import AnimatedCounter from "./components/AnimatedCounter";
import ParticleCanvas from "./components/ParticleCanvas";
import { STATS, FEATURES, TESTIMONIALS, TECH_STACK, FOOTER_SECTIONS, PRICING_PLANS } from "./components/constants";

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#02C39A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  const handleAnchorClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

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
            <motion.div
              animate={{ boxShadow: ["0 0 0 0 rgba(2,195,154,0.4)", "0 0 0 8px rgba(2,195,154,0)", "0 0 0 0 rgba(2,195,154,0)"] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(2,195,154,0.08)", border: "1px solid rgba(2,195,154,0.35)", borderRadius: 100, padding: "6px 18px" }}
            >
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
              <motion.a
                href="/login"
                whileHover={{ scale: 1.04, boxShadow: "0 0 32px rgba(2,128,144,0.55)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#028090,#02C39A)", color: "#fff", fontWeight: 700, fontSize: 16, padding: "14px 32px", borderRadius: 10, textDecoration: "none" }}
              >
                Request Demo →
              </motion.a>
              <motion.a
                href="/login"
                whileHover={{ scale: 1.04, background: "rgba(255,255,255,0.09)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", color: "#fff", fontWeight: 600, fontSize: 16, padding: "14px 32px", borderRadius: 10, textDecoration: "none", border: "1px solid rgba(255,255,255,0.14)" }}
              >
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
      <section style={{ background: "#fff", padding: "80px 24px", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 32, textAlign: "center" }}>
          {STATS.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}>
              <p style={{ fontSize: "clamp(36px,4vw,56px)", fontWeight: 800, color: "#028090", lineHeight: 1, marginBottom: 8, letterSpacing: "-0.03em" }}>
                {stat.prefix}<AnimatedCounter value={stat.value} />{stat.suffix}
              </p>
              <p style={{ color: "#64748b", fontSize: 14, fontWeight: 500 }}>{stat.label}</p>
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
              <motion.a
                key={feature.title}
                href={feature.href}
                variants={fadeUp}
                whileHover={{ y: -6, boxShadow: "0 20px 48px rgba(2,128,144,0.14)", borderColor: "rgba(2,195,154,0.4)" }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{ background: "#fff", borderRadius: 16, padding: 28, border: "1px solid #e2e8f0", textDecoration: "none", display: "block", cursor: "pointer" }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(2,128,144,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, color: "#028090" }}
                  dangerouslySetInnerHTML={{ __html: feature.icon.replace('<svg', '<svg width="22" height="22"') }}
                />
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{feature.title}</h3>
                <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.65, margin: 0 }}>{feature.description}</p>
              </motion.a>
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
              { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#02C39A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`, title: "XAI Panel", desc: "See exactly why the AI classified each ticket — signal by signal." },
              { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#02C39A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`, title: "Confidence Score", desc: "Red-flag when AI is uncertain. Always know when to review manually." },
              { icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#02C39A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`, title: "Full Audit Log", desc: "Every prompt, token count, and cost tracked and exportable." },
            ].map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.12 }}
                style={{ display: "flex", gap: 16, marginBottom: 24 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(2,195,154,0.1)", border: "1px solid rgba(2,195,154,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                  dangerouslySetInnerHTML={{ __html: item.icon.replace('<svg', '<svg width="18" height="18"') }}
                />
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
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: 12 }}>Built for enterprise teams</h2>
            <p style={{ color: "#64748b", fontSize: 17 }}>Trusted by operations leaders across industries.</p>
          </motion.div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 24 }}>
            {TESTIMONIALS.map((t) => (
              <motion.div key={t.name} variants={fadeUp} whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(0,0,0,0.08)", borderColor: "#e2e8f0" }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{ background: "#fff", borderRadius: 20, padding: 32, border: "1px solid #e2e8f0", position: "relative" }}>
                <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                  {Array.from({ length: 5 }).map((_, i) => <span key={i} style={{ color: "#f59e0b", fontSize: 15 }}>★</span>)}
                </div>
                <p style={{ color: "#1e293b", fontSize: 15, lineHeight: 1.75, marginBottom: 24, fontStyle: "italic" }}>"{t.quote}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <img src={t.avatar} alt={t.name} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid #e2e8f0" }} />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", margin: 0 }}>{t.name}</p>
                    <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ background: "#fff", padding: "96px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ color: "#028090", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>✦ Pricing</p>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 800, color: "#0f172a", marginBottom: 12, letterSpacing: "-0.02em" }}>Simple, transparent pricing</h2>
            <p style={{ color: "#64748b", fontSize: 18 }}>Start free. Scale as you grow. No hidden fees.</p>
          </motion.div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 24, alignItems: "stretch" }}>
            {PRICING_PLANS.map((plan) => (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                whileHover={{ y: plan.highlight ? -4 : -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{
                  background: plan.highlight ? "linear-gradient(160deg,#0D1B2A 0%,#0a2030 100%)" : "#fff",
                  borderRadius: 20,
                  padding: 32,
                  border: plan.highlight ? "1px solid rgba(2,195,154,0.4)" : "1px solid #e2e8f0",
                  position: "relative",
                  boxShadow: plan.highlight ? "0 24px 64px rgba(2,128,144,0.2)" : "none",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {plan.badge && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#028090,#02C39A)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 16px", borderRadius: 100, whiteSpace: "nowrap", letterSpacing: "0.05em" }}>
                    {plan.badge}
                  </div>
                )}
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: plan.highlight ? "#fff" : "#0f172a", marginBottom: 8 }}>{plan.name}</h3>
                  <p style={{ color: plan.highlight ? "#64748b" : "#64748b", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>{plan.description}</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                    {plan.price !== null ? (
                      <>
                        <span style={{ fontSize: 48, fontWeight: 800, color: plan.highlight ? "#fff" : "#0f172a", letterSpacing: "-0.03em" }}>${plan.price}</span>
                        <span style={{ color: "#64748b", fontSize: 15 }}>/{plan.period}</span>
                      </>
                    ) : (
                      <span style={{ fontSize: 36, fontWeight: 800, color: plan.highlight ? "#fff" : "#0f172a", letterSpacing: "-0.02em" }}>Custom</span>
                    )}
                  </div>
                  {plan.price !== null && <p style={{ color: "#64748b", fontSize: 13 }}>per workspace · billed monthly</p>}
                </div>

                <div style={{ flex: 1, marginBottom: 28 }}>
                  {plan.features.map((feature) => (
                    <div key={feature} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                      <div style={{ flexShrink: 0, marginTop: 1 }}><CheckIcon /></div>
                      <span style={{ color: plan.highlight ? "#cbd5e1" : "#475569", fontSize: 14, lineHeight: 1.5 }}>{feature}</span>
                    </div>
                  ))}
                </div>

                <motion.a
                  href={plan.href}
                  whileHover={{ scale: 1.03, boxShadow: plan.highlight ? "0 8px 32px rgba(2,128,144,0.45)" : "0 4px 16px rgba(0,0,0,0.1)" }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "13px 24px",
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 15,
                    textDecoration: "none",
                    background: plan.highlight ? "linear-gradient(135deg,#028090,#02C39A)" : "transparent",
                    color: plan.highlight ? "#fff" : "#028090",
                    border: plan.highlight ? "none" : "2px solid #028090",
                  }}
                >
                  {plan.cta}
                </motion.a>
              </motion.div>
            ))}
          </motion.div>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }}
            style={{ textAlign: "center", color: "#94a3b8", fontSize: 14, marginTop: 40 }}>
            All plans include a 14-day free trial · No credit card required · Cancel anytime
          </motion.p>
        </div>
      </section>

      {/* Tech Stack */}
      <section id="api" style={{ background: "#f8fafc", padding: "72px 24px", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 8, letterSpacing: "-0.02em" }}>Built on technology you trust</h2>
            <p style={{ color: "#64748b", fontSize: 15, marginBottom: 52 }}>Open standards. No vendor lock-in.</p>
          </motion.div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}
            style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 20 }}>
            {TECH_STACK.map((tech) => (
              <motion.div key={tech.name} variants={fadeUp} whileHover={{ scale: 1.1, y: -6, boxShadow: "0 12px 32px rgba(0,0,0,0.1)" }} transition={{ type: "spring", stiffness: 400, damping: 20 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, cursor: "default" }}>
                <div
                  style={{ width: 60, height: 60, borderRadius: 16, background: tech.bg, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(0,0,0,0.06)", padding: 12 }}
                  dangerouslySetInnerHTML={{ __html: tech.svg.replace('<svg', '<svg width="32" height="32"') }}
                />
                <span style={{ color: "#64748b", fontSize: 12, fontWeight: 500 }}>{tech.name}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "linear-gradient(135deg,#028090 0%,#02C39A 100%)", padding: "96px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.08) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 20%, rgba(0,0,0,0.08) 0%, transparent 50%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 600, margin: "0 auto" }}>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, color: "#fff", marginBottom: 16, letterSpacing: "-0.02em" }}>
            Ready to transform your operations?
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            style={{ color: "rgba(255,255,255,0.82)", fontSize: 18, marginBottom: 40 }}>
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
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#028090,#02C39A)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(2,195,154,0.3)" }}>
                  <span style={{ color: "#fff", fontSize: 16, fontWeight: 800 }}>P</span>
                </div>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>PulseDesk <span style={{ color: "#02C39A" }}>AI</span></span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#64748b", marginBottom: 20 }}>The intelligent operating platform for modern enterprises.</p>
              <div style={{ display: "flex", gap: 10 }}>
                <a href="https://x.com" target="_blank" rel="noreferrer"
                  style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", border: "1px solid rgba(255,255,255,0.08)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#64748b"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.732-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer"
                  style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", border: "1px solid rgba(255,255,255,0.08)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#64748b"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              </div>
            </div>
            {FOOTER_SECTIONS.map((section) => (
              <div key={section.title}>
                <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16 }}>{section.title}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {section.links.map((link) => (
                    <a key={link.label} href={link.href}
                      onClick={link.href.startsWith("#") ? (e) => handleAnchorClick(e, link.href) : undefined}
                      style={{ color: "#64748b", fontSize: 14, textDecoration: "none", transition: "color 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#cbd5e1")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
                    >
                      {link.label}
                    </a>
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
