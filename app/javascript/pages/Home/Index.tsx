import { useCallback, useState } from "react";
import { Head } from "@inertiajs/react";
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

const TECH_DESCRIPTIONS: Record<string, string> = {
  "Rails": "Backend framework · API & business logic",
  "PostgreSQL": "Primary database · ACID compliant",
  "Redis": "Cache & job queues · Sub-ms latency",
  "OpenAI": "GPT-4o · Classification & RAG",
  "Anthropic": "Claude Sonnet · Complex analysis",
  "Google AI": "Gemini Flash · High-speed ops",
  "React": "Frontend UI · React 19 + TypeScript",
  "pgvector": "Vector search · 1536-dim embeddings",
};

export default function LandingPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [showContact, setShowContact] = useState(false);
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
      <Head title="PulseDesk AI" />
      <motion.div style={{ scaleX, transformOrigin: "left", position: "fixed", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#028090,#02C39A)", zIndex: 9999 }} />

      <Navbar />

      {/* Hero */}
      <section style={{ background: "#0D1B2A", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 80, paddingBottom: 80, position: "relative", overflow: "hidden" }}>
        <ParticleCanvas />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 50% at 50% 30%, rgba(2,128,144,0.13) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", textAlign: "center", position: "relative", zIndex: 1, width: "100%" }}>
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
            <motion.h1 variants={fadeUp} style={{ fontSize: "clamp(48px,7vw,88px)", fontWeight: 800, lineHeight: 1.05, color: "#fff", margin: "0 0 24px", letterSpacing: "-0.04em" }}>
              The Operating System for Modern{" "}
              <span style={{ background: "linear-gradient(135deg,#028090 0%,#02C39A 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Enterprises</span>
            </motion.h1>
            <motion.p variants={fadeUp} style={{ fontSize: "clamp(16px,2.2vw,20px)", color: "#94a3b8", lineHeight: 1.65, maxWidth: 560, margin: "0 auto 40px" }}>
              PulseDesk AI unifies support, HR, IT assets, and facilities under one intelligent platform that classifies, predicts, and acts — automatically.
            </motion.p>
            <motion.div variants={fadeUp} style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 48 }}>
              <motion.a
                href="#pricing"
                onClick={(e) => handleAnchorClick(e, "#pricing")}
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
                whileHover="hover"
                initial="rest"
                animate="rest"
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{ background: "#fff", borderRadius: 16, padding: 28, border: "1px solid #e2e8f0", textDecoration: "none", display: "flex", flexDirection: "column", cursor: "pointer", position: "relative", overflow: "hidden" }}
              >
                {/* Hover background gradient */}
                <motion.div
                  variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
                  transition={{ duration: 0.3 }}
                  style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(2,128,144,0.04) 0%, rgba(2,195,154,0.06) 100%)", pointerEvents: "none" }}
                />
                {/* Hover border glow */}
                <motion.div
                  variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
                  transition={{ duration: 0.3 }}
                  style={{ position: "absolute", inset: 0, borderRadius: 16, border: "1.5px solid rgba(2,195,154,0.5)", pointerEvents: "none" }}
                />
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                 {/* Icon */}
                  <motion.div
                    variants={{
                      rest: { scale: 1, background: "rgba(2,128,144,0.18)", boxShadow: "0 0 0 1px rgba(2,128,144,0.2)" },
                      hover: { scale: 1.12, background: "rgba(2,195,154,0.25)", boxShadow: "0 0 24px rgba(2,195,154,0.4)" }
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <div
                      style={{ color: "#028090", display: "flex", alignItems: "center", justifyContent: "center" }}
                      dangerouslySetInnerHTML={{ __html: feature.icon.replace('<svg', '<svg width="22" height="22"') }}
                    />
                  </motion.div>
                  {/* Badge */}
                  {feature.badge && (
                    <span style={{ background: "rgba(2,128,144,0.08)", color: "#028090", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100, border: "1px solid rgba(2,128,144,0.15)", letterSpacing: "0.03em" }}>
                      {feature.badge}
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{feature.title}</h3>
                <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.65, margin: 0, flex: 1 }}>{feature.description}</p>
                {/* Arrow */}
                <motion.div
                  variants={{ rest: { opacity: 0, x: -6 }, hover: { opacity: 1, x: 0 } }}
                  transition={{ duration: 0.2 }}
                  style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 6, color: "#028090", fontSize: 13, fontWeight: 600 }}
                >
                  Explore feature
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </motion.div>
              </motion.a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* AI Explainability — Linear style */}
      <section id="demo" style={{ background: "#0D1B2A", padding: "112px 24px", position: "relative", overflow: "hidden" }}>
        {/* Background grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(2,128,144,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(2,128,144,0.04) 1px, transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />
        {/* Radial glow */}
        <div style={{ position: "absolute", top: "20%", right: "10%", width: 400, height: 400, background: "radial-gradient(circle, rgba(2,195,154,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
          {/* Top label */}
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#02C39A", boxShadow: "0 0 8px rgba(2,195,154,0.8)" }} />
            <span style={{ color: "#02C39A", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em" }}>Powered by Multi-Provider AI</span>
          </motion.div>

          {/* Main grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>

            {/* Left — text */}
            <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <h2 style={{ fontSize: "clamp(36px,5vw,64px)", fontWeight: 800, color: "#fff", marginBottom: 20, lineHeight: 1.05, letterSpacing: "-0.03em" }}>
                AI that<br />
                <span style={{ background: "linear-gradient(135deg,#028090,#02C39A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>explains itself</span>
              </h2>
              <p style={{ color: "#64748b", fontSize: 18, lineHeight: 1.75, marginBottom: 56, maxWidth: 440 }}>
                Every decision is transparent, auditable, and reversible. No black boxes. Ever.
              </p>

              {/* Feature items — Linear timeline style */}
              <div style={{ position: "relative" }}>
                {/* Vertical line */}
                <div style={{ position: "absolute", left: 19, top: 20, bottom: 20, width: 1, background: "linear-gradient(to bottom, rgba(2,195,154,0.6), rgba(2,128,144,0.2), transparent)" }} />

                {[
                  {
                    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#02C39A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
                    title: "XAI Panel",
                    desc: "See exactly why the AI classified each ticket — signal by signal. Full transparency on every decision.",
                    tag: "Explainability",
                  },
                  {
                    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#02C39A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
                    title: "Confidence Score",
                    desc: "Red-flag when AI is uncertain. Always know when to review manually before executing.",
                    tag: "Trust",
                  },
                  {
                    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#02C39A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
                    title: "Full Audit Log",
                    desc: "Every prompt, token count, cost, and latency tracked and exportable. SOC 2 ready.",
                    tag: "Compliance",
                  },
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.15 }}
                    whileHover={{ x: 6 }}
                    style={{ display: "flex", gap: 20, marginBottom: 36, cursor: "default" }}
                  >
                    {/* Icon circle */}
                    <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: "50%", background: "rgba(2,195,154,0.1)", border: "1px solid rgba(2,195,154,0.3)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(2,195,154,0.15)", zIndex: 1 }}
                      dangerouslySetInnerHTML={{ __html: item.svg.replace('<svg', '<svg width="18" height="18"') }}
                    />
                    <div style={{ paddingTop: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{item.title}</span>
                        <span style={{ background: "rgba(2,195,154,0.1)", color: "#02C39A", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 100, border: "1px solid rgba(2,195,154,0.2)", letterSpacing: "0.05em" }}>{item.tag}</span>
                      </div>
                      <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.65, margin: 0 }}>{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right — XAI Panel */}
            <motion.div
              initial={{ opacity: 0, x: 40, y: 20 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ display: "flex", justifyContent: "center" }}
            >
              <XAIPanelMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ background: "#0D1B2A", padding: "96px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(2,128,144,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(2,128,144,0.03) 1px, transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ color: "#02C39A", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>✦ Customer Stories</p>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginBottom: 12 }}>Built for enterprise teams</h2>
            <p style={{ color: "#475569", fontSize: 17 }}>Trusted by operations leaders across industries.</p>
          </motion.div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 20 }}>
            {TESTIMONIALS.map((t) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                whileHover={{ y: -6, borderColor: "rgba(2,195,154,0.4)", boxShadow: "0 24px 48px rgba(0,0,0,0.3)" }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{ background: "rgba(255,255,255,0.04)", borderRadius: 20, padding: 32, border: "1px solid rgba(255,255,255,0.08)", position: "relative", backdropFilter: "blur(8px)" }}
              >
                {/* Quote mark */}
                <div style={{ position: "absolute", top: 20, right: 24, color: "rgba(2,195,154,0.15)", fontSize: 64, fontFamily: "Georgia, serif", lineHeight: 1, fontWeight: 700, userSelect: "none" }}>"</div>
                {/* Stars */}
                <div style={{ display: "flex", gap: 3, marginBottom: 20 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.span key={i} initial={{ opacity: 0, scale: 0 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.06, type: "spring", stiffness: 400 }}
                      style={{ color: "#f59e0b", fontSize: 14 }}>★</motion.span>
                  ))}
                </div>
                <p style={{ color: "#cbd5e1", fontSize: 15, lineHeight: 1.8, marginBottom: 28, fontStyle: "italic", position: "relative" }}>"{t.quote}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 14, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <img src={t.avatar} alt={t.name} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(2,195,154,0.4)", flexShrink: 0 }} />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: "#fff", margin: 0 }}>{t.name}</p>
                    <p style={{ color: "#475569", fontSize: 13, margin: 0 }}>{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ background: "#0a0f1a", padding: "96px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(2,128,144,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(2,128,144,0.04) 1px, transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 600, background: "radial-gradient(ellipse, rgba(2,195,154,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0}} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 64, position: "relative" }}>
            <p style={{ color: "#02C39A", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>✦ Pricing</p>
            <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, color: "#fff", marginBottom: 12, letterSpacing: "-0.02em" }}>Simple, transparent pricing</h2>
            <p style={{ color: "#64748b", fontSize: 18, marginBottom: 32 }}>Start free. Scale as you grow. No hidden fees.</p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 0, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 4 }}>
              <button onClick={() => setBilling("monthly")} style={{ padding: "8px 20px", borderRadius: 9, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, transition: "all 0.2s", background: billing === "monthly" ? "rgba(2,128,144,0.9)" : "transparent", color: billing === "monthly" ? "#fff" : "#64748b" }}>Monthly</button>
              <button onClick={() => setBilling("annual")} style={{ padding: "8px 20px", borderRadius: 9, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, transition: "all 0.2s", background: billing === "annual" ? "rgba(2,128,144,0.9)" : "transparent", color: billing === "annual" ? "#fff" : "#64748b", display: "flex", alignItems: "center", gap: 8 }}>
                Annual
                <span style={{ background: "linear-gradient(135deg,#028090,#02C39A)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, letterSpacing: "0.05em" }}>-20%</span>
              </button>
            </div>
          </motion.div>
         <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 24, alignItems: "stretch" }}>
            {PRICING_PLANS.map((plan) => {
              const displayPrice = plan.price !== null ? (billing === "annual" ? Math.round(plan.price * 0.8) : plan.price) : null;
              return (
                <motion.div
                  key={plan.name}
                  variants={fadeUp}
                  whileHover={{ y: plan.highlight ? -8 : -6, boxShadow: plan.highlight ? "0 32px 80px rgba(2,128,144,0.35)" : "0 16px 48px rgba(0,0,0,0.2)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{
                    background: plan.highlight ? "linear-gradient(160deg,#0c1f35 0%,#0a1628 100%)" : "rgba(255,255,255,0.03)",
                    borderRadius: 24,
                    padding: plan.highlight ? 36 : 32,
                    border: plan.highlight ? "1px solid rgba(2,195,154,0.5)" : "1px solid rgba(255,255,255,0.08)",
                    position: "relative",
                    boxShadow: plan.highlight ? "0 24px 64px rgba(2,128,144,0.25), inset 0 1px 0 rgba(255,255,255,0.08)" : "none",
                    display: "flex",
                    flexDirection: "column",
                    transform: plan.highlight ? "scale(1.03)" : "scale(1)",
                  }}
                >
                  {plan.highlight && (
                    <div style={{ position: "absolute", inset: 0, borderRadius: 24, background: "radial-gradient(ellipse at top, rgba(2,195,154,0.08) 0%, transparent 60%)", pointerEvents: "none" }} />
                  )}
                  {plan.badge && (
                    <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#028090,#02C39A)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "5px 18px", borderRadius: 100, whiteSpace: "nowrap", letterSpacing: "0.08em", boxShadow: "0 4px 16px rgba(2,195,154,0.4)" }}>
                      {plan.badge}
                    </div>
                  )}
                  <div style={{ marginBottom: 24, position: "relative" }}>
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{plan.name}</h3>
                    <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>{plan.description}</p>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                      {displayPrice !== null ? (
                        <>
                          <span style={{ fontSize: 56, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>${displayPrice}</span>
                          <span style={{ color: "#475569", fontSize: 15 }}>/mo</span>
                        </>
                      ) : (
                        <span style={{ fontSize: 40, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Custom</span>
                      )}
                    </div>
                    {displayPrice !== null && (
                      <p style={{ color: "#475569", fontSize: 13 }}>
                        per workspace · {billing === "annual" ? "billed annually" : "billed monthly"}
                        {billing === "annual" && <span style={{ color: "#02C39A", fontWeight: 600, marginLeft: 8 }}>Save 20%</span>}
                      </p>
                    )}
                  </div>
                  <div style={{ flex: 1, marginBottom: 28, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 24 }}>
                    {plan.features.map((feature) => (
                      <motion.div key={feature} whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14, cursor: "default" }}>
                        <div style={{ flexShrink: 0, marginTop: 1 }}><CheckIcon /></div>
                        <span style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.5 }}>{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                  <motion.button
                    onClick={() => plan.href === "#contact" ? setShowContact(true) : window.location.href = plan.href}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "center",
                      padding: "14px 24px",
                      borderRadius: 12,
                      fontWeight: 700,
                      fontSize: 15,
                      position: "relative",
                      background: plan.highlight ? "linear-gradient(135deg,#028090,#02C39A)" : "rgba(255,255,255,0.06)",
                      color: "#fff",
                      border: plan.highlight ? "none" : "1px solid rgba(255,255,255,0.12)",
                      boxShadow: plan.highlight ? "0 4px 24px rgba(2,128,144,0.4)" : "none",
                      cursor: "pointer",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {plan.cta}
                  </motion.button>
                </motion.div>
              );
            })}
          </motion.div>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{once: true }} transition={{ delay: 0.4 }}
            style={{ textAlign: "center", color: "#475569", fontSize: 14, marginTop: 48 }}>
            All plans include a 14-day free trial · No credit card required · Cancel anytime
          </motion.p>
        </div>
      </section>

      {/* Tech Stack */}
      <section id="api" style={{ background: "#f8fafc", padding: "96px 0", borderTop: "1px solid #e2e8f0", position: "relative", overflow: "hidden" }}>
        <style>{`
          @keyframes marquee-left { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          @keyframes marquee-right { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
          .marquee-left { display: flex; gap: 16px; width: max-content; animation: marquee-left 32s linear infinite; }
          .marquee-right { display: flex; gap: 16px; width: max-content; animation: marquee-right 28s linear infinite; }
          .marquee-left:hover, .marquee-right:hover { animation-play-state: paused; }
        `}</style>
        <div style={{ textAlign: "center", marginBottom: 72, padding: "0 24px" }}>
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p style={{ color: "#028090", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>✦ Infrastructure</p>
            <h2 style={{ fontSize: "clamp(28px,3vw,44px)", fontWeight: 800, color: "#0f172a", marginBottom: 12, letterSpacing: "-0.02em" }}>Built on technology you trust</h2>
            <p style={{ color: "#64748b", fontSize: 17 }}>Open standards. No vendor lock-in. Enterprise-grade reliability.</p>
          </motion.div>
        </div>
        <div style={{ position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 160, background: "linear-gradient(90deg, #f8fafc, transparent)", zIndex: 2, pointerEvents: "none" }} />
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 160, background: "linear-gradient(270deg, #f8fafc, transparent)", zIndex: 2, pointerEvents: "none" }} />
          {/* Row 1 — left to right */}
          <div className="marquee-left">
            {[...TECH_STACK, ...TECH_STACK].map((tech, index) => (
              <div key={`row1-${tech.name}-${index}`}
                style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 28px", borderRadius: 18, background: "#fff", border: "1px solid #e2e8f0", cursor: "default", textAlign: "left", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minWidth: 260, flexShrink: 0, transition: "all 0.25s ease" }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,0.1)"; e.currentTarget.style.borderColor = "rgba(2,128,144,0.3)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ width: 52, height: 52, borderRadius: 14, background: tech.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid rgba(0,0,0,0.06)" }}
                  dangerouslySetInnerHTML={{ __html: tech.svg.replace('<svg', '<svg width="28" height="28"') }} />
                <div>
                  <p style={{ color: "#0f172a", fontSize: 16, fontWeight: 700, marginBottom: 3 }}>{tech.name}</p>
                  <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.4 }}>{TECH_DESCRIPTIONS[tech.name] ?? ""}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Row 2 — right to left */}
          <div className="marquee-right">
            {[...TECH_STACK.slice().reverse(), ...TECH_STACK.slice().reverse()].map((tech, index) => (
              <div key={`row2-${tech.name}-${index}`}
                style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 28px", borderRadius: 18, background: "#fff", border: "1px solid #e2e8f0", cursor: "default", textAlign: "left", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", minWidth: 260, flexShrink: 0, transition: "all 0.25s ease" }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,0.1)"; e.currentTarget.style.borderColor = "rgba(2,128,144,0.3)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ width: 52, height: 52, borderRadius: 14, background: tech.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid rgba(0,0,0,0.06)" }}
                  dangerouslySetInnerHTML={{ __html: tech.svg.replace('<svg', '<svg width="28" height="28"') }} />
                <div>
                  <p style={{ color: "#0f172a", fontSize: 16, fontWeight: 700, marginBottom: 3 }}>{tech.name}</p>
                  <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.4 }}>{TECH_DESCRIPTIONS[tech.name] ?? ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "linear-gradient(160deg, #0a2a30 0%, #028090 40%, #02C39A 100%)", padding: "120px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.07) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 20%, rgba(0,0,0,0.1) 0%, transparent 50%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "20%", left: "10%", width: 300, height: 300, background: "radial-gradient(ellipse, rgba(2,128,144,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "20%", right: "10%", width: 250, height: 250, background: "radial-gradient(ellipse, rgba(2,195,154,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 700, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(2,195,154,0.1)", border: "1px solid rgba(2,195,154,0.25)", borderRadius: 100, padding: "6px 16px", marginBottom: 32 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#02C39A", boxShadow: "0 0 8px rgba(2,195,154,0.8)" }} />
            <span style={{ color: "#02C39A", fontSize: 13, fontWeight: 600 }}>500+ enterprises already onboard</span>
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 }}
            style={{ fontSize: "clamp(32px,5vw,64px)", fontWeight: 800, color: "#fff", marginBottom: 20, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Stop managing chaos.<br />
            <span style={{ color: "#fff" }}>Start commanding it.</span>
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            style={{ color: "rgba(255,255,255,0.82)", fontSize: 18, marginBottom: 48, lineHeight: 1.7 }}>
            PulseDesk AI gives your team the intelligence layer<br />to classify, predict, and act — automatically.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}
            style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 48 }}>
            <motion.button onClick={() => setShowContact(true)} whileHover={{ scale: 1.04, boxShadow: "0 8px 40px rgba(2,128,144,0.5)" }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}
              style={{ background: "linear-gradient(135deg,#028090,#02C39A)", color: "#fff", fontWeight: 700, fontSize: 16, padding: "15px 36px", borderRadius: 12, border: "none", cursor: "pointer", boxShadow: "0 4px 24px rgba(2,128,144,0.35)", fontFamily: "Inter, sans-serif" }}>
              Request Demo →
            </motion.button>
            <motion.button onClick={() => setShowContact(true)} whileHover={{ scale: 1.04, borderColor: "rgba(2,195,154,0.5)", color: "#02C39A" }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}
              style={{ background: "transparent", color: "#fff", fontWeight: 600, fontSize: 16, padding: "15px 36px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
              Schedule a call
            </motion.button>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.25 }}
            style={{ display: "flex", justifyContent: "center", gap: 40, flexWrap: "wrap" }}>
            {[["99.9%", "Uptime SLA"], ["< 3s", "AI Classification"], ["SOC 2", "Compliant"], ["14-day", "Free Trial"]].map(([value, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <p style={{ color: "#fff", fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>{value}</p>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 2 }}>{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

   {/* Footer */}
      <footer style={{ background: "#0D1B2A", borderTop: "1px solid rgba(255,255,255,0.08)", padding: "72px 24px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr 1fr 1fr", gap: 32, marginBottom: 64 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#028090,#02C39A)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(2,195,154,0.3)" }}>
                  <span style={{ color: "#fff", fontSize: 16, fontWeight: 800 }}>P</span>
                </div>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>PulseDesk <span style={{ color: "#02C39A" }}>AI</span></span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: "#475569", marginBottom: 16, maxWidth: 260 }}>AI-native helpdesk that classifies, predicts, and acts. Built for teams that can't afford to slow down.</p>
              
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(2,195,154,0.08)", border: "1px solid rgba(2,195,154,0.2)", borderRadius: 20, padding: "6px 12px", width: "fit-content", marginBottom: 20 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#02C39A", boxShadow: "0 0 6px rgba(2,195,154,0.8)" }} />
                <span style={{ color: "#02C39A", fontSize: 12, fontWeight: 600 }}>All systems operational</span>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <a href="https://x.com" target="_blank" rel="noreferrer"
                  style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", border: "1px solid rgba(255,255,255,0.08)", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.16)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#64748b"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.732-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer"
                  style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", border: "1px solid rgba(255,255,255,0.08)", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.16)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#64748b"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              </div>
            </div>
            {FOOTER_SECTIONS.map((section) => (
              <div key={section.title}>
                <p style={{ color: "#64748b", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16 }}>{section.title}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {section.links.map((link) => (
                    <a key={link.label} href={link.href}
                      onClick={link.href.startsWith("#") ? (e) => handleAnchorClick(e, link.href) : undefined}
                      style={{ color: "#64748b", fontSize: 14, textDecoration: "none", transition: "color 0.15s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#02C39A"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#94a3b8"; }}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ position: "relative", paddingTop: 28 }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent 0%, rgba(2,128,144,0.4) 30%, rgba(2,195,154,0.4) 50%, rgba(2,128,144,0.4) 70%, transparent 100%)" }} />
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <p style={{ color: "#475569", fontSize: 13 }}>© 2026 PulseDesk AI · All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    {/* Contact Modal */}
      {showContact && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowContact(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#0D1B2A", border: "1px solid rgba(2,195,154,0.2)", borderRadius: 20, padding: 40, maxWidth: 480, width: "100%", position: "relative" }}
          >
            {/* Close */}
            <button
              onClick={() => setShowContact(false)}
              style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            {/* Header */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#02C39A", boxShadow: "0 0 8px rgba(2,195,154,0.8)" }} />
                <span style={{ color: "#02C39A", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>Enterprise Sales</span>
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 8, letterSpacing: "-0.02em" }}>Let's talk about your team</h3>
              <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.6 }}>Our team will reach out within 24 hours to schedule a personalized demo.</p>
            </div>

            {/* Fields */}
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 14, marginBottom: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" as const, letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>First name</label>
                  <input type="text" placeholder="Jose" style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box" as const }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" as const, letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Last name</label>
                  <input type="text" placeholder="Arias" style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box" as const }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" as const, letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Work email</label>
                <input type="email" placeholder="jose@company.com" style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box" as const }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" as const, letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Company</label>
                <input type="text" placeholder="Acme Corp" style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box" as const }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" as const, letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Message</label>
                <textarea placeholder="Tell us about your team size and use case…" rows={3} style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif", resize: "none", boxSizing: "border-box" as const }} />
              </div>
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowContact(false);
              }}
              style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg,#028090,#02C39A)", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "Inter, sans-serif", boxShadow: "0 4px 24px rgba(2,128,144,0.3)" }}
            >
              Send message →
            </motion.button>
            <p style={{ textAlign: "center" as const, fontSize: 12, color: "#334155", marginTop: 12 }}>We'll respond within 24 hours · No spam ever</p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
